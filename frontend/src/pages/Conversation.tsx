import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetMessages, useSendMessage, useMarkMessagesRead, useGetUserProfile } from '../hooks/useQueries';
import { DirectMessage } from '../backend';
import { Principal } from '@dfinity/principal';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';

export default function Conversation() {
  const { userId } = useParams({ strict: false }) as { userId: string };
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const currentUserId = identity?.getPrincipal().toString() ?? '';

  const { data: messages = [], isLoading } = useGetMessages(userId);
  const { data: otherProfile } = useGetUserProfile(userId);
  const sendMessage = useSendMessage();
  const markRead = useMarkMessagesRead();

  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userId && identity) {
      try {
        markRead.mutate(Principal.fromText(userId));
      } catch {
        // ignore invalid principal
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sorted = [...messages].sort(
    (a: DirectMessage, b: DirectMessage) => Number(a.timestamp) - Number(b.timestamp),
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !identity) return;
    try {
      await sendMessage.mutateAsync({
        recipientId: Principal.fromText(userId),
        text: text.trim(),
      });
      setText('');
    } catch {
      // ignore
    }
  };

  const otherName = otherProfile?.username ?? userId.slice(0, 12) + '…';
  const otherAvatar = otherProfile?.avatarUrl || otherProfile?.avatar?.getDirectURL() || '';

  return (
    <div className="flex flex-col h-full bg-background text-white">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-surface">
        <button onClick={() => navigate({ to: '/inbox' })} className="text-white/70 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-full bg-neon-orange/20 overflow-hidden">
          {otherAvatar ? (
            <img src={otherAvatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-neon-orange font-bold text-sm">
                {otherName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <p className="text-white font-semibold">{otherName}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-neon-orange animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-8">No messages yet. Say hi!</p>
        ) : (
          sorted.map((msg: DirectMessage) => {
            const isMine = msg.fromUser.toString() === currentUserId;
            return (
              <div
                key={String(msg.id)}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    isMine
                      ? 'bg-neon-orange text-black rounded-br-sm'
                      : 'bg-white/10 text-white rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-white/10 px-4 py-3 bg-surface">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 bg-white/10 text-white placeholder-white/40 rounded-full px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-neon-orange"
          />
          <button
            type="submit"
            disabled={!text.trim() || sendMessage.isPending}
            className="bg-neon-orange text-black rounded-full p-2 disabled:opacity-50"
          >
            {sendMessage.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
