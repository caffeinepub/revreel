import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Send, Trash2, Loader2 } from 'lucide-react';
import { type DirectMessage, useGetConversation, useSendMessage, useMarkAsRead, useDeleteMessage, useGetUserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

function formatTime(timestamp: bigint): string {
  const date = new Date(Number(timestamp) / 1_000_000);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Conversation() {
  const { userId } = useParams({ from: '/app-layout/messages/$userId' });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const currentUserId = identity?.getPrincipal().toString();

  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useGetConversation(userId);
  const { data: otherProfile } = useGetUserProfile(userId);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead();
  const deleteMessage = useDeleteMessage();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Mark messages as read on mount
    messages.forEach((msg: DirectMessage) => {
      if (!msg.isRead && msg.toUser.toString() === currentUserId) {
        markAsRead.mutate({ otherUser: userId, messageId: msg.id });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async () => {
    if (!text.trim() || sendMessage.isPending) return;
    const msgText = text.trim();
    setText('');
    await sendMessage.mutateAsync({ otherUser: userId, text: msgText });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const otherName = otherProfile?.username || userId.slice(0, 8) + '...';

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card pt-safe">
        <button
          onClick={() => navigate({ to: '/inbox' })}
          className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-foreground"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-border flex-shrink-0">
            <img
              src={otherProfile?.avatarUrl || '/assets/generated/default-avatar.dim_128x128.png'}
              alt={otherName}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-bold text-foreground text-base truncate">{otherName}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-7 h-7 border-2 border-neon-orange border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-base">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg: DirectMessage) => {
            const isOwn = msg.fromUser.toString() === currentUserId;
            return (
              <div key={String(msg.id)} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
                <div className={`relative max-w-[75%] px-4 py-3 rounded-2xl text-sm ${
                  isOwn
                    ? 'bg-neon-orange text-black rounded-br-sm'
                    : 'bg-card border border-border text-foreground rounded-bl-sm'
                }`}>
                  <p className="leading-relaxed">{msg.text}</p>
                  <p className={`text-xs mt-1 ${isOwn ? 'text-black/60' : 'text-muted-foreground'}`}>
                    {formatTime(msg.timestamp)}
                  </p>
                  {isOwn && (
                    <button
                      onClick={() => deleteMessage.mutate({ otherUser: userId, messageId: msg.id })}
                      className="absolute -top-2 -left-2 w-7 h-7 flex items-center justify-center rounded-full bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/40"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-card pb-safe">
        <div className="flex items-end gap-3">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 px-4 py-3 rounded-2xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon-orange resize-none text-base"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sendMessage.isPending}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-neon-orange text-black hover:bg-neon-orange/90 disabled:opacity-50 transition-colors flex-shrink-0"
          >
            {sendMessage.isPending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
