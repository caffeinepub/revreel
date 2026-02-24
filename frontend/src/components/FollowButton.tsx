import React from 'react';
import { useFollowUser, useUnfollowUser } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface FollowButtonProps {
  userId: string;
  isFollowing?: boolean;
}

export default function FollowButton({ userId, isFollowing = false }: FollowButtonProps) {
  const { identity } = useInternetIdentity();
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();

  if (!identity) return null;

  const myPrincipal = identity.getPrincipal().toString();
  if (myPrincipal === userId) return null;

  const isPending = followUser.isPending || unfollowUser.isPending;

  const handleClick = () => {
    if (isFollowing) {
      unfollowUser.mutate({ userId });
    } else {
      followUser.mutate({ userId });
    }
  };

  return (
    <Button
      size="sm"
      variant={isFollowing ? 'outline' : 'default'}
      onClick={handleClick}
      disabled={isPending}
      className={isFollowing ? 'border-border' : 'bg-neon-orange text-black hover:bg-neon-yellow font-bold'}
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="w-4 h-4 mr-1" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-1" />
          Follow
        </>
      )}
    </Button>
  );
}
