import React, { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Zap, Users, Trophy, Car, ArrowRight, Loader2 } from 'lucide-react';

export default function LandingPage() {
  const { identity, login, loginStatus, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  // Redirect authenticated users to feed, but only after initialization is complete
  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      navigate({ to: '/feed' });
    }
  }, [isAuthenticated, isInitializing, navigate]);

  const handleJoin = async () => {
    if (isAuthenticated) {
      navigate({ to: '/feed' });
      return;
    }
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
    }
  };

  // Show loading spinner while restoring identity from storage
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/assets/generated/revreel-logo.dim_256x256.png"
            alt="RevReel"
            className="h-16 w-16 object-contain animate-pulse"
          />
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  // If authenticated, show brief redirect state
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/assets/generated/revreel-logo.dim_256x256.png"
            alt="RevReel"
            className="h-16 w-16 object-contain"
          />
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">Taking you to the feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/assets/generated/landing-hero.dim_1920x1080.png)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto w-full">
          <img
            src="/assets/generated/revreel-logo.dim_256x256.png"
            alt="RevReel"
            className="h-24 w-24 object-contain mb-6 drop-shadow-[0_0_24px_var(--color-primary)]"
          />

          <h1 className="font-display text-5xl sm:text-7xl font-black uppercase tracking-widest text-foreground mb-4 leading-none">
            Rev<span className="text-primary neon-text">Reel</span>
          </h1>

          <p className="text-lg sm:text-xl text-foreground/70 mb-3 font-medium tracking-wide">
            The Ultimate Car Culture Platform
          </p>

          <p className="text-sm sm:text-base text-foreground/50 mb-8 max-w-lg leading-relaxed">
            Share your builds, connect with racers, discover car meets, and dominate the leaderboard.
            Built for the community, by the community.
          </p>

          {/* Tuner Car Hero Image */}
          <div className="w-full max-w-2xl mx-auto mb-10 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/60 z-10 pointer-events-none" />
            <img
              src="/assets/generated/tuner-car-hero.dim_1200x600.png"
              alt="Tuner Import Car"
              className="w-full h-auto object-cover rounded-none border border-primary/20 shadow-[0_0_40px_rgba(0,0,0,0.8)] drop-shadow-[0_0_16px_var(--color-primary)]"
            />
          </div>

          <button
            onClick={handleJoin}
            disabled={isLoggingIn}
            className="group flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground
              font-display font-bold text-lg uppercase tracking-widest rounded-none
              border-2 border-primary hover:bg-transparent hover:text-primary
              transition-all duration-200 neon-border disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                Join RevReel
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <p className="mt-4 text-xs text-foreground/30">
            Secure login powered by Internet Identity
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <div className="w-px h-8 bg-gradient-to-b from-primary/60 to-transparent" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-background">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-widest text-center mb-4">
            Built for <span className="text-primary neon-text">Racers</span>
          </h2>
          <p className="text-center text-foreground/50 mb-14 max-w-xl mx-auto">
            Everything you need to live and breathe car culture in one place.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Zap,
                title: 'Share Videos',
                desc: 'Upload your best runs, builds, and car content for the community to see.',
              },
              {
                icon: Users,
                title: 'Car Meets',
                desc: 'Find and organize local car meets. Connect with enthusiasts near you.',
              },
              {
                icon: Trophy,
                title: 'Leaderboard',
                desc: 'Compete for the top spot. Show off your skills and earn your rank.',
              },
              {
                icon: Car,
                title: 'Build Logs',
                desc: 'Document your build journey stage by stage. Inspire the community.',
              },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="p-6 border border-border/50 bg-card/30 backdrop-blur-sm
                    hover:border-primary/40 hover:bg-card/50 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 bg-primary/10 border border-primary/30 flex items-center justify-center mb-4
                    group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-base uppercase tracking-wider mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-foreground/50 leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-card/20 border-t border-border/30">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-widest mb-4">
            Ready to <span className="text-primary neon-text">Rev Up?</span>
          </h2>
          <p className="text-foreground/50 mb-8">
            Join thousands of car enthusiasts already on RevReel.
          </p>
          <button
            onClick={handleJoin}
            disabled={isLoggingIn}
            className="group flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground
              font-display font-bold text-lg uppercase tracking-widest rounded-none mx-auto
              border-2 border-primary hover:bg-transparent hover:text-primary
              transition-all duration-200 neon-border disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                Get Started
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border/30 bg-background">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src="/assets/generated/revreel-logo.dim_256x256.png"
              alt="RevReel"
              className="h-6 w-6 object-contain"
            />
            <span className="font-display font-bold text-sm uppercase tracking-wider text-foreground/60">
              RevReel
            </span>
          </div>
          <p className="text-xs text-foreground/30">
            © {new Date().getFullYear()} RevReel. All rights reserved.
          </p>
          <p className="text-xs text-foreground/30">
            Built with{' '}
            <span className="text-primary">♥</span>{' '}
            using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== 'undefined' ? window.location.hostname : 'revreel')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
