import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from '@tanstack/react-router';
import { ArrowLeft, Send, Trash2, Loader2 } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useGetConversation,
  useGetUserProfile,
  useSendMessage,
  useMarkAsRead,
  useDeleteMessage,
} from '../hooks/useQueries';
import { type DirectMessage } from '../backend';
import AuthGuard from '../components/AuthGuard';
import { toast } from 'sonner';

function timeAgo(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  const diff = Date.now() - ms;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

interface MessageBubbleProps {
  message: DirectMessage;
  isMine: boolean;
  onDelete?: (messageId: bigint) => void;
  isDeleting?: boolean;
}

function MessageBubble({ message, isMine, onDelete, isDeleting }: MessageBubbleProps) {
  return (
    <div className={`flex items-end gap-2 group ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isMine
            ? 'bg-neon text-primary-foreground rounded-br-sm shadow-neon-sm'
            : 'bg-card/80 text-foreground border border-border/60 rounded-bl-sm backdrop-blur-sm'
        }`}
      >
        <p>{message.text}</p>
        <p className={`text-[10px] mt-1 ${isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
          {timeAgo(message.timestamp)}
          {isMine && message.isRead && <span className="ml-1">✓✓</span>}
        </p>
      </div>
      {isMine && onDelete && (
        <button
          onClick={() => onDelete(message.id)}
          disabled={isDeleting}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
          aria-label="Delete message"
        >
          {isDeleting ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Trash2 className="w-3 h-3" />
          )}
        </button>
      )}
    </div>
  );
}

function ConversationContent() {
  const { userId } = useParams({ from: '/app-layout/messages/$userId' });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const currentPrincipal = identity?.getPrincipal().toString();

  const { data: otherUser } = useGetUserProfile(userId);
  const { data: messages = [], isLoading } = useGetConversation(userId);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead();
  const deleteMessage = useDeleteMessage();

  const [text, setText] = useState('');
  const [optimisticMessages, setOptimisticMessages] = useState<DirectMessage[]>([]);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const allMessages = [...messages, ...optimisticMessages].sort(
    (a, b) => Number(a.timestamp) - Number(b.timestamp)
  );

  // Mark unread messages as read on mount
  useEffect(() => {
    if (!messages.length || !currentPrincipal) return;
    const unread = messages.filter(
      (m) => !m.isRead && m.toUser.toString() === currentPrincipal
    );
    unread.forEach((m) => {
      markAsRead.mutate({ otherUser: userId, messageId: m.id });
    });
  }, [messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !identity) return;

    const messageText = text.trim();
    setText('');

    const optimistic: DirectMessage = {
      id: BigInt(Date.now()),
      fromUser: identity.getPrincipal(),
      toUser: identity.getPrincipal(), // placeholder
      text: messageText,
      timestamp: BigInt(Date.now()) * BigInt(1_000_000),
      isRead: false,
    };
    setOptimisticMessages((prev) => [...prev, optimistic]);

    try {
      await sendMessage.mutateAsync({ toUser: userId, text: messageText });
      setOptimisticMessages([]);
    } catch {
      toast.error('Failed to send message.');
      setOptimisticMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setText(messageText);
    }
  };

  const handleDelete = async (messageId: bigint) => {
    const idStr = messageId.toString();
    setDeletingIds((prev) => new Set(prev).add(idStr));
    try {
      await deleteMessage.mutateAsync({ otherUser: userId, messageId });
    } catch {
      toast.error('Failed to delete message.');
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(idStr);
        return next;
      });
    }
  };

  const otherUserAvatarUrl =
    otherUser?.avatarUrl || '/assets/generated/default-avatar.dim_128x128.png';

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-background/90 backdrop-blur-sm shrink-0">
        <button
          onClick={() => navigate({ to: '/inbox' })}
          className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <Link
          to="/profile/$userId"
          params={{ userId }}
          className="flex items-center gap-2.5 flex-1 min-w-0 group"
        >
          <img
            src={otherUserAvatarUrl}
            alt={otherUser?.username ?? 'User'}
            className="w-9 h-9 rounded-full object-cover border border-neon/30"
          />
          <div className="min-w-0">
            <p className="font-display text-sm text-foreground group-hover:text-neon transition-colors truncate">
              {otherUser?.username ?? 'Loading...'}
            </p>
            <p className="text-[10px] text-muted-foreground">Tap to view profile</p>
          </div>
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-neon" />
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-neon/10 border border-neon/20 flex items-center justify-center">
              <Send className="w-7 h-7 text-neon/60" />
            </div>
            <p className="font-display text-lg text-foreground">START THE CONVO</p>
            <p className="text-sm text-muted-foreground">Send a message to {otherUser?.username ?? 'this user'}</p>
          </div>
        ) : (
          allMessages.map((message) => {
            const isMine = message.fromUser.toString() === currentPrincipal;
            return (
              <MessageBubble
                key={message.id.toString()}
                message={message}
                isMine={isMine}
                onDelete={isMine ? handleDelete : undefined}
                isDeleting={deletingIds.has(message.id.toString())}
              />
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="shrink-0 flex items-end gap-2 px-4 py-3 border-t border-border/40 bg-background/90 backdrop-blur-sm"
      >
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(e as unknown as React.FormEvent);
            }
          }}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 bg-card/60 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-neon/50 transition-colors"
          style={{ maxHeight: '120px' }}
        />
        <button
          type="submit"
          disabled={!text.trim() || sendMessage.isPending}
          className="w-10 h-10 rounded-xl bg-neon text-primary-foreground flex items-center justify-center hover:bg-neon/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-neon-sm"
        >
          {sendMessage.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
}

export default function Conversation() {
  return (
    <AuthGuard>
      <ConversationContent />
    </AuthGuard>
  );
}
