import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Zap } from 'lucide-react';
import { usePostChallenge } from '../hooks/useQueries';
import { toast } from 'sonner';

interface ChallengeModalProps {
  open: boolean;
  onClose: () => void;
  challengedUserId: string;
  originalVideoId: string;
}

export default function ChallengeModal({
  open,
  onClose,
  challengedUserId,
  originalVideoId,
}: ChallengeModalProps) {
  const postChallenge = usePostChallenge();
  const [videoId, setVideoId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoId.trim()) return;
    try {
      await postChallenge.mutateAsync({
        challengedId: challengedUserId,
        videoId: videoId.trim(),
        originalVideoId,
      });
      toast.success('Challenge sent!');
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send challenge');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-surface border-white/10 text-white max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="text-neon-orange font-display text-xl flex items-center gap-2">
            <Zap className="w-5 h-5" /> Send Challenge
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1">
            <label className="text-white/70 text-sm">Your Video ID</label>
            <input
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
              placeholder="Enter your video ID"
              className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-neon-orange"
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
              disabled={!videoId.trim() || postChallenge.isPending}
              className="bg-neon-orange text-black font-bold hover:bg-neon-orange/90"
            >
              {postChallenge.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</>
              ) : (
                'Challenge!'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
