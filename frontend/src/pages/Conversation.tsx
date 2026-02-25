import React, { useState, useRef, useEffect } from 'react';
import { useParams } from '@tanstack/react-router';
import {
  type DirectMessage,
  useGetMessages,
  useSendMessage,
  useMarkMessagesRead,
  useGetUserProfile,
} from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import AuthGuard from '../components/AuthGuard';
import { Send, Loader2, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';

export default function Conversation() {
  const { userId } = useParams({ strict: false }) as { userId: string };
  const [msgText, setMsgText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const { identity } = useInternetIdentity();

  const { data: messages = [], isLoading } = useGetMessages(userId);
  const { data: otherProfile } = useGetUserProfile(userId);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkMessagesRead();

  const myPrincipal = identity?.getPrincipal().toString();

  useEffect(() => {
    if (userId) {
      markAsRead.mutate(userId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim() || !identity) return;
    try {
      await sendMessage.mutateAsync({ toUser: userId, text: msgText.trim() });
      setMsgText('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleDelete = (_msg: DirectMessage) => {
    // Delete message is client-side only; no backend method available
  };

  const formatTime = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1_000_000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AuthGuard>
      <div className="flex flex-col h-[calc(100svh-3.5rem)]">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
          <Link to="/inbox" className="p-1 rounded hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
            {otherProfile?.avatarUrl ? (
              <img src={otherProfile.avatarUrl} alt={otherProfile.username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-primary">
                {(otherProfile?.username || userId).slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm">{otherProfile?.username || userId.slice(0, 12) + '...'}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p className="text-sm">No messages yet. Say hello!</p>
            </div>
          ) : (
            messages.map((msg: DirectMessage) => {
              const isMine = msg.fromUser === myPrincipal || msg.fromUser === 'current-user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                      isMine
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted text-foreground rounded-bl-sm'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <p className={`text-xs mt-1 ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                  {isMine && (
                    <button
                      onClick={() => handleDelete(msg)}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-border flex gap-2 bg-card">
          <input
            value={msgText}
            onChange={(e) => setMsgText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-muted border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
            maxLength={1000}
            disabled={sendMessage.isPending}
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
            disabled={sendMessage.isPending || !msgText.trim()}
          >
            {sendMessage.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </AuthGuard>
  );
}
