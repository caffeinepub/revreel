import { Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import {
  Home,
  Search,
  Trophy,
  Bell,
  MessageCircle,
  User,
  Upload,
  Wrench,
  Car,
  BookOpen,
  Tag,
  Shield,
  Info,
  MoreHorizontal,
  LogOut,
  X,
} from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useQueryClient } from "@tanstack/react-query";
import ProfileSetupModal from "./ProfileSetupModal";
import { useGetCallerUserProfile } from "../hooks/useQueries";

export default function Layout() {
  const { identity, clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);

  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const currentUserId = identity?.getPrincipal().toString() ?? "";

  // Show profile setup modal only when authenticated, actor is ready, and profile is null
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: "/" });
  };

  const primaryNavItems = [
    { to: "/feed", icon: Home, label: "Home" },
    { to: "/discover", icon: Search, label: "Discover" },
    { to: "/leaderboard", icon: Trophy, label: "Leaderboard" },
    { to: "/notifications", icon: Bell, label: "Alerts" },
    { to: "/inbox", icon: MessageCircle, label: "Messages" },
  ];

  const secondaryNavItems = [
    { to: "/mechanics", icon: Wrench, label: "Mechanics" },
    { to: "/meets", icon: Car, label: "Car Meets" },
    { to: "/builds", icon: BookOpen, label: "Build Logs" },
    { to: "/classifieds", icon: Tag, label: "Classifieds" },
    { to: "/admin", icon: Shield, label: "Admin" },
    { to: "/about", icon: Info, label: "About" },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b border-border h-14 flex items-center justify-between px-4">
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

        <div className="flex items-center gap-2">
          <Link
            to="/upload"
            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </Link>

          {isAuthenticated && currentUserId && (
            <Link
              to="/profile/$userId"
              params={{ userId: currentUserId }}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-muted transition-colors"
            >
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="hidden sm:inline text-sm text-muted-foreground">
                {userProfile?.username ?? "Profile"}
              </span>
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="p-2 rounded hover:bg-muted transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-14 pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border">
        <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
          {primaryNavItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors ${
                isActive(to)
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          ))}

          {/* Profile link in bottom nav */}
          {isAuthenticated && currentUserId ? (
            <Link
              to="/profile/$userId"
              params={{ userId: currentUserId }}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors ${
                isActive("/profile")
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="h-5 w-5" />
              <span className="text-[10px] font-medium">Profile</span>
            </Link>
          ) : (
            <Link
              to="/feed"
              className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
            >
              <User className="h-5 w-5" />
              <span className="text-[10px] font-medium">Profile</span>
            </Link>
          )}

          {/* More button */}
          <button
            onClick={() => setShowMore(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* More Menu Overlay */}
      {showMore && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          onClick={() => setShowMore(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-display text-lg font-bold">More</span>
              <button
                onClick={() => setShowMore(false)}
                className="p-1 rounded hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {secondaryNavItems.map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setShowMore(false)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <Icon className="h-6 w-6 text-primary" />
                  <span className="text-xs font-medium text-center">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Profile Setup Modal */}
      {showProfileSetup && <ProfileSetupModal />}
    </div>
  );
}
