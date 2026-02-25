import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useFollowUser, useUnfollowUser, useGetFollowers } from "../hooks/useQueries";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";

interface FollowButtonProps {
  userId: string;
}

export default function FollowButton({ userId }: FollowButtonProps) {
  const { identity } = useInternetIdentity();
  const currentUserId = identity?.getPrincipal().toString() ?? "";

  const { data: followers = [] } = useGetFollowers(userId);
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  const isFollowing = (followers as any[]).some(
    (f: any) => f.toString() === currentUserId
  );

  const isLoading = followMutation.isPending || unfollowMutation.isPending;

  const handleToggle = () => {
    if (!identity) return;
    if (isFollowing) {
      unfollowMutation.mutate({ userId });
    } else {
      followMutation.mutate({ userId });
    }
  };

  if (!identity || currentUserId === userId) return null;

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-sm font-semibold transition-colors disabled:opacity-50 ${
        isFollowing
          ? "border border-border hover:bg-muted"
          : "bg-primary text-primary-foreground hover:bg-primary/90"
      }`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="h-4 w-4" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          Follow
        </>
      )}
    </button>
  );
}
