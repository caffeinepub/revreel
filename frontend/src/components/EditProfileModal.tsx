import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Camera } from 'lucide-react';
import { useUpdateProfile } from '../hooks/useQueries';
import { type UserProfile } from '../backend';
import { toast } from 'sonner';

interface EditProfileModalProps {
  profile: UserProfile;
  onClose: () => void;
}

export default function EditProfileModal({ profile, onClose }: EditProfileModalProps) {
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);

  // Determine initial avatar display: prefer avatarUrl, then blob URL, then default
  const existingAvatarSrc =
    profile.avatarUrl && profile.avatarUrl.length > 0
      ? profile.avatarUrl
      : profile.avatar.getDirectURL() || '/assets/generated/default-avatar.dim_128x128.png';

  const [avatarPreview, setAvatarPreview] = useState<string>(existingAvatarSrc);
  const [newAvatarDataUrl, setNewAvatarDataUrl] = useState<string>('');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const updateProfile = useUpdateProfile();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setAvatarPreview(dataUrl);
      setNewAvatarDataUrl(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    try {
      const avatar = profile.avatar;
      // Use new data URL if selected, otherwise keep existing avatarUrl
      const avatarUrl = newAvatarDataUrl || profile.avatarUrl || '';
      await updateProfile.mutateAsync({ username: username.trim(), bio: bio.trim(), avatar, avatarUrl });
      toast.success('Profile updated!');
      onClose();
    } catch {
      toast.error('Failed to update profile');
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground">EDIT PROFILE</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Avatar change */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="relative w-20 h-20 rounded-full border-4 border-neon/30 overflow-hidden bg-secondary cursor-pointer group"
              onClick={() => avatarInputRef.current?.click()}
            >
              <img
                src={avatarPreview}
                alt="Avatar"
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = '/assets/generated/default-avatar.dim_128x128.png'; }}
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="text-xs text-neon font-display hover:underline"
            >
              CHANGE PHOTO
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <div className="space-y-2">
            <Label className="font-display text-sm">RACER NAME</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-secondary border-border"
              maxLength={30}
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="font-display text-sm">BIO</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="bg-secondary border-border resize-none"
              rows={3}
              maxLength={150}
            />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 font-display">
              CANCEL
            </Button>
            <Button
              type="submit"
              disabled={!username.trim() || updateProfile.isPending}
              className="flex-1 bg-neon text-primary-foreground font-display hover:bg-neon/90"
            >
              {updateProfile.isPending ? 'SAVING...' : 'SAVE'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
