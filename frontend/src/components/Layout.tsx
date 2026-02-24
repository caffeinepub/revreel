import React from 'react';
import { Link, Outlet, useLocation } from '@tanstack/react-router';
import { Home, Search, Upload, Trophy, Wrench, Car, BookOpen, ShoppingBag, Bell, MessageCircle, User, Info } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import ProfileSetupModal from './ProfileSetupModal';
import { useQueryClient } from '@tanstack/react-query';

export default function Layout() {
  const location = useLocation();
  const { identity, clear } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();

  // Only show profile setup modal when:
  // 1. User is authenticated
  // 2. Profile query has fully loaded (not just fetched, but actor is stable)
  // 3. Profile is definitively null (not undefined, not loading)
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const navItems = [
    { path: '/feed', icon: Home, label: 'Feed' },
    { path: '/discover', icon: Search, label: 'Discover' },
    { path: '/upload', icon: Upload, label: 'Upload' },
    { path: '/leaderboard', icon: Trophy, label: 'Ranks' },
    { path: '/meets', icon: Car, label: 'Meets' },
    { path: '/mechanics', icon: Wrench, label: 'Help' },
    { path: '/build-logs', icon: BookOpen, label: 'Builds' },
    { path: '/classifieds', icon: ShoppingBag, label: 'Market' },
    { path: '/notifications', icon: Bell, label: 'Alerts' },
    { path: '/inbox', icon: MessageCircle, label: 'Inbox' },
    { path: '/profile', icon: User, label: 'Profile' },
    { path: '/about', icon: Info, label: 'About' },
  ];

  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/feed" className="flex items-center gap-2">
            <img src="/assets/generated/revreel-logo.dim_256x256.png" alt="RevReel" className="w-8 h-8 object-contain" />
            <span className="font-display text-xl font-bold text-primary tracking-wider">RevReel</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.slice(0, 8).map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  currentPath === path
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            <Link
              to="/about"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                currentPath === '/about'
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Info className="w-4 h-4" />
              About
            </Link>
          </nav>

          {/* Auth Controls */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <User className="w-4 h-4" />
                  {userProfile?.username || 'Profile'}
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded text-sm font-medium bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/"
                className="px-4 py-1.5 rounded text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors neon-text"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-14 pb-16 lg:pb-0">
        <Outlet />
      </main>

      {/* Bottom Nav (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border lg:hidden">
        <div className="grid grid-cols-6 h-14">
          {navItems.slice(0, 6).map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${
                currentPath === path
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{label}</span>
            </Link>
          ))}
        </div>
        <div className="grid grid-cols-6 h-14 border-t border-border/50">
          {navItems.slice(6, 12).map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${
                currentPath === path
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Profile Setup Modal */}
      {showProfileSetup && <ProfileSetupModal />}
    </div>
  );
}
