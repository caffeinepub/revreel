import React from 'react';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFollowUser, useUnfollowUser } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  onSuccess?: () => void;
  className?: string;
}

export default function FollowButton({ userId, isFollowing, onSuccess, className }: FollowButtonProps) {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();

  const isPending = followUser.isPending || unfollowUser.isPending;

  const handleClick = async () => {
    if (!isAuthenticated) {
      toast.error('Login to follow users!');
      return;
    }
    try {
      if (isFollowing) {
        await unfollowUser.mutateAsync(userId);
        toast.success('Unfollowed');
      } else {
        await followUser.mutateAsync(userId);
        toast.success('Following! 🔥');
      }
      onSuccess?.();
    } catch (error) {
      toast.error('Action failed. Please try again.');
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isPending}
      variant={isFollowing ? 'outline' : 'default'}
      className={`font-display text-sm ${
        isFollowing
          ? 'border-border text-foreground hover:border-destructive hover:text-destructive'
          : 'bg-neon text-primary-foreground hover:bg-neon/90 neon-glow'
      } ${className ?? ''}`}
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="w-4 h-4 mr-1" />
          FOLLOWING
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-1" />
          FOLLOW
        </>
      )}
    </Button>
  );
}
