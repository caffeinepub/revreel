import React, { useState } from 'react';
import { Link, useRouter } from '@tanstack/react-router';
import { Home, Compass, Plus, Trophy, User, Flame, CalendarDays, Wrench, MessageCircle } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetInbox } from '../hooks/useQueries';
import ProfileSetupModal from './ProfileSetupModal';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/', icon: Home, label: 'FEED' },
  { path: '/discover', icon: Compass, label: 'DISCOVER' },
  { path: '/upload', icon: Plus, label: 'UPLOAD', isAction: true },
  { path: '/meets', icon: CalendarDays, label: 'MEETS' },
  { path: '/mechanics', icon: Wrench, label: 'WRENCH' },
  { path: '/inbox', icon: MessageCircle, label: 'DMS' },
  { path: '/leaderboard', icon: Trophy, label: 'RANKS' },
  { path: '/profile', icon: User, label: 'ME' },
];

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const currentPath = router.state.location.pathname;
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  // Fetch inbox for unread badge — only when authenticated
  const { data: inbox } = useGetInbox();
  const totalUnread = isAuthenticated
    ? (inbox ?? []).reduce((sum, c) => sum + Number(c.unreadCount), 0)
    : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/assets/generated/revreel-logo.dim_256x256.png"
              alt="RevReel"
              className="w-8 h-8 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="font-display text-xl tracking-widest text-neon neon-text">REVREEL</span>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-neon animate-pulse" />
                <span className="text-xs text-muted-foreground font-display">
                  {userProfile?.username ?? 'RACER'}
                </span>
              </div>
            ) : (
              <Flame className="w-5 h-5 text-neon" />
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pt-14 pb-20 max-w-lg mx-auto w-full">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-t border-white/5">
        <div className="flex items-center justify-around px-1 py-2 max-w-lg mx-auto">
          {navItems.map(({ path, icon: Icon, label, isAction }) => {
            const isActive =
              path === '/'
                ? currentPath === '/'
                : currentPath.startsWith(path);
            const isMessages = path === '/inbox';

            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all relative ${
                  isAction
                    ? 'bg-neon/10 border border-neon/30 px-3 py-1.5 neon-border'
                    : ''
                } ${
                  isActive
                    ? 'text-neon'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`${isAction ? 'w-5 h-5' : 'w-5 h-5'} ${
                      isActive ? 'text-neon' : ''
                    }`}
                  />
                  {/* Unread badge for Messages */}
                  {isMessages && totalUnread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] rounded-full bg-neon text-background text-[9px] font-bold flex items-center justify-center px-0.5 leading-none">
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                  )}
                </div>
                <span className={`text-[9px] font-display tracking-wider ${isActive ? 'text-neon' : ''}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Profile Setup Modal */}
      {showProfileSetup && <ProfileSetupModal />}
    </div>
  );
}
