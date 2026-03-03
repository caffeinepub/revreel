import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Camera } from 'lucide-react';
import { useUpdateProfile } from '../hooks/useQueries';
import { ExternalBlob, UserProfile } from '../backend';
import { toast } from 'sonner';

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  currentProfile: UserProfile;
}

export default function EditProfileModal({ open, onClose, currentProfile }: EditProfileModalProps) {
  const updateProfile = useUpdateProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(currentProfile.username);
  const [bio, setBio] = useState(currentProfile.bio);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(currentProfile.avatarUrl);
  const [uploading, setUploading] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setUploading(true);
    try {
      let avatarBlob: ExternalBlob = currentProfile.avatar;
      if (avatarFile) {
        const bytes = new Uint8Array(await avatarFile.arrayBuffer());
        avatarBlob = ExternalBlob.fromBytes(bytes);
      }

      const updated: UserProfile = {
        ...currentProfile,
        username: username.trim(),
        bio: bio.trim(),
        avatar: avatarBlob,
        avatarUrl: avatarPreview,
      };

      await updateProfile.mutateAsync(updated);
      toast.success('Profile updated!');
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-surface border-white/10 text-white max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="text-neon-orange font-display text-xl">Edit Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="relative w-20 h-20 rounded-full overflow-hidden bg-white/10 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <p className="text-white/50 text-xs">Tap to change avatar</p>
          </div>

          <div className="space-y-1">
            <Label className="text-white/70 text-sm">Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder-white/40"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-white/70 text-sm">Bio</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder-white/40 resize-none"
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-white/70 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={uploading || updateProfile.isPending}
              className="bg-neon-orange text-black font-bold hover:bg-neon-orange/90"
            >
              {uploading || updateProfile.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
