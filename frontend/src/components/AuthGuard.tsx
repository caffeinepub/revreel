import React from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { identity, login, isLoggingIn, isInitializing } = useInternetIdentity();

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-neon rounded-full border-t-transparent animate-spin mx-auto" />
          <p className="text-muted-foreground font-display text-lg">LOADING...</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-6">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-20 h-20 rounded-full bg-neon/10 border border-neon/30 flex items-center justify-center mx-auto neon-glow">
            <Flame className="w-10 h-10 text-neon" />
          </div>
          <div>
            <h2 className="font-display text-3xl text-foreground mb-2">JOIN THE RACE</h2>
            <p className="text-muted-foreground">Login to access this feature and join the RevReel community.</p>
          </div>
          <Button
            onClick={login}
            disabled={isLoggingIn}
            className="w-full bg-neon text-primary-foreground font-display text-lg py-6 hover:bg-neon/90 neon-glow"
          >
            {isLoggingIn ? 'CONNECTING...' : 'LOGIN TO CONTINUE'}
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
