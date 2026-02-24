import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Flame, User, Camera } from 'lucide-react';
import { useCreateUser } from '../hooks/useQueries';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';

export default function ProfileSetupModal() {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const createUser = useCreateUser();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    try {
      let avatar: ExternalBlob;
      let avatarUrl = '';

      if (avatarFile) {
        const bytes = new Uint8Array(await avatarFile.arrayBuffer());
        avatar = ExternalBlob.fromBytes(bytes);
        avatarUrl = avatarPreview || '';
      } else {
        const defaultUrl = `${window.location.origin}/assets/generated/default-avatar.dim_128x128.png`;
        avatar = ExternalBlob.fromURL(defaultUrl);
        avatarUrl = '';
      }

      await createUser.mutateAsync({
        username: username.trim(),
        bio: bio.trim(),
        avatar,
        avatarUrl,
      });
      toast.success('Profile created! Welcome to RevReel 🔥');
    } catch {
      toast.error('Failed to create profile. Please try again.');
    }
  };

  const displayAvatar = avatarPreview || '/assets/generated/default-avatar.dim_128x128.png';

  return (
    <Dialog open={true}>
      <DialogContent
        className="bg-card border-border max-w-md mx-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-neon/10 border border-neon/30 flex items-center justify-center">
              <Flame className="w-5 h-5 text-neon" />
            </div>
            <DialogTitle className="font-display text-2xl text-foreground">SET UP YOUR PROFILE</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground">
            Choose your racer name and tell the community about yourself.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Avatar picker */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="relative w-20 h-20 rounded-full border-4 border-neon/30 overflow-hidden bg-secondary cursor-pointer group"
              onClick={() => avatarInputRef.current?.click()}
            >
              <img
                src={displayAvatar}
                alt="Avatar preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    '/assets/generated/default-avatar.dim_128x128.png';
                }}
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
              {avatarPreview ? 'CHANGE PHOTO' : 'ADD PHOTO (OPTIONAL)'}
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
            <Label htmlFor="username" className="font-display text-sm text-foreground">
              RACER NAME *
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. NightRacer_88"
                className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                maxLength={30}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio" className="font-display text-sm text-foreground">
              BIO
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about your ride and racing style..."
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none"
              rows={3}
              maxLength={150}
            />
          </div>

          <Button
            type="submit"
            disabled={!username.trim() || createUser.isPending}
            className="w-full bg-neon text-primary-foreground font-display text-lg py-5 hover:bg-neon/90 neon-glow disabled:opacity-50"
          >
            {createUser.isPending ? 'CREATING...' : 'START RACING 🔥'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
