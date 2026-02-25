import { useState } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetCallerUserProfile,
  useGetUserProfile,
  useGetVideosByUser,
  useGetSavedVideos,
  useGetFollowers,
  useGetFollowing,
} from "../hooks/useQueries";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import VideoCard from "../components/VideoCard";
import EditProfileModal from "../components/EditProfileModal";
import FollowButton from "../components/FollowButton";
import {
  User,
  Film,
  Bookmark,
  BookOpen,
  CheckCircle,
  Users,
  Eye,
  Heart,
} from "lucide-react";

const BADGE_LABELS: Record<string, string> = {
  driftKing: "Drift King",
  mechanicPro: "Mechanic Pro",
  dragRacer: "Drag Racer",
  communityHelper: "Community Helper",
  verified: "Verified",
  buildMaster: "Build Master",
  racingLegend: "Racing Legend",
};

export default function Profile() {
  const { userId } = useParams({ from: "/app-layout/profile/$userId" });
  const { identity } = useInternetIdentity();
  const [showEditModal, setShowEditModal] = useState(false);

  const currentUserId = identity?.getPrincipal().toString() ?? "";
  const isOwnProfile = !!currentUserId && currentUserId === userId;

  // Use appropriate hook based on whether viewing own or other profile
  const callerProfileQuery = useGetCallerUserProfile();
  const otherProfileQuery = useGetUserProfile(isOwnProfile ? "" : userId);

  const profileQuery = isOwnProfile ? callerProfileQuery : otherProfileQuery;
  const profile = profileQuery.data;
  const profileLoading = profileQuery.isLoading;

  const { data: userVideos = [], isLoading: videosLoading } =
    useGetVideosByUser(userId);
  const { data: savedVideos = [], isLoading: savedLoading } =
    useGetSavedVideos();
  const { data: followers = [] } = useGetFollowers(userId);
  const { data: following = [] } = useGetFollowing(userId);

  const { data: callerProfile } = useGetCallerUserProfile();

  if (profileLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </div>
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-display font-bold mb-2">User Not Found</h2>
        <p className="text-muted-foreground mb-6">
          This profile doesn't exist or may have been removed.
        </p>
        <Link
          to="/feed"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded font-semibold hover:bg-primary/90 transition-colors"
        >
          Back to Feed
        </Link>
      </div>
    );
  }

  const avatarUrl =
    profile.avatarUrl || profile.avatar?.getDirectURL?.() || "";
  const totalLikes = (userVideos as any[]).reduce(
    (sum: number, v: any) => sum + (v.likes?.length ?? 0),
    0
  );
  const totalViews = (userVideos as any[]).reduce(
    (sum: number, v: any) => sum + (v.viewCount ?? 0),
    0
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Profile Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={profile.username}
              className="h-20 w-20 rounded-full object-cover border-2 border-primary"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center border-2 border-primary">
              <User className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
          {profile.verified && (
            <CheckCircle className="absolute -bottom-1 -right-1 h-5 w-5 text-primary fill-background" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-display font-bold truncate">
              {profile.username}
            </h1>
            {profile.verified && (
              <Badge variant="default" className="text-xs">
                Verified
              </Badge>
            )}
          </div>

          {profile.bio && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {profile.bio}
            </p>
          )}

          {/* Badges */}
          {profile.badges && profile.badges.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {profile.badges.map((badge: any) => (
                <Badge key={badge} variant="outline" className="text-xs">
                  {BADGE_LABELS[badge] ?? badge}
                </Badge>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 mt-3">
            {isOwnProfile ? (
              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-1.5 rounded border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                Edit Profile
              </button>
            ) : (
              <FollowButton userId={userId} />
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2 mb-6 bg-muted/30 rounded-xl p-3">
        <div className="text-center">
          <div className="text-lg font-display font-bold text-primary">
            {(userVideos as any[]).length}
          </div>
          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Film className="h-3 w-3" />
            Videos
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-display font-bold text-primary">
            {(followers as any[]).length}
          </div>
          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Users className="h-3 w-3" />
            Followers
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-display font-bold text-primary">
            {totalLikes}
          </div>
          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Heart className="h-3 w-3" />
            Likes
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-display font-bold text-primary">
            {totalViews}
          </div>
          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Eye className="h-3 w-3" />
            Views
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="videos">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="videos" className="flex-1">
            <Film className="h-4 w-4 mr-1" />
            Reels
          </TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger value="saved" className="flex-1">
              <Bookmark className="h-4 w-4 mr-1" />
              Saved
            </TabsTrigger>
          )}
          <TabsTrigger value="builds" className="flex-1">
            <BookOpen className="h-4 w-4 mr-1" />
            Builds
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos">
          {videosLoading ? (
            <div className="grid grid-cols-2 gap-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="aspect-[9/16] rounded-lg" />
              ))}
            </div>
          ) : (userVideos as any[]).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Film className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No videos yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {(userVideos as any[]).map((video: any) => (
                <div
                  key={video.id}
                  className="aspect-[9/16] rounded-lg overflow-hidden"
                >
                  <VideoCard
                    video={video}
                    currentUserProfile={callerProfile ?? null}
                  />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {isOwnProfile && (
          <TabsContent value="saved">
            {savedLoading ? (
              <div className="grid grid-cols-2 gap-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="aspect-[9/16] rounded-lg" />
                ))}
              </div>
            ) : (savedVideos as any[]).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bookmark className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No saved videos yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {(savedVideos as any[]).map((video: any) => (
                  <div
                    key={video.id}
                    className="aspect-[9/16] rounded-lg overflow-hidden"
                  >
                    <VideoCard
                      video={video}
                      currentUserProfile={callerProfile ?? null}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        <TabsContent value="builds">
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No build logs yet</p>
            {isOwnProfile && (
              <Link
                to="/builds"
                className="mt-3 inline-block text-primary text-sm hover:underline"
              >
                Start a build log →
              </Link>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Profile Modal */}
      {showEditModal && profile && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}
