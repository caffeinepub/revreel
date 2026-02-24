import React, { useState, useRef, useEffect } from 'react';
import { useParams } from '@tanstack/react-router';
import {
  type DirectMessage,
  useGetMessages,
  useSendMessage,
  useMarkAsRead,
  useDeleteMessage,
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
  const markAsRead = useMarkAsRead();
  const deleteMessage = useDeleteMessage();

  const myPrincipal = identity?.getPrincipal().toString();

  useEffect(() => {
    if (userId) {
      markAsRead.mutate({ otherUser: userId });
    }
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

  const handleDelete = (msg: DirectMessage) => {
    deleteMessage.mutate({ messageId: msg.id, otherUser: userId });
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
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              No messages yet. Say hello!
            </div>
          ) : (
            [...messages]
              .sort((a, b) => Number(a.timestamp) - Number(b.timestamp))
              .map((msg: DirectMessage) => {
                const isMe = msg.fromUser?.toString() === myPrincipal;
                return (
                  <div key={msg.id.toString()} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                    <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`px-4 py-2 rounded-2xl text-sm ${
                          isMe
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : 'bg-card border border-border rounded-bl-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-xs text-muted-foreground">{formatTime(msg.timestamp)}</span>
                        {isMe && (
                          <button
                            onClick={() => handleDelete(msg)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted"
                          >
                            <Trash2 className="w-3 h-3 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-border flex gap-2">
          <input
            value={msgText}
            onChange={(e) => setMsgText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-muted border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
            disabled={sendMessage.isPending}
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 flex-shrink-0"
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
