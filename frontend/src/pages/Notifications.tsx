import React from 'react';
import { useGetNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from '../hooks/useQueries';
import { Notification } from '../hooks/useQueries';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';

export default function Notifications() {
  const { data: notifications = [], isLoading } = useGetNotifications();
  const markAll = useMarkAllNotificationsRead();
  const markOne = useMarkNotificationRead();

  return (
    <div className="min-h-full bg-background text-white pb-24">
      <div className="px-4 pt-6 pb-3 flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-neon-orange">Notifications</h1>
        {notifications.some((n: Notification) => !n.isRead) && (
          <button
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="text-neon-orange/70 hover:text-neon-orange text-sm flex items-center gap-1"
          >
            {markAll.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCheck className="w-4 h-4" />
            )}
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-neon-orange animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Bell className="w-10 h-10 text-white/20" />
          <p className="text-white/50 text-sm">No notifications yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {notifications.map((notif: Notification) => (
            <div
              key={notif.id}
              className={`px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-white/5 transition-colors ${
                !notif.isRead ? 'bg-neon-orange/5' : ''
              }`}
              onClick={() => !notif.isRead && markOne.mutate(notif.id)}
            >
              <Bell className={`w-5 h-5 mt-0.5 shrink-0 ${notif.isRead ? 'text-white/30' : 'text-neon-orange'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm">{notif.message}</p>
                <p className="text-white/40 text-xs mt-0.5">
                  {new Date(notif.createdAt).toLocaleDateString()}
                </p>
              </div>
              {!notif.isRead && (
                <div className="w-2 h-2 rounded-full bg-neon-orange shrink-0 mt-1.5" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
