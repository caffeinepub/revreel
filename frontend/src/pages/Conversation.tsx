import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { ArrowLeft, Send, Trash2, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import AuthGuard from '../components/AuthGuard';
import {
  useGetConversation,
  useGetUserProfile,
  useSendMessage,
  useMarkAsRead,
  useDeleteMessage,
} from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { type DirectMessage } from '../backend';
import { toast } from 'sonner';

function formatTime(timestamp: bigint): string {
  const msgTime = Number(timestamp) / 1_000_000;
  const now = Date.now();
  const diffMs = now - msgTime;
  const diffHour = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay >= 1) {
    return new Date(msgTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  return new Date(msgTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

interface MessageBubbleProps {
  message: DirectMessage;
  isMine: boolean;
  otherUserId: string;
  onDelete: (messageId: bigint) => void;
  isDeleting: boolean;
}

function MessageBubble({ message, isMine, onDelete, isDeleting }: MessageBubbleProps) {
  return (
    <div className={`flex items-end gap-2 mb-3 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`group flex flex-col max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed relative ${
            isMine
              ? 'bg-neon text-background rounded-br-sm font-medium'
              : 'bg-white/10 text-foreground border border-white/10 rounded-bl-sm backdrop-blur-sm'
          }`}
        >
          {message.text}
          {/* Delete button for own messages */}
          {isMine && (
            <button
              onClick={() => onDelete(message.id)}
              disabled={isDeleting}
              className="absolute -left-7 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-destructive/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
              aria-label="Delete message"
            >
              {isDeleting ? (
                <Loader2 className="w-3 h-3 text-white animate-spin" />
              ) : (
                <Trash2 className="w-3 h-3 text-white" />
              )}
            </button>
          )}
        </div>
        <span className="text-muted-foreground text-[10px] mt-1 px-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

function ConversationContent({ userId }: { userId: string }) {
  const { identity } = useInternetIdentity();
  const currentUserId = identity?.getPrincipal().toString();

  const { data: messages, isLoading } = useGetConversation(userId);
  const { data: otherProfile } = useGetUserProfile(userId);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead();
  const deleteMessage = useDeleteMessage();

  const [inputText, setInputText] = useState('');
  const [optimisticMessages, setOptimisticMessages] = useState<DirectMessage[]>([]);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const markedReadRef = useRef<Set<string>>(new Set());

  // Combine real messages with optimistic ones
  const allMessages = [...(messages ?? []), ...optimisticMessages].sort(
    (a, b) => Number(a.timestamp) - Number(b.timestamp)
  );

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages.length]);

  // Mark unread messages as read on load
  useEffect(() => {
    if (!messages || !currentUserId) return;
    messages.forEach((msg) => {
      const key = msg.id.toString();
      if (!msg.isRead && msg.toUser.toString() === currentUserId && !markedReadRef.current.has(key)) {
        markedReadRef.current.add(key);
        markAsRead.mutate({ otherUserId: userId, messageId: msg.id });
      }
    });
  }, [messages, currentUserId, userId]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !currentUserId) return;

    // Optimistic update
    const optimisticMsg: DirectMessage = {
      id: BigInt(Date.now()),
      fromUser: identity!.getPrincipal(),
      toUser: { toString: () => userId } as any,
      text,
      timestamp: BigInt(Date.now() * 1_000_000),
      isRead: false,
    };
    setOptimisticMessages((prev) => [...prev, optimisticMsg]);
    setInputText('');

    try {
      await sendMessage.mutateAsync({ toUserId: userId, text });
      // Remove optimistic message after real one arrives
      setOptimisticMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
    } catch {
      // Remove optimistic message on failure
      setOptimisticMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      toast.error('Failed to send message');
      setInputText(text);
    }
  };

  const handleDelete = async (messageId: bigint) => {
    const key = messageId.toString();
    setDeletingIds((prev) => new Set(prev).add(key));
    try {
      await deleteMessage.mutateAsync({ otherUserId: userId, messageId });
    } catch {
      toast.error('Failed to delete message');
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const otherAvatarSrc =
    otherProfile?.avatarUrl && otherProfile.avatarUrl.length > 0
      ? otherProfile.avatarUrl
      : otherProfile?.avatar?.getDirectURL() || '/assets/generated/default-avatar.dim_128x128.png';

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-background/95 backdrop-blur-sm border-b border-white/10 sticky top-0 z-10">
        <Link to="/inbox" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Link>
        <img
          src={otherAvatarSrc}
          alt={otherProfile?.username ?? 'User'}
          className="w-9 h-9 rounded-full object-cover border border-neon/30"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/assets/generated/default-avatar.dim_128x128.png';
          }}
        />
        <div className="flex-1 min-w-0">
          <Link to="/profile/$userId" params={{ userId }}>
            <span className="font-display text-base text-foreground hover:text-neon transition-colors truncate block">
              {otherProfile?.username ?? userId.slice(0, 10) + '…'}
            </span>
          </Link>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <Skeleton className={`h-10 rounded-2xl ${i % 2 === 0 ? 'w-48' : 'w-36'}`} />
              </div>
            ))}
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground py-16">
            <p className="font-display text-sm">START THE CONVERSATION</p>
            <p className="text-xs text-center">Send a message to {otherProfile?.username ?? 'this racer'}</p>
          </div>
        ) : (
          allMessages.map((msg) => {
            const isMine = msg.fromUser.toString() === currentUserId;
            return (
              <MessageBubble
                key={msg.id.toString()}
                message={msg}
                isMine={isMine}
                otherUserId={userId}
                onDelete={handleDelete}
                isDeleting={deletingIds.has(msg.id.toString())}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 px-4 py-3 bg-background/95 backdrop-blur-sm border-t border-white/10">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon/50 focus:bg-white/8 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || sendMessage.isPending}
            className="w-10 h-10 rounded-full bg-neon flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neon/90 transition-colors neon-glow"
            aria-label="Send message"
          >
            {sendMessage.isPending ? (
              <Loader2 className="w-4 h-4 text-background animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-background" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Conversation() {
  const params = useParams({ strict: false }) as { userId?: string };
  const userId = params.userId ?? '';

  return (
    <AuthGuard>
      <ConversationContent userId={userId} />
    </AuthGuard>
  );
}
