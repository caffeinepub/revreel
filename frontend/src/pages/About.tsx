import React, { useState } from 'react';
import { Car, Zap, Users, Search, Heart, Copy, Check } from 'lucide-react';
import { SiInstagram } from 'react-icons/si';

const features = [
  {
    icon: Zap,
    text: 'Short-form videos and photos focused entirely on cars',
  },
  {
    icon: Search,
    text: 'Swipe-based discovery to find new builds instantly',
  },
  {
    icon: Car,
    text: 'Detailed car profiles with specs, mods, and build history',
  },
  {
    icon: Users,
    text: 'Follow creators, builders, and local enthusiasts',
  },
  {
    icon: Heart,
    text: 'A community driven by passion, not algorithms chasing trends',
  },
];

export default function About() {
  const [copied, setCopied] = useState(false);

  const handleCopyCashApp = () => {
    navigator.clipboard.writeText('$alteredsol').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url('/assets/generated/tuner-car-hero.dim_1200x600.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 pt-16 pb-12 text-center">
          <div className="flex justify-center mb-6">
            <img
              src="/assets/generated/revreel-logo.dim_256x256.png"
              alt="RevReel"
              className="h-20 w-20 object-contain drop-shadow-[0_0_20px_var(--color-primary)]"
            />
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-black uppercase tracking-widest text-primary neon-text mb-4">
            RevReel
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed">
            The ultimate social platform built by car enthusiasts, for car enthusiasts.
          </p>
        </div>
      </section>

      {/* Main Description */}
      <section className="max-w-3xl mx-auto px-6 py-10">
        <div className="glass-card rounded-2xl p-8 border border-primary/20 shadow-neon-sm">
          <p className="text-foreground/90 text-base md:text-lg leading-relaxed mb-6">
            Think TikTok—but every post is pure automotive culture. From slammed builds and drift
            clips to engine swaps, burnouts, restorations, and daily drivers, RevReel is where cars
            take center stage.
          </p>
          <p className="text-foreground/90 text-base md:text-lg leading-relaxed">
            Swipe left or right through endless car content, discover unique builds, and connect
            with owners from all over the world. Every profile is more than just a username—showcase
            your car with photos, videos, specs, build lists, future plans, and mods in progress.
            Whether you're into JDM, muscle, Euro, off-road, or street builds, RevReel is your
            digital garage.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-3xl mx-auto px-6 py-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">🔥</span>
          <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wider text-primary">
            Features
          </h2>
        </div>
        <div className="space-y-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="glass-card rounded-xl p-5 border border-primary/15 flex items-start gap-4 hover:border-primary/40 transition-colors"
              >
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-foreground/85 text-base leading-relaxed pt-1.5">{feature.text}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 glass-card rounded-2xl p-6 border border-primary/20 text-center">
          <p className="text-foreground/80 text-base md:text-lg leading-relaxed italic">
            RevReel isn't just an app—it's a movement for people who live and breathe cars.
          </p>
        </div>
      </section>

      {/* Support Section */}
      <section className="max-w-3xl mx-auto px-6 py-8">
        <div className="glass-card rounded-2xl p-8 border border-accent/30 shadow-[0_0_30px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-2xl">🚗</span>
            <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wider text-accent">
              Support RevReel
            </h2>
          </div>

          <p className="text-foreground/85 text-base leading-relaxed mb-4">
            RevReel is independently built and community-powered. If you'd like to support
            development, server costs, and future features, donations are always appreciated.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 my-6 p-5 rounded-xl bg-accent/10 border border-accent/25">
            <div className="flex-1">
              <p className="text-sm text-foreground/60 uppercase tracking-wider font-medium mb-1">
                Cash App
              </p>
              <p className="font-display text-2xl font-bold text-accent tracking-wide">
                $alteredsol
              </p>
            </div>
            <button
              onClick={handleCopyCashApp}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent/20 hover:bg-accent/30 border border-accent/40 text-accent font-medium text-sm transition-all active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Handle
                </>
              )}
            </button>
          </div>

          <p className="text-foreground/70 text-sm leading-relaxed">
            Your support helps keep RevReel growing, improving, and focused on the car community
            first.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="max-w-3xl mx-auto px-6 py-8 pb-16">
        <div className="glass-card rounded-2xl p-8 border border-primary/30 shadow-neon-sm">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-2xl">📩</span>
            <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wider text-primary">
              Contact
            </h2>
          </div>

          <p className="text-foreground/80 text-base leading-relaxed mb-6">
            Have questions, feedback, or just want to connect? Reach out on Instagram.
          </p>

          <a
            href="https://www.instagram.com/boddysum"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-6 py-4 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/60 transition-all group"
          >
            <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/15 border border-primary/40 flex items-center justify-center group-hover:border-primary/70 transition-colors">
              <SiInstagram className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-foreground/50 uppercase tracking-wider font-medium mb-0.5">
                Instagram
              </p>
              <p className="font-display text-xl font-bold text-primary tracking-wide neon-text">
                @boddysum
              </p>
            </div>
          </a>
        </div>
      </section>
    </div>
  );
}
