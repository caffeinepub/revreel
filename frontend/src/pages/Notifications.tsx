import React from 'react';
import {
  useGetNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  type Notification,
} from '../hooks/useQueries';
import AuthGuard from '../components/AuthGuard';
import { Bell, Loader2, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';

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

export default function Notifications() {
  const { data: notifications = [], isLoading } = useGetNotifications();
  const markAll = useMarkAllNotificationsRead();
  const markOne = useMarkNotificationRead();
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  const handleMarkAll = () => {
    markAll.mutate();
  };

  const handleNotifClick = (notif: Notification) => {
    markOne.mutate({ notificationId: notif.id });
    try {
      navigate({
        to: '/profile/$userId',
        params: { userId: notif.senderId.toString() },
      });
    } catch {
      // ignore navigation errors
    }
  };

  return (
    <AuthGuard>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            <h1 className="font-display text-2xl font-black text-primary neon-text">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAll}
              disabled={markAll.isPending}
              className="text-muted-foreground hover:text-foreground"
            >
              {markAll.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <CheckCheck className="w-4 h-4 mr-1" />
              )}
              Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Bell className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-lg font-semibold">No notifications yet</p>
            <p className="text-sm mt-1">We'll let you know when something happens</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif: Notification) => (
              <div
                key={notif.id.toString()}
                onClick={() => handleNotifClick(notif)}
                className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  notif.isRead
                    ? 'bg-card border-border hover:border-primary/30'
                    : 'bg-primary/5 border-primary/30 hover:border-primary/60'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{notif.message}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{timeAgo(notif.createdAt)}</p>
                </div>
                {!notif.isRead && (
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
