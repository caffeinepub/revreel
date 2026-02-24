import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Loader2, Play, Users, Wrench, Car, Trophy, Zap } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { login, loginStatus, identity, isInitializing } = useInternetIdentity();
  const [isJoining, setIsJoining] = useState(false);

  // Redirect authenticated users to feed
  useEffect(() => {
    if (identity && !isInitializing) {
      navigate({ to: '/feed' });
    }
  }, [identity, isInitializing, navigate]);

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const isLoading = isJoining || loginStatus === 'logging-in';

  const features = [
    { icon: Play, label: 'Viral Car Videos', desc: 'Watch and share epic car content' },
    { icon: Users, label: 'Car Meets', desc: 'Find and join local car meets' },
    { icon: Wrench, label: 'Mechanics Help', desc: 'Get expert advice on your build' },
    { icon: Car, label: 'Build Logs', desc: 'Document your car transformation' },
    { icon: Trophy, label: 'Leaderboards', desc: 'Compete for top racer status' },
    { icon: Zap, label: 'Classifieds', desc: 'Buy and sell car parts' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/assets/generated/landing-hero.dim_1920x1080.png)' }}
        />
        {/* Dark overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background" />
        {/* Neon accent lines */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute bottom-0 left-0 right-0 h-px opacity-60"
            style={{ background: 'linear-gradient(to right, transparent, oklch(0.72 0.22 38), transparent)' }}
          />
          <div
            className="absolute top-1/3 left-0 right-0 h-px opacity-20"
            style={{ background: 'linear-gradient(to right, transparent, oklch(0.82 0.28 95), transparent)' }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto">
          {/* Logo */}
          <div className="mb-6 animate-fade-in">
            <img
              src="/assets/generated/revreel-logo.dim_256x256.png"
              alt="RevReel"
              className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-2xl"
            />
          </div>

          {/* Brand name */}
          <h1
            className="font-display text-7xl md:text-9xl font-black tracking-widest mb-2 animate-fade-in"
            style={{
              color: 'oklch(0.97 0.005 260)',
              textShadow: '0 0 40px oklch(0.72 0.22 38 / 0.6), 0 0 80px oklch(0.72 0.22 38 / 0.3)',
            }}
          >
            REV<span style={{ color: 'oklch(0.72 0.22 38)', textShadow: '0 0 20px oklch(0.72 0.22 38 / 0.9), 0 0 40px oklch(0.72 0.22 38 / 0.5)' }}>REEL</span>
          </h1>

          {/* Tagline */}
          <p
            className="font-display text-xl md:text-3xl font-semibold tracking-widest mb-4 animate-fade-in"
            style={{ color: 'oklch(0.82 0.28 95)', textShadow: '0 0 10px oklch(0.82 0.28 95 / 0.5)' }}
          >
            THE ULTIMATE CAR CULTURE PLATFORM
          </p>

          <p className="text-base md:text-lg text-muted-foreground max-w-xl mb-10 animate-fade-in font-body leading-relaxed">
            Share your builds, connect with racers, find car meets, and dominate the leaderboard. 
            Your car culture community awaits.
          </p>

          {/* CTA Button */}
          <button
            onClick={handleJoin}
            disabled={isLoading}
            className="group relative px-10 py-4 font-display text-xl font-black tracking-widest uppercase rounded-sm transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed animate-fade-in"
            style={{
              background: isLoading
                ? 'oklch(0.72 0.22 38 / 0.6)'
                : 'oklch(0.72 0.22 38)',
              color: 'oklch(0.08 0.005 260)',
              boxShadow: isLoading
                ? 'none'
                : '0 0 20px oklch(0.72 0.22 38 / 0.7), 0 0 40px oklch(0.72 0.22 38 / 0.4)',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  '0 0 30px oklch(0.72 0.22 38 / 0.9), 0 0 60px oklch(0.72 0.22 38 / 0.6)';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px) scale(1.02)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  '0 0 20px oklch(0.72 0.22 38 / 0.7), 0 0 40px oklch(0.72 0.22 38 / 0.4)';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0) scale(1)';
              }
            }}
          >
            {isLoading ? (
              <span className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                Joining...
              </span>
            ) : (
              'Join RevReel'
            )}
          </button>

          <p className="mt-4 text-sm text-muted-foreground animate-fade-in">
            Free to join · Secure login · No password needed
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-60">
          <span className="text-xs font-display tracking-widest text-muted-foreground">EXPLORE</span>
          <div className="w-px h-8" style={{ background: 'linear-gradient(to bottom, oklch(0.72 0.22 38), transparent)' }} />
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2
            className="font-display text-4xl md:text-5xl font-black text-center mb-3 tracking-widest"
            style={{ color: 'oklch(0.97 0.005 260)' }}
          >
            EVERYTHING FOR CAR CULTURE
          </h2>
          <p className="text-center text-muted-foreground mb-12 font-body">
            One platform. Every aspect of the car community.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {features.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="glass-card rounded-sm p-5 md:p-6 border group hover:border-neon transition-all duration-300"
                style={{ borderColor: 'oklch(0.25 0.01 260)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'oklch(0.72 0.22 38)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 15px oklch(0.72 0.22 38 / 0.2)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'oklch(0.25 0.01 260)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }}
              >
                <div
                  className="w-10 h-10 rounded-sm flex items-center justify-center mb-3"
                  style={{ background: 'oklch(0.72 0.22 38 / 0.15)' }}
                >
                  <Icon className="w-5 h-5" style={{ color: 'oklch(0.72 0.22 38)' }} />
                </div>
                <h3 className="font-display text-base md:text-lg font-bold tracking-wide mb-1" style={{ color: 'oklch(0.97 0.005 260)' }}>
                  {label}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground font-body">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative py-20 px-6 text-center">
        <div
          className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'url(/assets/generated/feed-bg.dim_1080x1920.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2
            className="font-display text-4xl md:text-6xl font-black tracking-widest mb-4"
            style={{ color: 'oklch(0.97 0.005 260)' }}
          >
            READY TO REV?
          </h2>
          <p className="text-muted-foreground mb-8 font-body text-lg">
            Join thousands of car enthusiasts already on RevReel.
          </p>
          <button
            onClick={handleJoin}
            disabled={isLoading}
            className="px-10 py-4 font-display text-xl font-black tracking-widest uppercase rounded-sm transition-all duration-300 disabled:opacity-60"
            style={{
              background: 'oklch(0.72 0.22 38)',
              color: 'oklch(0.08 0.005 260)',
              boxShadow: '0 0 20px oklch(0.72 0.22 38 / 0.7), 0 0 40px oklch(0.72 0.22 38 / 0.4)',
            }}
          >
            {isLoading ? (
              <span className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                Joining...
              </span>
            ) : (
              'Join RevReel Free'
            )}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 px-6 text-center" style={{ borderColor: 'oklch(0.25 0.01 260)' }}>
        <p className="text-sm text-muted-foreground font-body">
          © {new Date().getFullYear()} RevReel · Built with{' '}
          <span style={{ color: 'oklch(0.72 0.22 38)' }}>♥</span>{' '}
          using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            style={{ color: 'oklch(0.72 0.22 38)' }}
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
