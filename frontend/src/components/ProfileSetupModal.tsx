import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useActor } from "../hooks/useActor";
import { useSaveCallerUserProfile } from "../hooks/useQueries";
import { ExternalBlob } from "../backend";
import type { UserProfile } from "../backend";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { User, Camera, Loader2 } from "lucide-react";

export default function ProfileSetupModal() {
  const { identity } = useInternetIdentity();
  const { actor } = useActor();
  const saveProfile = useSaveCallerUserProfile();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
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
    if (!identity || !actor) {
      setError("Not authenticated");
      return;
    }

    setUploading(true);
    setError("");

    try {
      // Defensive check: see if profile already exists
      try {
        const existingResult = await actor.getCallerUserProfile();
        if (existingResult.__kind__ === "ok") {
          // Profile already exists, no need to create
          setUploading(false);
          return;
        }
      } catch {
        // Ignore errors here, proceed with creation
      }

      let avatarBlob = ExternalBlob.fromURL("");
      if (avatarFile) {
        const bytes = new Uint8Array(await avatarFile.arrayBuffer());
        avatarBlob = ExternalBlob.fromBytes(bytes);
      }

      const profile: UserProfile = {
        id: identity.getPrincipal(),
        username: username.trim(),
        bio: bio.trim(),
        avatar: avatarBlob,
        avatarUrl: avatarPreview || "",
        verified: false,
        badges: [],
        savedVideos: [],
        joinedAt: BigInt(Date.now()) * BigInt(1_000_000),
      };

      await saveProfile.mutateAsync(profile);
    } catch (err: any) {
      setError(err?.message ?? "Failed to create profile");
    } finally {
      setUploading(false);
    }
  };

  const isLoading = uploading || saveProfile.isPending;

  return (
    <Dialog open={true}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Set Up Your Profile
          </DialogTitle>
          <DialogDescription>
            Welcome to RevReel! Tell us a bit about yourself to get started.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-3">
            <label htmlFor="avatar-upload" className="cursor-pointer group">
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
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <span className="text-xs text-muted-foreground">
              Click to upload avatar (optional)
            </span>
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. driftking99"
              maxLength={30}
              disabled={isLoading}
            />
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
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

          <button
            type="submit"
            disabled={isLoading || !username.trim()}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : (
              "Get Started"
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
