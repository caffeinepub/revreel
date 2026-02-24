import React from 'react';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import {
  Home,
  Search,
  Upload,
  User,
  Bell,
  MessageCircle,
  Trophy,
  Car,
  Wrench,
  BookOpen,
  ShoppingBag,
  LogOut,
  LogIn,
  Loader2,
} from 'lucide-react';
import {
  useGetCallerUserProfile,
  useGetUnreadNotificationCount,
  useGetUnreadMessageCount,
} from '../hooks/useQueries';
import ProfileSetupModal from './ProfileSetupModal';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: Home, label: 'Feed', path: '/feed' },
  { icon: Search, label: 'Discover', path: '/discover' },
  { icon: Trophy, label: 'Top', path: '/leaderboard' },
  { icon: Car, label: 'Meets', path: '/meets' },
  { icon: Wrench, label: 'Garage', path: '/mechanics' },
  { icon: BookOpen, label: 'Builds', path: '/builds' },
  { icon: ShoppingBag, label: 'Market', path: '/classifieds' },
  { icon: MessageCircle, label: 'DMs', path: '/inbox' },
  { icon: Bell, label: 'Alerts', path: '/notifications' },
  { icon: Upload, label: 'Upload', path: '/upload' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export default function Layout({ children }: LayoutProps) {
  const { identity, login, clear, loginStatus, isInitializing } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();

  const { data: unreadNotifCount } = useGetUnreadNotificationCount();
  const { data: unreadMsgCount } = useGetUnreadMessageCount();

  // Only show profile setup modal when:
  // 1. User is authenticated
  // 2. Not still initializing identity
  // 3. Profile query has completed (not loading)
  // 4. Profile is genuinely null (no profile exists)
  const showProfileSetup =
    isAuthenticated &&
    !isInitializing &&
    !profileLoading &&
    profileFetched &&
    userProfile === null;

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
      navigate({ to: '/' });
    } else {
      try {
        await login();
      } catch (error: any) {
        if (error?.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const profilePath = identity
    ? `/profile/${identity.getPrincipal().toString()}`
    : '/profile';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/50 h-14 flex items-center px-4">
        <div className="flex items-center justify-between w-full max-w-screen-xl mx-auto">
          <Link to="/feed" className="flex items-center gap-2">
            <img
              src="/assets/generated/revreel-logo.dim_256x256.png"
              alt="RevReel"
              className="h-8 w-8 object-contain"
            />
            <span className="font-display text-lg font-bold text-primary tracking-wider uppercase">
              RevReel
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated && userProfile && (
              <Link
                to={profilePath as any}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                {userProfile.avatarUrl ? (
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.username}
                    className="h-7 w-7 rounded-full object-cover border border-primary/40"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                )}
                <span className="text-sm font-medium text-foreground/80 hidden sm:block">
                  {userProfile.username}
                </span>
              </Link>
            )}

            <button
              onClick={handleAuth}
              disabled={isLoggingIn || isInitializing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingIn || isInitializing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isAuthenticated ? (
                <>
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Login</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pt-14 pb-16">{children}</main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/50">
        <div className="flex items-center justify-around px-1 py-1 max-w-screen-xl mx-auto overflow-x-auto scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentPath === item.path ||
              (item.path !== '/feed' && currentPath.startsWith(item.path));

            // For profile nav item, link to user's own profile
            const linkPath = item.path === '/profile' ? profilePath : item.path;

            const hasNotifBadge =
              item.path === '/notifications' &&
              unreadNotifCount !== undefined &&
              Number(unreadNotifCount) > 0;
            const hasMsgBadge =
              item.path === '/inbox' && unreadMsgCount !== undefined && unreadMsgCount > 0;

            return (
              <Link
                key={item.path}
                to={linkPath as any}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all min-w-[44px] relative
                  ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <div className="relative">
                  <Icon
                    className={`h-5 w-5 ${isActive ? 'drop-shadow-[0_0_6px_var(--color-primary)]' : ''}`}
                  />
                  {(hasNotifBadge || hasMsgBadge) && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                      {hasNotifBadge ? Number(unreadNotifCount) : unreadMsgCount}
                    </span>
                  )}
                </div>
                <span className={`text-[9px] font-medium leading-none ${isActive ? 'text-primary' : ''}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Profile Setup Modal — only rendered when user genuinely has no profile */}
      {showProfileSetup && <ProfileSetupModal />}
    </div>
  );
}
