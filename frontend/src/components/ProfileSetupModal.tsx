import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useActor } from '../hooks/useActor';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useSaveCallerUserProfile, ExternalBlob } from '../hooks/useQueries';
import { User, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ProfileSetupModalProps {
  open?: boolean;
  onClose?: () => void;
}

export default function ProfileSetupModal({ onClose }: ProfileSetupModalProps) {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const saveProfile = useSaveCallerUserProfile();

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const principalStr = identity?.getPrincipal().toString() ?? 'anonymous';

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

    if (!actor) {
      setError('Connection not ready. Please wait a moment and try again.');
      return;
    }

    // Defensive check: verify no profile already exists before creating one
    setIsVerifying(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingProfile = await (actor as any).getCallerUserProfile();
      if (existingProfile !== null) {
        // Profile already exists — close modal by invalidating the query
        queryClient.invalidateQueries({ queryKey: ['currentUserProfile', principalStr] });
        queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
        onClose?.();
        return;
      }
    } catch {
      // If the check fails, proceed with profile creation
    } finally {
      setIsVerifying(false);
    }

    try {
      let avatarBlob: ExternalBlob;
      let avatarUrl = '';

      if (avatarFile) {
        const bytes = new Uint8Array(await avatarFile.arrayBuffer());
        avatarBlob = ExternalBlob.fromBytes(bytes);
        avatarUrl = avatarPreview ?? '';
      } else {
        avatarBlob = ExternalBlob.fromURL('/assets/generated/default-avatar.dim_128x128.png');
        avatarUrl = '/assets/generated/default-avatar.dim_128x128.png';
      }

      await saveProfile.mutateAsync({
        username: username.trim(),
        bio: bio.trim(),
        avatar: avatarBlob,
        avatarUrl,
      });

      onClose?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create profile. Please try again.';
      setError(message);
    }
  };

  const isLoading = isVerifying || saveProfile.isPending;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-border text-center">
          <div className="w-16 h-16 rounded-full bg-neon-orange/20 flex items-center justify-center mx-auto mb-3">
            <User className="w-8 h-8 text-neon-orange" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">Welcome to RevReel</h2>
          <p className="text-muted-foreground text-sm mt-1">Set up your profile to get started</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
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
                htmlFor="avatar-upload"
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-neon-orange flex items-center justify-center cursor-pointer hover:bg-neon-yellow transition-colors"
              >
                <Camera className="w-3.5 h-3.5 text-black" />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={isLoading}
              />
            </div>
            <span className="text-xs text-muted-foreground">Upload profile photo (optional)</span>
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-sm font-medium">
              Username <span className="text-destructive">*</span>
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. driftking99"
              disabled={isLoading}
              maxLength={30}
              className="bg-background border-border focus:border-neon-orange"
            />
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <Label htmlFor="bio" className="text-sm font-medium">
              Bio <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the community about yourself and your ride..."
              disabled={isLoading}
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

          {/* Submit */}
          <Button
            type="submit"
            disabled={isLoading || !username.trim()}
            className="w-full bg-neon-orange hover:bg-neon-yellow text-black font-bold font-display tracking-wider"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isVerifying ? 'Checking...' : 'Setting up...'}
              </>
            ) : (
              'Join RevReel'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
