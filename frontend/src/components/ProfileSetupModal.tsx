import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { ExternalBlob, UserProfile } from '../backend';
import { Loader2 } from 'lucide-react';

interface ProfileSetupModalProps {
  open: boolean;
  onComplete: () => void;
}

export default function ProfileSetupModal({ open, onComplete }: ProfileSetupModalProps) {
  const { identity } = useInternetIdentity();
  const saveProfile = useSaveCallerUserProfile();

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity) return;
    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    setError('');

    const principal = identity.getPrincipal();
    const profile: UserProfile = {
      id: principal,
      username: username.trim(),
      bio: bio.trim(),
      avatar: ExternalBlob.fromURL(''),
      avatarUrl: '',
      verified: false,
      badges: [],
      savedVideos: [],
      joinedAt: BigInt(Date.now()),
    };

    try {
      await saveProfile.mutateAsync(profile);
      onComplete();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="bg-card border-border text-foreground max-w-sm mx-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-primary font-display text-xl">
            Set Up Your Profile
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label className="text-muted-foreground text-sm">Username *</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. driftking99"
              className="bg-muted border-border"
              disabled={saveProfile.isPending}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground text-sm">Bio</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the community about yourself…"
              className="bg-muted border-border resize-none"
              rows={3}
              disabled={saveProfile.isPending}
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button
            type="submit"
            disabled={saveProfile.isPending || !username.trim()}
            className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90"
          >
            {saveProfile.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</>
            ) : (
              'Get Started'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
