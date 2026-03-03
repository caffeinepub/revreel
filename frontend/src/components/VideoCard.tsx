import React, { useRef, useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Play, Pause, Zap } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useToggleLike } from '../hooks/useQueries';
import CommentsPanel from './CommentsPanel';
import { Video } from '../backend';
import { useNavigate } from '@tanstack/react-router';

interface VideoCardProps {
  video: Video;
  isActive: boolean;
}

export default function VideoCard({ video, isActive }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { identity } = useInternetIdentity();
  const toggleLike = useToggleLike();
  const navigate = useNavigate();

  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [localLikes, setLocalLikes] = useState<string[]>(
    video.likes.map((l) => l.toString()),
  );

  const isLiked = identity
    ? localLikes.includes(identity.getPrincipal().toString())
    : false;

  const thumbnailUrl = video.thumbnail.getDirectURL();
  const mediaUrl = video.mediaUrl.getDirectURL();
  const isPhoto = video.mediaType === 'photo';

  useEffect(() => {
    if (isPhoto) return;
    const el = videoRef.current;
    if (!el) return;
    if (isActive) {
      el.play().catch(() => {});
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  }, [isActive, isPhoto]);

  const handlePlayPause = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => {});
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  };

  const handleLike = async () => {
    if (!identity) return;
    const userId = identity.getPrincipal().toString();
    const alreadyLiked = localLikes.includes(userId);
    setLocalLikes(alreadyLiked ? localLikes.filter((l) => l !== userId) : [...localLikes, userId]);
    try {
      await toggleLike.mutateAsync(video.id);
    } catch {
      setLocalLikes(alreadyLiked ? [...localLikes, userId] : localLikes.filter((l) => l !== userId));
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: video.title, text: video.description });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const uploaderStr = video.uploader.toString();

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Media */}
      {isPhoto ? (
        <img
          src={mediaUrl}
          alt={video.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <video
          ref={videoRef}
          src={mediaUrl}
          poster={thumbnailUrl}
          loop
          muted={muted}
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          onClick={handlePlayPause}
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

      {/* Play/Pause overlay */}
      {!isPhoto && !playing && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={handlePlayPause}
        >
          <div className="bg-black/40 rounded-full p-4">
            <Play className="w-10 h-10 text-white" />
          </div>
        </div>
      )}

      {/* Top controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button
          onClick={() => setMuted(!muted)}
          className="bg-black/50 rounded-full p-2 text-white"
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-20 left-4 right-16 z-10">
        <button
          className="text-sm font-semibold text-neon-orange mb-1 hover:underline"
          onClick={() => navigate({ to: '/profile/$userId', params: { userId: uploaderStr } })}
        >
          @{uploaderStr.slice(0, 8)}…
        </button>
        <h3 className="text-white font-bold text-base leading-tight mb-1">{video.title}</h3>
        <p className="text-white/70 text-sm line-clamp-2">{video.description}</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {video.hashtags.map((tag) => (
            <span key={tag} className="text-neon-yellow text-xs">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Right action buttons */}
      <div className="absolute bottom-24 right-3 flex flex-col items-center gap-5 z-10">
        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-1"
          disabled={!identity}
        >
          <Heart
            className={`w-7 h-7 transition-colors ${isLiked ? 'fill-neon-orange text-neon-orange' : 'text-white'}`}
          />
          <span className="text-white text-xs">{localLikes.length}</span>
        </button>

        <button
          onClick={() => setShowComments(true)}
          className="flex flex-col items-center gap-1"
        >
          <MessageCircle className="w-7 h-7 text-white" />
          <span className="text-white text-xs">{video.comments.length}</span>
        </button>

        <button onClick={handleShare} className="flex flex-col items-center gap-1">
          <Share2 className="w-7 h-7 text-white" />
        </button>

        <div className="flex flex-col items-center gap-1">
          <Zap className="w-5 h-5 text-neon-yellow" />
          <span className="text-white text-xs">{Number(video.viewCount)}</span>
        </div>
      </div>

      {/* Comments panel */}
      {showComments && (
        <CommentsPanel
          videoId={video.id}
          onClose={() => setShowComments(false)}
        />
      )}
    </div>
  );
}
