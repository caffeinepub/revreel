import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetInbox, useGetFollowing, useGetUserProfile } from '../hooks/useQueries';
import { ConversationSummary } from '../backend';
import { MessageCircle, Users, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function ConversationItem({ summary }: { summary: ConversationSummary }) {
  const navigate = useNavigate();
  const otherUserId = summary.otherUser.toString();
  const { data: profile } = useGetUserProfile(otherUserId);
  const avatarUrl = profile?.avatarUrl || profile?.avatar?.getDirectURL() || '';
  const unread = Number(summary.unreadCount);

  return (
    <button
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
      onClick={() => navigate({ to: '/conversation/$userId', params: { userId: otherUserId } })}
    >
      <div className="w-12 h-12 rounded-full bg-neon-orange/20 overflow-hidden shrink-0">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-neon-orange font-bold text-lg">
              {(profile?.username ?? otherUserId).charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold truncate">
          {profile?.username ?? otherUserId.slice(0, 12) + '…'}
        </p>
        <p className="text-white/50 text-sm truncate">{summary.lastMessage.text}</p>
      </div>
      {unread > 0 && (
        <span className="bg-neon-orange text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
          {unread}
        </span>
      )}
    </button>
  );
}

function FollowingUserItem({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const { data: profile } = useGetUserProfile(userId);
  const avatarUrl = profile?.avatarUrl || profile?.avatar?.getDirectURL() || '';

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-12 h-12 rounded-full bg-neon-orange/20 overflow-hidden shrink-0">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-neon-orange font-bold text-lg">
              {(profile?.username ?? userId).charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold truncate">
          {profile?.username ?? userId.slice(0, 12) + '…'}
        </p>
        {profile?.bio && <p className="text-white/50 text-sm truncate">{profile.bio}</p>}
      </div>
      <button
        onClick={() => navigate({ to: '/conversation/$userId', params: { userId } })}
        className="shrink-0 bg-neon-orange/20 text-neon-orange border border-neon-orange/30 rounded-full px-3 py-1 text-xs font-semibold hover:bg-neon-orange/30 transition-colors"
      >
        Message
      </button>
    </div>
  );
}

export default function Inbox() {
  const { identity } = useInternetIdentity();
  const { data: conversations = [], isLoading: inboxLoading } = useGetInbox();
  const currentUserId = identity?.getPrincipal().toString() ?? '';
  const { data: following = [], isLoading: followingLoading } = useGetFollowing(currentUserId);

  if (!identity) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
        <MessageCircle className="w-12 h-12 text-neon-orange/50" />
        <p className="text-white/60">Please log in to view your inbox.</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background text-white pb-24">
      <div className="px-4 pt-6 pb-3">
        <h1 className="text-2xl font-display font-bold text-neon-orange">Inbox</h1>
      </div>

      <Tabs defaultValue="chats">
        <TabsList className="w-full bg-white/5 border-b border-white/10 rounded-none px-4">
          <TabsTrigger value="chats" className="flex-1 text-white data-[state=active]:text-neon-orange data-[state=active]:border-b-2 data-[state=active]:border-neon-orange">
            Chats
          </TabsTrigger>
          <TabsTrigger value="following" className="flex-1 text-white data-[state=active]:text-neon-orange data-[state=active]:border-b-2 data-[state=active]:border-neon-orange">
            Following
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chats">
          {inboxLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-neon-orange animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <MessageCircle className="w-10 h-10 text-white/20" />
              <p className="text-white/50 text-sm">No conversations yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {conversations.map((conv: ConversationSummary) => (
                <ConversationItem key={conv.otherUser.toString()} summary={conv} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="following">
          {followingLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-neon-orange animate-spin" />
            </div>
          ) : following.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Users className="w-10 h-10 text-white/20" />
              <p className="text-white/50 text-sm">You're not following anyone yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {following.map((uid: string) => (
                <FollowingUserItem key={uid} userId={uid} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
