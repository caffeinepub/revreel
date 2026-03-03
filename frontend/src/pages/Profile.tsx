import React, { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useGetCallerUserProfile,
  useGetUserProfile,
  useGetUserReels,
  useDeleteReel,
} from '../hooks/useQueries';
import { Video } from '../backend';
import EditProfileModal from '../components/EditProfileModal';
import { Trash2, Loader2, BadgeCheck } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Profile() {
  const { userId } = useParams({ strict: false }) as { userId?: string };
  const { identity } = useInternetIdentity();
  const currentUserId = identity?.getPrincipal().toString();

  const isOwnProfile = !userId || userId === currentUserId;

  const { data: callerProfile, isLoading: callerLoading } = useGetCallerUserProfile();
  const { data: viewedProfile, isLoading: viewedLoading } = useGetUserProfile(
    isOwnProfile ? '' : (userId ?? ''),
  );

  const profile = isOwnProfile ? callerProfile : viewedProfile;
  const isLoading = isOwnProfile ? callerLoading : viewedLoading;

  const profileUserId = userId ?? currentUserId ?? '';
  const { data: reels = [], isLoading: reelsLoading } = useGetUserReels(profileUserId);

  const deleteReel = useDeleteReel();
  const [editOpen, setEditOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (reelId: string) => {
    setDeletingId(reelId);
    try {
      await deleteReel.mutateAsync(reelId);
      toast.success('Reel deleted');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete reel');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-neon-orange animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-white/60">Profile not found.</p>
      </div>
    );
  }

  const avatarUrl = profile.avatarUrl || profile.avatar.getDirectURL();

  return (
    <div className="min-h-full bg-background text-white pb-24">
      {/* Header */}
      <div className="relative">
        <div className="h-32 bg-gradient-to-r from-neon-orange/30 to-neon-yellow/20" />
        <div className="px-4 pb-4">
          <div className="flex items-end gap-4 -mt-12">
            <div className="w-24 h-24 rounded-full border-4 border-background overflow-hidden bg-white/10 shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-neon-orange/20">
                  <span className="text-neon-orange text-3xl font-bold">
                    {profile.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 pb-2">
              <div className="flex items-center gap-2">
                <h1 className="text-white font-bold text-xl truncate">{profile.username}</h1>
                {profile.verified && <BadgeCheck className="w-5 h-5 text-neon-orange shrink-0" />}
              </div>
              <p className="text-white/60 text-sm mt-0.5 line-clamp-2">{profile.bio}</p>
            </div>
          </div>

          {/* Badges */}
          {profile.badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {profile.badges.map((badge, i) => (
                <span
                  key={i}
                  className="text-xs bg-neon-orange/20 text-neon-orange border border-neon-orange/30 rounded-full px-2 py-0.5"
                >
                  {String(badge)}
                </span>
              ))}
            </div>
          )}

          {/* Edit button */}
          {isOwnProfile && (
            <button
              onClick={() => setEditOpen(true)}
              className="mt-3 w-full border border-white/20 text-white text-sm rounded-lg py-2 hover:bg-white/10 transition-colors"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="uploads" className="px-4">
        <TabsList className="w-full bg-white/5 border border-white/10">
          <TabsTrigger value="uploads" className="flex-1 text-white data-[state=active]:bg-neon-orange data-[state=active]:text-black">
            Uploads ({reels.length})
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex-1 text-white data-[state=active]:bg-neon-orange data-[state=active]:text-black">
            Saved
          </TabsTrigger>
        </TabsList>

        <TabsContent value="uploads">
          {reelsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-neon-orange animate-spin" />
            </div>
          ) : reels.length === 0 ? (
            <p className="text-white/50 text-center py-8">No uploads yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-1 mt-2">
              {reels.map((reel: Video) => {
                const thumbUrl = reel.thumbnail.getDirectURL();
                const isDeleting = deletingId === reel.id;
                return (
                  <div key={reel.id} className="relative aspect-[9/16] bg-white/5 group">
                    <img
                      src={thumbUrl || '/assets/generated/placeholder-thumb.dim_640x360.png'}
                      alt={reel.title}
                      className="w-full h-full object-cover"
                    />
                    {isOwnProfile && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="absolute top-1 right-1 bg-black/60 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 text-white animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 text-red-400" />
                            )}
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-surface border-white/10 text-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Reel?</AlertDialogTitle>
                            <AlertDialogDescription className="text-white/60">
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(reel.id)}
                              className="bg-red-500 hover:bg-red-600 text-white"
                            >
                              Delete
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

        <TabsContent value="saved">
          <p className="text-white/50 text-center py-8">Saved videos coming soon.</p>
        </TabsContent>
      </Tabs>

      {/* Edit Profile Modal */}
      {isOwnProfile && editOpen && (
        <EditProfileModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          currentProfile={profile}
        />
      )}
    </div>
  );
}
