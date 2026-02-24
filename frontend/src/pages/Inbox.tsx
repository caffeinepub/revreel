import React from 'react';
import { Link } from '@tanstack/react-router';
import { MessageCircle, Inbox as InboxIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import AuthGuard from '../components/AuthGuard';
import { useGetInbox, useGetUserProfile } from '../hooks/useQueries';
import { type ConversationSummary } from '../backend';

function formatRelativeTime(timestamp: bigint): string {
  const now = Date.now();
  const msgTime = Number(timestamp) / 1_000_000; // nanoseconds to milliseconds
  const diffMs = now - msgTime;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(msgTime).toLocaleDateString();
}

function ConversationRow({ summary }: { summary: ConversationSummary }) {
  const otherUserId = summary.otherUser.toString();
  const { data: profile } = useGetUserProfile(otherUserId);
  const unreadCount = Number(summary.unreadCount);

  const avatarSrc =
    profile?.avatarUrl && profile.avatarUrl.length > 0
      ? profile.avatarUrl
      : profile?.avatar?.getDirectURL() || '/assets/generated/default-avatar.dim_128x128.png';

  const preview =
    summary.lastMessage.text.length > 50
      ? summary.lastMessage.text.slice(0, 50) + '…'
      : summary.lastMessage.text;

  return (
    <Link
      to="/messages/$userId"
      params={{ userId: otherUserId }}
      className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={avatarSrc}
          alt={profile?.username ?? 'User'}
          className="w-12 h-12 rounded-full object-cover border-2 border-neon/30"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/assets/generated/default-avatar.dim_128x128.png';
          }}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-neon text-background text-[10px] font-bold flex items-center justify-center px-1 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-display text-sm text-foreground truncate">
            {profile?.username ?? otherUserId.slice(0, 8) + '…'}
          </span>
          <span className="text-muted-foreground text-xs flex-shrink-0">
            {formatRelativeTime(summary.lastMessage.timestamp)}
          </span>
        </div>
        <p className={`text-xs mt-0.5 truncate ${unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
          {preview}
        </p>
      </div>
    </Link>
  );
}

function InboxContent() {
  const { data: inbox, isLoading } = useGetInbox();

  const sorted = [...(inbox ?? [])].sort(
    (a, b) => Number(b.lastMessage.timestamp) - Number(a.lastMessage.timestamp)
  );

  if (isLoading) {
    return (
      <div className="space-y-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
            <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 px-6">
        <div className="w-16 h-16 rounded-full bg-neon/10 border border-neon/20 flex items-center justify-center">
          <MessageCircle className="w-8 h-8 text-neon/60" />
        </div>
        <h3 className="font-display text-xl text-foreground">NO MESSAGES YET</h3>
        <p className="text-muted-foreground text-sm text-center">
          Visit a racer's profile and tap Message to start a conversation.
        </p>
      </div>
    );
  }

  return (
    <div>
      {sorted.map((summary) => (
        <ConversationRow key={summary.otherUser.toString()} summary={summary} />
      ))}
    </div>
  );
}

export default function Inbox() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-white/10 px-4 py-3 flex items-center gap-3">
          <InboxIcon className="w-5 h-5 text-neon" />
          <h1 className="font-display text-xl text-foreground tracking-wider">MESSAGES</h1>
        </div>

        {/* Conversation list */}
        <div className="bg-card/30 mx-0">
          <InboxContent />
        </div>
      </div>
    </AuthGuard>
  );
}
