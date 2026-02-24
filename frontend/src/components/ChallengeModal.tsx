import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePostChallenge, useGetVideosByUser, type Video } from '../hooks/useQueries';
import { Loader2, Zap } from 'lucide-react';

interface ChallengeModalProps {
  open: boolean;
  onClose: () => void;
  challengedUserId: string;
  originalVideoId: string;
}

export default function ChallengeModal({ open, onClose, challengedUserId, originalVideoId }: ChallengeModalProps) {
  const [selectedVideoId, setSelectedVideoId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const { data: myVideos = [], isLoading: videosLoading } = useGetVideosByUser('');
  const postChallenge = usePostChallenge();

  const handleSubmit = async () => {
    if (!selectedVideoId) {
      setError('Please select a video to challenge with');
      return;
    }
    setError(null);
    try {
      await postChallenge.mutateAsync({
        challengedId: challengedUserId,
        videoId: selectedVideoId,
        originalVideoId,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to send challenge');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold text-primary neon-text flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Send Challenge
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Select one of your videos to challenge this racer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {videosLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : myVideos.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              You need to upload a video first to send a challenge.
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {myVideos.map((video: Video) => (
                <div
                  key={video.id}
                  onClick={() => setSelectedVideoId(video.id)}
                  className={`p-3 rounded border cursor-pointer transition-colors ${
                    selectedVideoId === video.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50 hover:bg-muted'
                  }`}
                >
                  <p className="font-medium text-sm">{video.title}</p>
                  <p className="text-xs text-muted-foreground">{video.likes.length} likes</p>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="p-3 rounded bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={postChallenge.isPending}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
              onClick={handleSubmit}
              disabled={postChallenge.isPending || !selectedVideoId}
            >
              {postChallenge.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Challenge'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
