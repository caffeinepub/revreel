import { ReactNode } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { Home, Compass, Upload, User, Trophy, Car, Wrench, MessageCircle, Bell, HardHat, ShoppingBag } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetInbox, useGetUnreadNotificationCount } from '../hooks/useQueries';
import ProfileSetupModal from './ProfileSetupModal';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { data: inbox } = useGetInbox();
  const { data: unreadNotifCount } = useGetUnreadNotificationCount();

  const isAuthenticated = !!identity;
  const userId = identity?.getPrincipal().toString();

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  const unreadDMs = inbox?.reduce((acc, conv) => acc + Number(conv.unreadCount), 0) ?? 0;
  const unreadNotifs = unreadNotifCount !== undefined ? Number(unreadNotifCount) : 0;

  const profilePath = userId ? `/profile/${userId}` : '/profile/me';

  const navItems: Array<{ path: string; icon: React.ElementType; label: string; badge?: number }> = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/discover', icon: Compass, label: 'Discover' },
    { path: '/leaderboard', icon: Trophy, label: 'Top' },
    { path: '/meets', icon: Car, label: 'Meets' },
    { path: '/mechanics', icon: Wrench, label: 'Garage' },
    { path: '/builds', icon: HardHat, label: 'Builds' },
    { path: '/classifieds', icon: ShoppingBag, label: 'Market' },
    { path: '/upload', icon: Upload, label: 'Upload' },
    { path: '/inbox', icon: MessageCircle, label: 'DMs', badge: unreadDMs },
    { path: '/notifications', icon: Bell, label: 'Alerts', badge: unreadNotifs },
    { path: profilePath, icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/assets/generated/revreel-logo.dim_256x256.png"
              alt="RevReel"
              className="w-8 h-8 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="font-display text-xl font-bold text-neon tracking-wider">REVREEL</span>
          </Link>
          <div className="flex items-center gap-3">
            {isAuthenticated && userProfile && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-neon animate-pulse" />
                <span className="text-xs text-muted-foreground font-display">
                  {userProfile.username}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pt-14 pb-20 max-w-lg mx-auto w-full">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-t border-border">
        <div className="flex items-center justify-around px-1 py-2 max-w-lg mx-auto overflow-x-auto">
          {navItems.map(({ path, icon: Icon, label, badge }) => {
            const isActive =
              path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(path);

            return (
              <Link
                key={path}
                to={path as any}
                className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg transition-all relative min-w-[36px] ${
                  isActive ? 'text-neon' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {badge !== undefined && badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-neon text-background text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                      {badge > 9 ? '9+' : badge}
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
