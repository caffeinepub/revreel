import React, { useState, useRef } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import {
  Settings, MessageCircle, Grid3X3, Bookmark, Wrench, Trophy, Star, Zap,
  Wind, Flame, Camera, Loader2, AlertCircle, BadgeCheck, BarChart2, Eye,
  Heart, Users, UserPlus, Video, Trash2,
} from 'lucide-react';
import {
  type Video as VideoType,
  type Badge,
  useGetUserProfile,
  useGetAllVideos,
  useGetSavedVideos,
  useGetUserStats,
  useGetCallerUserProfile,
  useGetUserBadges,
  useUpdateAvatar,
  useDeleteVideo,
} from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import FollowButton from '../components/FollowButton';
import EditProfileModal from '../components/EditProfileModal';
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

export default function Profile() {
  const params = useParams({ strict: false }) as { userId?: string };
  const { identity } = useInternetIdentity();
  const currentUserId = identity?.getPrincipal().toString();
  const isAuthenticated = !!identity;

  const targetUserId = params.userId ?? currentUserId ?? '';
  const isOwnProfile = !!targetUserId && targetUserId === currentUserId;

  const { data: profile, isLoading: profileLoading } = useGetUserProfile(targetUserId);
  const { data: callerProfile } = useGetCallerUserProfile();
  const { data: allVideos } = useGetAllVideos();
  const { data: badges } = useGetUserBadges(targetUserId);
  const { data: stats } = useGetUserStats(targetUserId);
  const { data: savedVideos } = useGetSavedVideos();
  const [showEditModal, setShowEditModal] = useState(false);

  const updateAvatar = useUpdateAvatar();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const userVideos: VideoType[] = (allVideos ?? []).filter(
    (v) => v.uploader.toString() === targetUserId
  );

  const handleAvatarClick = () => {
    if (isOwnProfile) {
      avatarInputRef.current?.click();
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;
      try {
        await updateAvatar.mutateAsync({ avatarUrl: dataUrl });
        toast.success('Profile picture updated! 📸');
      } catch {
        toast.error('Failed to update profile picture');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
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
          <div
            className={`relative w-20 h-20 rounded-full border-4 border-background overflow-hidden bg-card group ${isOwnProfile ? 'cursor-pointer' : ''}`}
            onClick={handleAvatarClick}
          >
            <img
              src={avatarSrc}
              alt={profile.username}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/generated/default-avatar.dim_128x128.png';
              }}
            />
            {isOwnProfile && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {updateAvatar.isPending ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
              </div>
            )}
          </div>
          {isOwnProfile && (
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
              disabled={updateAvatar.isPending}
            />
          )}
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
            className="flex-1 rounded-none py-3 font-display text-sm data-[state=active]:text-neon data-[state=active]:border-b-2 data-[state=active]:border-neon"
          >
            <Grid3X3 className="w-4 h-4 mr-1.5" />
            REELS
          </TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger
              value="saved"
              className="flex-1 rounded-none py-3 font-display text-sm data-[state=active]:text-neon data-[state=active]:border-b-2 data-[state=active]:border-neon"
            >
              <Bookmark className="w-4 h-4 mr-1.5" />
              SAVED
            </TabsTrigger>
          )}
          {isOwnProfile && (
            <TabsTrigger
              value="stats"
              className="flex-1 rounded-none py-3 font-display text-sm data-[state=active]:text-neon data-[state=active]:border-b-2 data-[state=active]:border-neon"
            >
              <BarChart2 className="w-4 h-4 mr-1.5" />
              STATS
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="videos" className="mt-0">
          {userVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Grid3X3 className="w-10 h-10 opacity-40" />
              <p className="font-display text-sm">NO REELS YET</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5">
              {userVideos.map((video) => (
                <VideoThumbnail key={video.id} video={video} isOwner={isOwnProfile} />
              ))}
            </div>
          )}
        </TabsContent>

        {isOwnProfile && (
          <TabsContent value="saved" className="mt-0">
            {!savedVideos || savedVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <Bookmark className="w-10 h-10 opacity-40" />
                <p className="font-display text-sm">NO SAVED REELS</p>
                <p className="text-xs text-center">Bookmark videos to find them here</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-0.5">
                {savedVideos.map((video) => (
                  <VideoThumbnail key={video.id} video={video} isOwner={false} />
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {isOwnProfile && (
          <TabsContent value="stats" className="mt-0 p-4">
            {!stats ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <BarChart2 className="w-10 h-10 opacity-40" />
                <p className="font-display text-sm">LOADING STATS...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Videos', value: Number(stats.totalVideos), icon: Video },
                  { label: 'Total Views', value: Number(stats.totalViews), icon: Eye },
                  { label: 'Total Likes', value: Number(stats.totalLikes), icon: Heart },
                  { label: 'Followers', value: Number(stats.totalFollowers), icon: Users },
                  { label: 'Following', value: Number(stats.totalFollowing), icon: UserPlus },
                  { label: 'Build Logs', value: Number(stats.totalBuildLogs), icon: Wrench },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="bg-card/60 backdrop-blur border border-border rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neon/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-neon" />
                    </div>
                    <div>
                      <div className="font-display text-xl text-foreground">{value.toLocaleString()}</div>
                      <div className="text-muted-foreground text-xs">{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Edit Profile Modal */}
      {showEditModal && callerProfile && (
        <EditProfileModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          currentProfile={callerProfile}
        />
      )}
    </div>
  );
}

function VideoThumbnail({ video, isOwner }: { video: VideoType; isOwner: boolean }) {
  const thumbnailUrl = video.thumbnail?.getDirectURL?.() || '/assets/generated/placeholder-thumb.dim_640x360.png';
  const deleteVideo = useDeleteVideo();

  const handleDelete = async () => {
    try {
      await deleteVideo.mutateAsync({ videoId: video.id });
      toast.success('Reel deleted 🗑️');
    } catch {
      toast.error('Failed to delete reel');
    }
  };

  return (
    <div className="relative aspect-[9/16] bg-card overflow-hidden group">
      <Link to="/" className="block w-full h-full">
        <img
          src={thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/assets/generated/placeholder-thumb.dim_640x360.png';
          }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
        <div className="absolute bottom-1 left-1 flex items-center gap-1">
          <span className="text-white text-xs font-bold drop-shadow">❤️ {video.likes.length}</span>
        </div>
      </Link>

      {isOwner && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/60 z-10"
              aria-label="Delete reel"
            >
              <Trash2 className="w-3.5 h-3.5 text-white" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display text-foreground">DELETE REEL?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This will permanently delete your reel and all its comments. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="font-display text-xs tracking-wider">CANCEL</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-display text-xs tracking-wider"
              >
                DELETE
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-32 bg-card/50 animate-pulse" />
      <div className="px-4 pt-14 pb-4 space-y-3">
        <div className="h-6 w-40 bg-card/50 animate-pulse rounded" />
        <div className="h-4 w-24 bg-card/50 animate-pulse rounded" />
        <div className="flex gap-6 mt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center space-y-1">
              <div className="h-6 w-8 bg-card/50 animate-pulse rounded mx-auto" />
              <div className="h-3 w-12 bg-card/50 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
