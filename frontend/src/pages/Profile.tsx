import React, { useState, useRef } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useGetUserProfile, useGetAllVideos, useGetCallerUserProfile, useDeleteVideo, useUpdateAvatar } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Grid3X3, Car, Settings, AlertCircle, Trash2, Camera, Loader2, MessageCircle } from 'lucide-react';
import FollowButton from '../components/FollowButton';
import EditProfileModal from '../components/EditProfileModal';
import { type Video } from '../backend';
import { toast } from 'sonner';
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

export default function Profile() {
  const params = useParams({ strict: false }) as { userId?: string };
  const { identity } = useInternetIdentity();
  const currentUserId = identity?.getPrincipal().toString();
  const isAuthenticated = !!identity;

  // If no userId param, show current user's profile
  const targetUserId = params.userId ?? currentUserId ?? null;
  const isOwnProfile = targetUserId === currentUserId;

  const { data: profile, isLoading: profileLoading } = useGetUserProfile(targetUserId);
  const { data: callerProfile } = useGetCallerUserProfile();
  const { data: allVideos } = useGetAllVideos();
  const [showEditModal, setShowEditModal] = useState(false);

  const updateAvatar = useUpdateAvatar();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const userVideos: Video[] = (allVideos ?? []).filter(
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

    // Convert to data URL
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;
      try {
        await updateAvatar.mutateAsync(dataUrl);
        toast.success('Profile picture updated! 📸');
      } catch {
        toast.error('Failed to update profile picture');
      }
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be re-selected
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

  // Prefer avatarUrl (data URL from updateAvatar), fall back to blob URL, then default
  const avatarSrc =
    profile.avatarUrl && profile.avatarUrl.length > 0
      ? profile.avatarUrl
      : profile.avatar.getDirectURL() || '/assets/generated/default-avatar.dim_128x128.png';

  return (
    <div className="min-h-screen bg-background">
      {/* Profile Header */}
      <div className="relative">
        {/* Background banner */}
        <div className="h-32 bg-gradient-to-br from-neon/20 via-background to-background relative overflow-hidden">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'url(/assets/generated/feed-bg.dim_1080x1920.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
        </div>

        {/* Avatar */}
        <div className="absolute left-4 bottom-0 translate-y-1/2">
          <div
            className={`relative w-20 h-20 rounded-full border-4 border-background overflow-hidden bg-card neon-border group ${isOwnProfile ? 'cursor-pointer' : ''}`}
            onClick={handleAvatarClick}
          >
            <img
              src={avatarSrc}
              alt={profile.username}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = '/assets/generated/default-avatar.dim_128x128.png'; }}
            />
            {/* Camera overlay — only for own profile */}
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
          {/* Hidden file input */}
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
            <h1 className="font-display text-2xl text-foreground">{profile.username}</h1>
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
                  <FollowButton
                    userId={targetUserId}
                    isFollowing={false}
                  />
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

        {/* Stats */}
        <div className="flex gap-6 mt-4">
          <div className="text-center">
            <div className="font-display text-xl text-neon">{userVideos.length}</div>
            <div className="text-muted-foreground text-xs font-display">REELS</div>
          </div>
          <div className="text-center">
            <div className="font-display text-xl text-foreground">—</div>
            <div className="text-muted-foreground text-xs font-display">FOLLOWERS</div>
          </div>
          <div className="text-center">
            <div className="font-display text-xl text-foreground">—</div>
            <div className="text-muted-foreground text-xs font-display">FOLLOWING</div>
          </div>
          <div className="text-center">
            <div className="font-display text-xl text-foreground">
              {userVideos.reduce((sum, v) => sum + v.likes.length, 0)}
            </div>
            <div className="text-muted-foreground text-xs font-display">LIKES</div>
          </div>
        </div>

        {/* Avatar upload hint for own profile */}
        {isOwnProfile && (
          <p className="text-muted-foreground text-xs mt-2">
            Tap your avatar to change your profile picture
          </p>
        )}
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
          <TabsTrigger
            value="garage"
            className="flex-1 rounded-none py-3 font-display text-sm data-[state=active]:text-neon data-[state=active]:border-b-2 data-[state=active]:border-neon"
          >
            <Car className="w-4 h-4 mr-1.5" />
            GARAGE
          </TabsTrigger>
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

        <TabsContent value="garage" className="mt-0 p-4">
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <Car className="w-10 h-10 opacity-40" />
            <p className="font-display text-sm">GARAGE COMING SOON</p>
            <p className="text-xs text-center">Add your cars to show off your collection</p>
          </div>
        </TabsContent>
      </Tabs>

      {showEditModal && callerProfile && (
        <EditProfileModal
          profile={callerProfile}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}

function VideoThumbnail({ video, isOwner }: { video: Video; isOwner: boolean }) {
  const thumbnailUrl = video.thumbnail.getDirectURL() || '/assets/generated/placeholder-thumb.dim_640x360.png';
  const deleteVideo = useDeleteVideo();

  const handleDelete = async () => {
    try {
      await deleteVideo.mutateAsync(video.id);
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
          onError={(e) => { (e.target as HTMLImageElement).src = '/assets/generated/placeholder-thumb.dim_640x360.png'; }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
        <div className="absolute bottom-1 left-1 flex items-center gap-1">
          <span className="text-white text-xs font-bold drop-shadow">❤️ {video.likes.length}</span>
        </div>
      </Link>

      {/* Delete button overlay for owner */}
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
      <Skeleton className="h-32 w-full" />
      <div className="pt-14 px-4 space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full" />
        <div className="flex gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-12" />
          ))}
        </div>
      </div>
    </div>
  );
}
