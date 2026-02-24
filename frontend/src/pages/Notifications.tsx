import { Bell, Heart, MessageCircle, UserPlus, Mail, AtSign, Flame, Flag, CheckCheck } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import AuthGuard from '../components/AuthGuard';
import { useGetNotifications, useMarkAllNotificationsRead, useGetUserProfile } from '../hooks/useQueries';
import { Notification } from '../backend';

function NotificationIcon({ type }: { type: string }) {
  const cls = "w-5 h-5";
  switch (type) {
    case 'like': return <Heart className={`${cls} text-red-400`} />;
    case 'comment': return <MessageCircle className={`${cls} text-blue-400`} />;
    case 'follow': return <UserPlus className={`${cls} text-green-400`} />;
    case 'message': return <Mail className={`${cls} text-purple-400`} />;
    case 'mention': return <AtSign className={`${cls} text-yellow-400`} />;
    case 'reaction': return <Flame className={`${cls} text-neon-orange`} />;
    case 'challenge': return <Flag className={`${cls} text-neon-yellow`} />;
    default: return <Bell className={`${cls} text-muted-foreground`} />;
  }
}

function NotificationCard({ notif }: { notif: Notification }) {
  const { data: sender } = useGetUserProfile(notif.senderId.toString());
  const navigate = useNavigate();

  const timeAgo = (ts: bigint) => {
    const diff = Date.now() - Number(ts) / 1_000_000;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const senderId = notif.senderId.toString();
  // Only make clickable if there's a real sender (not anonymous/system)
  const isClickable = senderId && senderId !== '2vxsx-fae';

  const handleClick = () => {
    if (!isClickable) return;
    navigate({ to: '/profile/$userId', params: { userId: senderId } });
  };

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); } : undefined}
      aria-label={isClickable ? `View ${sender?.username ?? 'user'}'s profile` : undefined}
      className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
        !notif.isRead
          ? 'border-neon-orange/60 bg-neon-orange/5 shadow-neon'
          : 'border-border bg-card/50'
      } ${isClickable ? 'hover:border-neon-orange/80 hover:bg-neon-orange/10 cursor-pointer' : ''}`}
    >
      <div className="flex-shrink-0 mt-0.5">
        <NotificationIcon type={notif.notificationType} />
      </div>
      <div className="flex-1 min-w-0">
        {/* Sender avatar + username */}
        <div className="flex items-center gap-2 mb-1">
          {sender?.avatarUrl ? (
            <img
              src={sender.avatarUrl}
              alt={sender.username}
              className="w-7 h-7 rounded-full object-cover border border-neon-orange/40 flex-shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-neon-orange/20 border border-neon-orange/40 flex items-center justify-center text-xs text-neon-orange font-bold flex-shrink-0">
              {sender?.username?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <p className="text-sm text-foreground">
            <span className="font-semibold text-neon-orange">{sender?.username ?? 'Someone'}</span>
            {' '}{notif.message}
          </p>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{timeAgo(notif.createdAt)}</p>
      </div>
      {!notif.isRead && (
        <div className="w-2 h-2 rounded-full bg-neon-orange flex-shrink-0 mt-1.5" />
      )}
    </div>
  );
}

function NotificationsContent() {
  const { data: notifications, isLoading } = useGetNotifications();
  const markAll = useMarkAllNotificationsRead();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <Bell className="w-6 h-6 text-neon-orange" />
          Notifications
        </h1>
        {notifications && notifications.some(n => !n.isRead) && (
          <button
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="flex items-center gap-1.5 text-sm text-neon-orange hover:text-neon-yellow transition-colors disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4" />
            {markAll.isPending ? 'Marking...' : 'Mark all read'}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-card/50 animate-pulse border border-border" />
          ))}
        </div>
      ) : !notifications || notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">No notifications yet</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Activity from your followers will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notif => (
            <NotificationCard key={String(notif.id)} notif={notif} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Notifications() {
  return (
    <AuthGuard>
      <NotificationsContent />
    </AuthGuard>
  );
}
