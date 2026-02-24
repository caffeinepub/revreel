import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUpdateProfile, ExternalBlob, type UserProfile } from '../hooks/useQueries';
import { User, Camera, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  currentProfile: UserProfile;
}

export default function EditProfileModal({ open, onClose, currentProfile }: EditProfileModalProps) {
  const queryClient = useQueryClient();
  const updateProfile = useUpdateProfile();

  const [username, setUsername] = useState(currentProfile.username);
  const [bio, setBio] = useState(currentProfile.bio);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentProfile.avatarUrl || null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setUsername(currentProfile.username);
      setBio(currentProfile.bio);
      setAvatarPreview(currentProfile.avatarUrl || null);
      setAvatarFile(null);
      setError(null);
    }
  }, [open, currentProfile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    try {
      let avatarBlob: ExternalBlob;
      let avatarUrl = currentProfile.avatarUrl;

      if (avatarFile) {
        const bytes = new Uint8Array(await avatarFile.arrayBuffer());
        avatarBlob = ExternalBlob.fromBytes(bytes);
        avatarUrl = avatarPreview ?? '';
      } else if (currentProfile.avatarUrl) {
        avatarBlob = ExternalBlob.fromURL(currentProfile.avatarUrl);
      } else {
        avatarBlob = ExternalBlob.fromURL('/assets/generated/default-avatar.dim_128x128.png');
        avatarUrl = '/assets/generated/default-avatar.dim_128x128.png';
      }

      await updateProfile.mutateAsync({
        username: username.trim(),
        bio: bio.trim(),
        avatar: avatarBlob,
        avatarUrl,
      });

      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile. Please try again.';
      setError(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">Edit Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-neon-orange/40 bg-muted">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}
              </div>
              <label
                htmlFor="edit-avatar-upload"
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-neon-orange flex items-center justify-center cursor-pointer hover:bg-neon-yellow transition-colors"
              >
                <Camera className="w-3.5 h-3.5 text-black" />
              </label>
              <input
                id="edit-avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={updateProfile.isPending}
              />
            </div>
            <span className="text-xs text-muted-foreground">Change profile photo</span>
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-username" className="text-sm font-medium">
              Username <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. driftking99"
              disabled={updateProfile.isPending}
              maxLength={30}
              className="bg-background border-border focus:border-neon-orange"
            />
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-bio" className="text-sm font-medium">
              Bio <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea
              id="edit-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the community about yourself and your ride..."
              disabled={updateProfile.isPending}
              maxLength={200}
              rows={3}
              className="bg-background border-border focus:border-neon-orange resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateProfile.isPending}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateProfile.isPending || !username.trim()}
              className="flex-1 bg-neon-orange hover:bg-neon-yellow text-black font-bold"
            >
              {updateProfile.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
