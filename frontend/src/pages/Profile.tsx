import React, { useState } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import {
  type Video as VideoType,
  type Badge,
  type UserProfile,
  useGetUserProfile,
  useGetCallerUserProfile,
  useGetVideosByUser,
  useGetSavedVideos,
  useGetUserStats,
  useGetUserBadges,
  useDeleteVideo,
} from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import FollowButton from '../components/FollowButton';
import EditProfileModal from '../components/EditProfileModal';
import VideoCard from '../components/VideoCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Settings, MessageCircle, Grid3X3, Bookmark, Wrench, Trophy, Star, Zap,
  Wind, Flame, Camera, Loader2, AlertCircle, BadgeCheck, BarChart2, Eye,
  Heart, Users, UserPlus, Video, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

const BADGE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  driftKing: { label: 'Drift King', icon: <Wind size={14} />, color: 'text-blue-400' },
  mechanicPro: { label: 'Mechanic Pro', icon: <Wrench size={14} />, color: 'text-green-400' },
  dragRacer: { label: 'Drag Racer', icon: <Zap size={14} />, color: 'text-yellow-400' },
  communityHelper: { label: 'Community Helper', icon: <Star size={14} />, color: 'text-purple-400' },
  verified: { label: 'Verified', icon: <Trophy size={14} />, color: 'text-neon-orange' },
  buildMaster: { label: 'Build Master', icon: <Wrench size={14} />, color: 'text-orange-400' },
  racingLegend: { label: 'Racing Legend', icon: <Flame size={14} />, color: 'text-red-400' },
};

