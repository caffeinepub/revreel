import React, { useState, useRef } from 'react';
import { X, Camera, Loader2 } from 'lucide-react';
import { type UserProfile, useUpdateProfile } from '../hooks/useQueries';
import { ExternalBlob } from '../backend';

interface EditProfileModalProps {
  profile: UserProfile;
  onClose: () => void;
}

export default function EditProfileModal({ profile, onClose }: EditProfileModalProps) {
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatarUrl || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateProfile = useUpdateProfile();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    let avatar: ExternalBlob;
    let avatarUrl: string | undefined;

    if (avatarFile) {
      const bytes = new Uint8Array(await avatarFile.arrayBuffer());
      avatar = ExternalBlob.fromBytes(bytes);
      avatarUrl = avatarPreview || undefined;
    } else {
      avatar = profile.avatar;
      avatarUrl = profile.avatarUrl;
    }

    await updateProfile.mutateAsync({ username: username.trim(), bio: bio.trim(), avatar, avatarUrl });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-foreground">Edit Profile</h2>
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar */}
          <div className="flex justify-center">
            <div
              className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer group border-2 border-neon-orange/40"
              onClick={() => fileInputRef.current?.click()}
            >
              <img
                src={avatarPreview || '/assets/generated/default-avatar.dim_128x128.png'}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={24} className="text-white" />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Your racer name..."
              maxLength={30}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon-orange text-base"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Bio</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell the community about yourself..."
              rows={3}
              maxLength={200}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon-orange resize-none text-base"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-border text-foreground font-bold text-base hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateProfile.isPending || !username.trim()}
              className="flex-1 py-3 rounded-xl bg-neon-orange text-black font-bold text-base hover:bg-neon-orange/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {updateProfile.isPending ? (
                <><Loader2 size={18} className="animate-spin" /> Saving...</>
              ) : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
