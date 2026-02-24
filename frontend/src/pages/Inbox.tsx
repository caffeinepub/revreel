import React from 'react';
import { Link } from '@tanstack/react-router';
import { MessageCircle } from 'lucide-react';
import { type ConversationSummary, useGetInbox, useGetUserProfile } from '../hooks/useQueries';
import AuthGuard from '../components/AuthGuard';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

function ConversationRow({ conv }: { conv: ConversationSummary }) {
  const { data: profile } = useGetUserProfile(conv.otherUser.toString());
  const name = profile?.username || conv.otherUser.toString().slice(0, 8) + '...';
  const avatarUrl = profile?.avatarUrl || '/assets/generated/default-avatar.dim_128x128.png';

  const timestamp = new Date(Number(conv.lastMessage.timestamp) / 1_000_000);
  const timeStr = timestamp.toLocaleDateString() === new Date().toLocaleDateString()
    ? timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : timestamp.toLocaleDateString();

  return (
    <Link to="/messages/$userId" params={{ userId: conv.otherUser.toString() }} className="block">
      <div className="flex items-center gap-3 px-4 py-4 hover:bg-muted/50 transition-colors border-b border-border/50">
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-border">
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          </div>
          {conv.unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-neon-orange text-black text-xs font-bold">
              {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="font-bold text-foreground text-base truncate">{name}</span>
            <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{timeStr}</span>
          </div>
          <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
            {conv.lastMessage.text}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function Inbox() {
  const { data: conversations = [], isLoading } = useGetInbox();
  const { identity } = useInternetIdentity();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background pb-24 pt-20">
        <div className="max-w-lg mx-auto">
          <div className="px-4 mb-5">
            <h1 className="text-3xl font-display font-bold text-foreground">Messages</h1>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-neon-orange border-t-transparent rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground px-4">
              <MessageCircle size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-sm mt-1">Start a conversation from someone's profile</p>
            </div>
          ) : (
            <div>
              {conversations.map(conv => (
                <ConversationRow key={conv.otherUser.toString()} conv={conv} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