function badgeKey(badge: Badge): string {
  if (typeof badge === 'string') return badge;
  if (typeof badge === 'object' && badge !== null) return Object.keys(badge as object)[0] ?? '';
  return '';
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background pt-14 pb-20">
      <div className="h-32 bg-muted animate-pulse" />
      <div className="px-4 pt-14 pb-4 space-y-3">
        <div className="h-6 w-40 bg-muted animate-pulse rounded" />
        <div className="h-4 w-64 bg-muted animate-pulse rounded" />
        <div className="flex gap-6 mt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center">
              <div className="h-6 w-10 bg-muted animate-pulse rounded mx-auto mb-1" />
              <div className="h-3 w-12 bg-muted animate-pulse rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const params = useParams({ strict: false }) as { userId?: string };
  const { identity } = useInternetIdentity();
  const currentUserId = identity?.getPrincipal().toString();
  const isAuthenticated = !!identity;

  const targetUserId = params.userId ?? currentUserId ?? '';
  const isOwnProfile = !!targetUserId && targetUserId === currentUserId;

  // Use getCallerUserProfile for own profile to avoid permission issues
  const { data: callerProfile, isLoading: callerLoading } = useGetCallerUserProfile();
  const { data: otherProfile, isLoading: otherLoading } = useGetUserProfile(
    isOwnProfile ? '' : targetUserId
  );

  const profile: UserProfile | null | undefined = isOwnProfile ? callerProfile : otherProfile;
  const profileLoading = isOwnProfile ? callerLoading : otherLoading;

  const { data: allVideos } = useGetVideosByUser(targetUserId);
  const { data: badges } = useGetUserBadges(targetUserId);
  const { data: stats } = useGetUserStats(targetUserId);
  const { data: savedVideos } = useGetSavedVideos();
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeVideoIndex, setActiveVideoIndex] = useState<number | null>(null);

  const deleteVideo = useDeleteVideo();

  const userVideos: VideoType[] = (allVideos ?? []).filter(
    (v) => v.uploader.toString() === targetUserId
  );

  const handleDeleteVideo = async (videoId: string) => {
    try {
      await deleteVideo.mutateAsync({ videoId });
      toast.success('Video deleted');
    } catch {
      toast.error('Failed to delete video');
    }
  };

  if (profileLoading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6">
        <AlertCircle className="w-12 h-12 text-muted-foreground" />
        <h2 className="font-display text-2xl text-foreground">PROFILE NOT FOUND</h2>
        <p className="text-muted-foreground text-center">This racer hasn't set up their profile yet.</p>
      </div>
    );
  }

  const avatarSrc =
    profile.avatarUrl && profile.avatarUrl.length > 0
      ? profile.avatarUrl
      : '/assets/generated/default-avatar.dim_128x128.png';

  return (
    <div className="min-h-screen bg-background">
      {/* Profile Header */}
      <div className="relative">
        <div className="h-32 bg-gradient-to-br from-neon/20 via-background to-background relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'url(/assets/generated/feed-bg.dim_1080x1920.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        </div>

        {/* Avatar */}
        <div className="absolute left-4 bottom-0 translate-y-1/2">
          <div className="relative w-20 h-20 rounded-full border-4 border-background overflow-hidden bg-card">
            <img
              src={avatarSrc}
              alt={profile.username}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/generated/default-avatar.dim_128x128.png';
              }}
            />
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="pt-14 px-4 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-display text-2xl text-foreground">{profile.username}</h1>
              {profile.verified && (
                <BadgeCheck className="w-5 h-5 text-neon flex-shrink-0" />
              )}
            </div>
            <p className="text-muted-foreground text-xs mt-0.5">
              {targetUserId?.slice(0, 12)}...
            </p>
          </div>
          <div className="flex gap-2 mt-1">
            {isOwnProfile ? (
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border text-foreground text-sm font-display hover:bg-secondary/80 transition-colors"
              >
                <Settings className="w-4 h-4" />
                EDIT
              </button>
            ) : (
              <div className="flex gap-2">
                {targetUserId && (
                  <FollowButton userId={targetUserId} isFollowing={false} />
                )}
                {isAuthenticated && targetUserId && (
                  <Link
                    to="/messages/$userId"
                    params={{ userId: targetUserId }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-neon/30 text-neon text-sm font-display hover:bg-neon/10 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    MSG
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {profile.bio && (
          <p className="text-foreground/80 text-sm mt-3 leading-relaxed">{profile.bio}</p>
        )}

        {/* Badges */}
        {badges && badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {badges.map((badge) => {
              const key = badgeKey(badge);
              const config = BADGE_CONFIG[key];
              if (!config) return null;
              return (
                <span
                  key={key}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium border-current/30 bg-current/10 ${config.color}`}
                >
                  {config.icon}
                  {config.label}
                </span>
              );
            })}
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-6 mt-4">
          <div className="text-center">
            <div className="font-display text-xl text-neon">{userVideos.length}</div>
            <div className="text-muted-foreground text-xs font-display">REELS</div>
          </div>
          <div className="text-center">
            <div className="font-display text-xl text-foreground">
              {stats ? Number(stats.totalFollowers) : '—'}
            </div>
            <div className="text-muted-foreground text-xs font-display">FOLLOWERS</div>
          </div>
          <div className="text-center">
            <div className="font-display text-xl text-foreground">
              {stats ? Number(stats.totalFollowing) : '—'}
            </div>
            <div className="text-muted-foreground text-xs font-display">FOLLOWING</div>
          </div>
          <div className="text-center">
            <div className="font-display text-xl text-foreground">
              {userVideos.reduce((sum, v) => sum + v.likes.length, 0)}
            </div>
            <div className="text-muted-foreground text-xs font-display">LIKES</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="videos" className="w-full">
        <TabsList className="w-full bg-card border-b border-border rounded-none h-auto p-0">
          <TabsTrigger
            value="videos"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-neon-orange data-[state=active]:text-neon-orange py-3"
          >
            <Grid3X3 className="w-4 h-4 mr-1.5" />
            Reels
          </TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger
              value="saved"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-neon-orange data-[state=active]:text-neon-orange py-3"
            >
              <Bookmark className="w-4 h-4 mr-1.5" />
              Saved
            </TabsTrigger>
          )}
          <TabsTrigger
            value="stats"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-neon-orange data-[state=active]:text-neon-orange py-3"
          >
            <BarChart2 className="w-4 h-4 mr-1.5" />
            Stats
          </TabsTrigger>
        </TabsList>

        {/* Videos Tab */}
        <TabsContent value="videos" className="mt-0">
          {userVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Video className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">No reels yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5">
              {userVideos.map((video, index) => {
                const thumbUrl = video.thumbnail?.getDirectURL?.() ?? '';
                return (
                  <div
                    key={video.id}
                    className="relative aspect-[9/16] bg-muted overflow-hidden cursor-pointer group"
                    onClick={() => setActiveVideoIndex(index)}
                  >
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Video className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-3 text-white text-xs">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" /> {video.likes.length}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {Number(video.viewCount)}
                        </span>
                      </div>
                    </div>
                    {isOwnProfile && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full bg-black/60 text-white"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Video?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteVideo(video.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deleteVideo.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                'Delete'
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Saved Tab */}
        {isOwnProfile && (
          <TabsContent value="saved" className="mt-0">
            {!savedVideos || savedVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Bookmark className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">No saved reels yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-0.5">
                {savedVideos.map((video) => {
                  const thumbUrl = video.thumbnail?.getDirectURL?.() ?? '';
                  return (
                    <div
                      key={video.id}
                      className="relative aspect-[9/16] bg-muted overflow-hidden"
                    >
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <Video className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        )}

        {/* Stats Tab */}
        <TabsContent value="stats" className="mt-0 p-4">
          {stats ? (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Videos', value: Number(stats.totalVideos), icon: <Video className="w-4 h-4" /> },
                { label: 'Total Views', value: Number(stats.totalViews), icon: <Eye className="w-4 h-4" /> },
                { label: 'Total Likes', value: Number(stats.totalLikes), icon: <Heart className="w-4 h-4" /> },
                { label: 'Total Comments', value: Number(stats.totalComments), icon: <MessageCircle className="w-4 h-4" /> },
                { label: 'Followers', value: Number(stats.totalFollowers), icon: <Users className="w-4 h-4" /> },
                { label: 'Following', value: Number(stats.totalFollowing), icon: <UserPlus className="w-4 h-4" /> },
                { label: 'Build Logs', value: Number(stats.totalBuildLogs), icon: <Wrench className="w-4 h-4" /> },
              ].map(({ label, value, icon }) => (
                <div key={label} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-neon-orange/10 flex items-center justify-center text-neon-orange flex-shrink-0">
                    {icon}
                  </div>
                  <div>
                    <div className="font-display text-lg text-foreground">{value.toLocaleString()}</div>
                    <div className="text-muted-foreground text-xs">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <BarChart2 className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">No stats available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Full-screen video viewer */}
      {activeVideoIndex !== null && userVideos[activeVideoIndex] && (
        <div className="fixed inset-0 z-50 bg-black">
          <button
            onClick={() => setActiveVideoIndex(null)}
            className="absolute top-4 left-4 z-10 text-white p-2 bg-black/50 rounded-full"
          >
            ✕
          </button>
          <VideoCard
            video={userVideos[activeVideoIndex]}
            currentUserProfile={callerProfile ?? null}
          />
        </div>
      )}

      {/* Edit Profile Modal */}
      {isOwnProfile && profile && (
        <EditProfileModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          currentProfile={profile}
        />
      )}
    </div>
  );
}
