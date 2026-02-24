import { useState } from 'react';
import { Link, useNavigate, useRouterState, Outlet } from '@tanstack/react-router';
import {
  Home,
  Search,
  Trophy,
  User,
  MoreHorizontal,
  Wrench,
  Car,
  MessageSquare,
  Bell,
  ShieldCheck,
  Info,
  BookOpen,
  Tag,
  Plus,
  X,
} from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import ProfileSetupModal from './ProfileSetupModal';
import { useQueryClient } from '@tanstack/react-query';

const primaryNavItems = [
  { icon: Home, label: 'Feed', path: '/feed' },
  { icon: Search, label: 'Discover', path: '/discover' },
  { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
  { icon: User, label: 'Profile', path: '/profile' },
];

const secondaryNavItems = [
  { icon: Car, label: 'Car Meets', path: '/meets' },
  { icon: Wrench, label: 'Mechanics', path: '/mechanics' },
  { icon: MessageSquare, label: 'Inbox', path: '/inbox' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { icon: BookOpen, label: 'Build Logs', path: '/builds' },
  { icon: Tag, label: 'Classifieds', path: '/classifieds' },
  { icon: Info, label: 'About', path: '/about' },
  { icon: ShieldCheck, label: 'Admin', path: '/admin' },
];

export default function Layout() {
  const { identity, clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const [showMore, setShowMore] = useState(false);

  const isAuthenticated = !!identity;

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();

  const showProfileSetup =
    isAuthenticated && !profileLoading && isFetched && userProfile === null;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: '/' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-background/90 backdrop-blur-md border-b border-border flex items-center justify-between px-4">
        <Link to="/feed" className="flex items-center gap-2">
          <img
            src="/assets/generated/revreel-logo.dim_256x256.png"
            alt="RevReel"
            className="h-8 w-8 object-contain"
          />
          <span className="font-display text-xl font-bold text-primary tracking-wider">
            RevReel
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <button
              onClick={() => navigate({ to: '/upload' })}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Upload</span>
            </button>
          )}
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded border border-border"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/"
              className="text-xs text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded border border-primary/40"
            >
              Login
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-14 pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-background/95 backdrop-blur-md border-t border-border flex items-center justify-around px-2">
        {primaryNavItems.map(({ icon: Icon, label, path }) => {
          const isActive = currentPath === path || currentPath.startsWith(path + '/');
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-0 ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'drop-shadow-[0_0_6px_var(--color-primary)]' : ''}`} />
              <span className="text-[10px] font-medium truncate">{label}</span>
            </Link>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setShowMore(!showMore)}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
            showMore ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>

      {/* Floating Upload Button (FAB) */}
      {isAuthenticated && (
        <button
          onClick={() => navigate({ to: '/upload' })}
          className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/40 flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all neon-glow"
          aria-label="Upload reel or photo"
        >
          <Plus className="h-7 w-7" />
        </button>
      )}

      {/* More Popup */}
      {showMore && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setShowMore(false)}
          />
          <div className="fixed bottom-20 left-4 right-4 z-50 bg-card border border-border rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="font-display text-sm font-bold text-muted-foreground uppercase tracking-widest">
                More
              </span>
              <button
                onClick={() => setShowMore(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {secondaryNavItems.map(({ icon: Icon, label, path }) => {
                const isActive = currentPath === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setShowMore(false)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[10px] font-medium text-center leading-tight">
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Profile Setup Modal */}
      {showProfileSetup && <ProfileSetupModal />}
    </div>
  );
}
