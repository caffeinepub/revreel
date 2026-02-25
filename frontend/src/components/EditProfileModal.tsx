import { useState } from "react";
import { useUpdateProfile } from "../hooks/useQueries";
import { ExternalBlob } from "../backend";
import type { UserProfile } from "../backend";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { User, Camera, Loader2 } from "lucide-react";

interface EditProfileModalProps {
  profile: UserProfile;
  onClose: () => void;
}

export default function EditProfileModal({ profile, onClose }: EditProfileModalProps) {
  const updateProfile = useUpdateProfile();

  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(
    profile.avatarUrl || profile.avatar?.getDirectURL?.() || ""
  );
  const [error, setError] = useState("");

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
    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    setError("");

    try {
      let avatarBlob = profile.avatar ?? ExternalBlob.fromURL("");
      let newAvatarUrl = profile.avatarUrl;

      if (avatarFile) {
        const bytes = new Uint8Array(await avatarFile.arrayBuffer());
        avatarBlob = ExternalBlob.fromBytes(bytes);
        newAvatarUrl = avatarPreview;
      }

      const updatedProfile: UserProfile = {
        ...profile,
        username: username.trim(),
        bio: bio.trim(),
        avatar: avatarBlob,
        avatarUrl: newAvatarUrl,
      };

      await updateProfile.mutateAsync(updatedProfile);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Failed to update profile");
    }
  };

  const isLoading = updateProfile.isPending;

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Edit Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-3">
            <label htmlFor="edit-avatar-upload" className="cursor-pointer group">
              <div className="h-20 w-20 rounded-full bg-muted border-2 border-dashed border-border group-hover:border-primary transition-colors flex items-center justify-center overflow-hidden">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <User className="h-8 w-8 text-muted-foreground" />
                    <Camera className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            </label>
            <input
              id="edit-avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <span className="text-xs text-muted-foreground">
              Click to change avatar
            </span>
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-username">Username *</Label>
            <Input
              id="edit-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
              maxLength={30}
              disabled={isLoading}
            />
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-bio">Bio</Label>
            <Textarea
              id="edit-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the community about yourself..."
              rows={3}
              maxLength={200}
              disabled={isLoading}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-2.5 rounded border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !username.trim()}
              className="flex-1 bg-primary text-primary-foreground py-2.5 rounded font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
