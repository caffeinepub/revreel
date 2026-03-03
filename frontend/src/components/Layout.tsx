import { Outlet, Link, useLocation } from '@tanstack/react-router';
import { Home, Compass, Plus, MessageCircle, User, Menu, Trophy, Wrench, Car, BookOpen, ShoppingBag, Info, X } from 'lucide-react';
import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

const staticNavItems = [
  { to: '/feed' as const, icon: Home, label: 'Feed' },
  { to: '/discover' as const, icon: Compass, label: 'Discover' },
  { to: '/upload' as const, icon: Plus, label: 'Upload' },
  { to: '/inbox' as const, icon: MessageCircle, label: 'Inbox' },
];

const moreItems = [
  { to: '/meets' as const, icon: Car, label: 'Car Meets' },
  { to: '/builds' as const, icon: BookOpen, label: 'Build Logs' },
  { to: '/classifieds' as const, icon: ShoppingBag, label: 'Classifieds' },
  { to: '/mechanics' as const, icon: Wrench, label: 'Mechanics Help' },
  { to: '/leaderboard' as const, icon: Trophy, label: 'Leaderboard' },
  { to: '/about' as const, icon: Info, label: 'About RevReel' },
];

export default function Layout() {
  const location = useLocation();
  const { identity } = useInternetIdentity();
  const [showMore, setShowMore] = useState(false);

  const userId = identity?.getPrincipal().toString() ?? 'anonymous';

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const profileActive = isActive(`/profile/${userId}`);
  const moreIsActive = moreItems.some(item => isActive(item.to));

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Main content — leave 64px at bottom for nav */}
      <main className="flex-1 pb-16">
        <Outlet />
      </main>

      {/* Bottom Navigation — fixed, 64px tall */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-background/95 backdrop-blur border-t border-border flex items-center justify-around px-1">
        {staticNavItems.map(({ to, icon: Icon, label }) => {
          const active = isActive(to);
          return (
            <Link
              key={label}
              to={to}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}

        {/* Profile link — uses dynamic param so handled separately */}
        <Link
          to="/profile/$userId"
          params={{ userId }}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
            profileActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <User size={20} strokeWidth={profileActive ? 2.5 : 1.8} />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>

        {/* More button */}
        <button
          onClick={() => setShowMore(true)}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
            moreIsActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Menu size={20} strokeWidth={1.8} />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>

      {/* More Sheet Overlay */}
      {showMore && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowMore(false)}
          />

          {/* Sheet */}
          <div className="relative bg-background border-t border-border rounded-t-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h2 className="text-lg font-display font-bold text-foreground tracking-wide">
                Explore
              </h2>
              <button
                onClick={() => setShowMore(false)}
                className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-4 pb-10 grid grid-cols-3 gap-3 mt-2">
              {moreItems.map(({ to, icon: Icon, label }) => {
                const active = isActive(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setShowMore(false)}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                      active
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon size={24} strokeWidth={active ? 2.5 : 1.8} />
                    <span className="text-xs font-medium text-center leading-tight">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
