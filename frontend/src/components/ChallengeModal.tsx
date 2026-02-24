import { useState } from 'react';
import { Flag } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { usePostChallenge, useGetAllVideos } from '../hooks/useQueries';
import { Video } from '../backend';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Props {
  video: Video;
  onClose: () => void;
}

export default function ChallengeModal({ video, onClose }: Props) {
  const { identity } = useInternetIdentity();
  const { data: allVideos } = useGetAllVideos();
  const postChallenge = usePostChallenge();
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const currentUserId = identity?.getPrincipal().toString();
  const myVideos = allVideos?.filter((v) => v.uploader.toString() === currentUserId) ?? [];

  const handleSubmit = async () => {
    if (!selectedVideoId || !identity) return;
    try {
      await postChallenge.mutateAsync({
        originalVideoId: video.id,
        responseVideoId: selectedVideoId,
        challengedPrincipal: video.uploader.toString(),
      });
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground flex items-center gap-2">
            <Flag className="w-5 h-5 text-neon-orange" />
            Challenge
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-3">
          Select one of your videos to challenge{' '}
          <span className="text-neon-orange font-semibold">
            {video.uploader.toString().slice(0, 8)}...
          </span>
        </p>
        {myVideos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            You need to upload a video first to challenge someone.
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {myVideos.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVideoId(v.id)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all text-left ${
                  selectedVideoId === v.id
                    ? 'border-neon-orange bg-neon-orange/10'
                    : 'border-border hover:border-neon-orange/40'
                }`}
              >
                <img
                  src={v.thumbnail.getDirectURL()}
                  alt={v.title}
                  className="w-16 h-10 object-cover rounded"
                />
                <span className="text-sm text-foreground line-clamp-1">{v.title}</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2 mt-3">
          <Button variant="outline" onClick={onClose} className="flex-1 border-border">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedVideoId || postChallenge.isPending}
            className="flex-1 bg-neon-orange text-black hover:bg-neon-yellow font-bold"
          >
            {postChallenge.isPending ? 'Sending...' : 'Challenge!'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
