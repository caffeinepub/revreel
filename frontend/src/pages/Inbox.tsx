import React from 'react';
import { useGetInbox, useGetUserProfile, type ConversationSummary } from '../hooks/useQueries';
import AuthGuard from '../components/AuthGuard';
import { Link } from '@tanstack/react-router';
import { MessageCircle, Loader2 } from 'lucide-react';

function timeAgo(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function ConversationRow({ conv }: { conv: ConversationSummary }) {
  const otherUserId = conv.otherUser?.toString() || '';
  const { data: profile } = useGetUserProfile(otherUserId);

  return (
    <Link
      to="/messages/$userId"
      params={{ userId: otherUserId }}
      className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
    >
      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {profile?.avatarUrl ? (
          <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-bold text-primary">
            {(profile?.username || otherUserId).slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-sm truncate">
            {profile?.username || otherUserId.slice(0, 12) + '...'}
          </p>
          <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
            {timeAgo(conv.lastMessage.timestamp)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage.text}</p>
      </div>
      {Number(conv.unreadCount) > 0 && (
        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-primary-foreground">{Number(conv.unreadCount)}</span>
        </div>
      )}
    </Link>
  );
}

export default function Inbox() {
  const { data: conversations = [], isLoading } = useGetInbox();

  return (
    <AuthGuard>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageCircle className="w-6 h-6 text-primary" />
          <h1 className="font-display text-2xl font-black text-primary neon-text">Inbox</h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-lg font-semibold">No messages yet</p>
            <p className="text-sm mt-1">Start a conversation from someone's profile</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv: ConversationSummary) => (
              <ConversationRow key={conv.otherUser?.toString()} conv={conv} />
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
