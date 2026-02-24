import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Bell, Heart, MessageCircle, UserPlus, Zap, CheckCheck } from 'lucide-react';
import { type Notification, useGetNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from '../hooks/useQueries';
import AuthGuard from '../components/AuthGuard';

function timeAgo(createdAt: number): string {
  const diff = Date.now() - createdAt / 1_000_000;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function notifIcon(type: string) {
  switch (type) {
    case 'like': return <Heart size={18} className="text-red-400" />;
    case 'comment': return <MessageCircle size={18} className="text-blue-400" />;
    case 'follow': return <UserPlus size={18} className="text-green-400" />;
    case 'challenge': return <Zap size={18} className="text-yellow-400" />;
    default: return <Bell size={18} className="text-muted-foreground" />;
  }
}

export default function Notifications() {
  const navigate = useNavigate();
  const { data: notifications = [], isLoading } = useGetNotifications();
  const markAll = useMarkAllNotificationsRead();
  const markOne = useMarkNotificationRead();

  const handleNotifClick = (notif: Notification) => {
    if (!notif.isRead) {
      markOne.mutate({ notifId: notif.id });
    }
    navigate({ to: '/profile/$userId', params: { userId: notif.senderId.toString() } });
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background pb-24 pt-20">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-3xl font-display font-bold text-foreground">Notifications</h1>
            {notifications.some(n => !n.isRead) && (
              <button
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground text-sm font-bold transition-colors disabled:opacity-50"
              >
                <CheckCheck size={16} />
                Mark All Read
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-neon-orange border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Bell size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-colors ${
                    notif.isRead ? 'bg-card border border-border' : 'bg-neon-orange/10 border border-neon-orange/30'
                  } hover:border-neon-orange/50`}
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    {notifIcon(notif.notificationType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-sm leading-snug">{notif.message}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">{timeAgo(notif.createdAt)}</p>
                  </div>
                  {!notif.isRead && (
                    <div className="w-2.5 h-2.5 rounded-full bg-neon-orange flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
