import React, { useState, useRef, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import {
  useToggleLike,
  useAddReaction,
  useSaveVideo,
  useUnsaveVideo,
  useIncrementViewCount,
  useDeleteVideo,
  type Video,
  type ReactionType,
  type UserProfile,
} from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import CommentsPanel from './CommentsPanel';
import ChallengeModal from './ChallengeModal';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Trash2,
  Flame,
  Zap,
  Star,
  ThumbsUp,
  Share2,
} from 'lucide-react';

interface VideoCardProps {
  video: Video;
  currentUserProfile?: UserProfile | null;
}

const reactionEmojis: Record<string, { icon: React.ReactNode; label: string }> = {
  like: { icon: <ThumbsUp className="w-4 h-4" />, label: 'Like' },
  fire: { icon: <Flame className="w-4 h-4" />, label: 'Fire' },
  hype: { icon: <Zap className="w-4 h-4" />, label: 'Hype' },
  respect: { icon: <Star className="w-4 h-4" />, label: 'Respect' },
  wild: { icon: <Share2 className="w-4 h-4" />, label: 'Wild' },
};

export default function VideoCard({ video, currentUserProfile }: VideoCardProps) {
  const { identity } = useInternetIdentity();
  const [showComments, setShowComments] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleLike = useToggleLike();
  const addReaction = useAddReaction();
  const saveVideo = useSaveVideo();
  const unsaveVideo = useUnsaveVideo();
  const incrementView = useIncrementViewCount();
  const deleteVideo = useDeleteVideo();

  const myPrincipal = identity?.getPrincipal().toString();
  const isLiked = myPrincipal ? video.likes.some((l: any) => l.toString() === myPrincipal) : false;
  const isSaved = currentUserProfile?.savedVideos?.includes(Number(video.id)) ?? false;
  const isOwner = myPrincipal ? video.uploader?.toString() === myPrincipal : false;

  const isPhoto = 'photo' in video.mediaType;

  useEffect(() => {
    if (isPhoto) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => {});
            incrementView.mutate({ videoId: video.id });
          } else {
            videoRef.current?.pause();
          }
        });
      },
      { threshold: 0.5 }
    );
    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [video.id, isPhoto]);

  const handleLike = () => {
    if (!identity) return;
    toggleLike.mutate({ videoId: video.id });
  };

  const handleReaction = (reactionKey: string) => {
    if (!identity) return;
    const reaction: ReactionType = { [reactionKey]: null } as any;
    addReaction.mutate({ videoId: video.id, reaction });
    setShowReactions(false);
  };

  const handleSave = () => {
    if (!identity) return;
    if (isSaved) {
      unsaveVideo.mutate({ videoId: video.id });
    } else {
      saveVideo.mutate({ videoId: video.id });
    }
  };

  const handleDelete = () => {
    if (!isOwner) return;
    if (confirm('Delete this post?')) {
      deleteVideo.mutate({ videoId: video.id });
    }
  };

  const mediaUrl = video.mediaUrl?.getDirectURL?.() || '';
  const thumbnailUrl = video.thumbnail?.getDirectURL?.() || '/assets/generated/placeholder-thumb.dim_640x360.png';

  return (
    <div className="relative w-full bg-black" style={{ minHeight: '100svh' }}>
      {/* Media */}
      {isPhoto ? (
        <img
          src={mediaUrl || thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-contain"
          style={{ minHeight: '100svh' }}
        />
      ) : (
        <video
          ref={videoRef}
          src={mediaUrl}
          poster={thumbnailUrl}
          className="w-full object-cover"
          style={{ minHeight: '100svh' }}
          loop
          muted
          playsInline
        />
      )}

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

      {/* Right action bar */}
      <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5 z-10">
        {/* Like */}
        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-1"
          disabled={!identity}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isLiked ? 'bg-red-500/80' : 'bg-black/40 hover:bg-black/60'}`}>
            <Heart className={`w-6 h-6 ${isLiked ? 'fill-white text-white' : 'text-white'}`} />
          </div>
          <span className="text-white text-xs font-bold drop-shadow">{video.likes.length}</span>
        </button>

        {/* Reactions */}
        <div className="relative">
          <button
            onClick={() => setShowReactions(!showReactions)}
            className="flex flex-col items-center gap-1"
            disabled={!identity}
          >
            <div className="w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors">
              <Flame className="w-6 h-6 text-orange-400" />
            </div>
            <span className="text-white text-xs font-bold drop-shadow">{video.reactions.length}</span>
          </button>
          {showReactions && (
            <div className="absolute right-14 bottom-0 bg-card border border-border rounded-xl p-2 flex flex-col gap-1 shadow-lg z-20">
              {Object.entries(reactionEmojis).map(([key, { icon, label }]) => (
                <button
                  key={key}
                  onClick={() => handleReaction(key)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors text-sm whitespace-nowrap"
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Comments */}
        <button
          onClick={() => setShowComments(true)}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs font-bold drop-shadow">{video.comments.length}</span>
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          className="flex flex-col items-center gap-1"
          disabled={!identity}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isSaved ? 'bg-primary/80' : 'bg-black/40 hover:bg-black/60'}`}>
            <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-white text-white' : 'text-white'}`} />
          </div>
        </button>

        {/* Challenge */}
        {identity && !isOwner && (
          <button
            onClick={() => setShowChallenge(true)}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors">
              <Zap className="w-6 h-6 text-yellow-400" />
            </div>
          </button>
        )}

        {/* Delete */}
        {isOwner && (
          <button
            onClick={handleDelete}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-12 h-12 rounded-full bg-black/40 hover:bg-red-500/60 flex items-center justify-center transition-colors">
              <Trash2 className="w-6 h-6 text-white" />
            </div>
          </button>
        )}
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-4 left-3 right-20 z-10">
        <Link
          to="/profile/$userId"
          params={{ userId: video.uploader?.toString() || '' }}
          className="font-bold text-white text-sm hover:text-primary transition-colors"
        >
          @{video.uploader?.toString().slice(0, 8) || 'unknown'}
        </Link>
        <h3 className="text-white font-semibold text-sm mt-0.5 line-clamp-2">{video.title}</h3>
        {video.description && (
          <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{video.description}</p>
        )}
        {video.hashtags.length > 0 && (
          <p className="text-primary text-xs mt-0.5 line-clamp-1">
            {video.hashtags.map((h) => `#${h}`).join(' ')}
          </p>
        )}
        <div className="flex items-center gap-3 mt-1">
          <span className="text-white/60 text-xs">{Number(video.viewCount).toLocaleString()} views</span>
          <span className="text-white/40 text-xs capitalize">
            {'photo' in video.mediaType ? '📷 Photo' : '🎬 Reel'}
          </span>
        </div>
      </div>

      {/* Comments Panel */}
      {showComments && (
        <div className="absolute inset-0 z-30 flex flex-col justify-end">
          <div className="bg-card rounded-t-2xl h-2/3 overflow-hidden">
            <CommentsPanel videoId={video.id} onClose={() => setShowComments(false)} />
          </div>
        </div>
      )}

      {/* Challenge Modal */}
      {showChallenge && (
        <ChallengeModal
          open={showChallenge}
          onClose={() => setShowChallenge(false)}
          challengedUserId={video.uploader?.toString() || ''}
          originalVideoId={video.id}
        />
      )}
    </div>
  );
}
