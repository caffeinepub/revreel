import React, { useState, useRef } from 'react';
import { Link } from '@tanstack/react-router';
import {
  useToggleLike,
  useAddReaction,
  useSaveVideo,
  useUnsaveVideo,
  useIncrementViewCount,
  useDeleteVideo,
  type Video,
  type UserProfile,
} from '../hooks/useQueries';
import { Variant_video_photo } from '../backend';
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

export interface VideoCardProps {
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
  const isLiked = myPrincipal ? video.likes.some((l) => l.toString() === myPrincipal) : false;
  const isSaved = currentUserProfile?.savedVideos?.some((id) => id.toString() === video.id) ?? false;
  const isOwner = myPrincipal && video.uploader?.toString() === myPrincipal;

  const mediaUrl = video.mediaUrl?.getDirectURL?.() ?? '';
  const thumbnailUrl = video.thumbnail?.getDirectURL?.() ?? '';
  // Variant_video_photo is a string enum: "video" | "photo"
  const isPhoto = video.mediaType === Variant_video_photo.photo;

  const handleLike = () => {
    if (!identity) return;
    toggleLike.mutate({ videoId: video.id, isLiked });
  };

  const handleReaction = (reactionKey: string) => {
    if (!identity) return;
    addReaction.mutate({ videoId: video.id, reaction: { [reactionKey]: null } });
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
    if (confirm('Delete this video?')) {
      deleteVideo.mutate({ videoId: video.id });
    }
  };

  const handleVideoVisible = () => {
    incrementView.mutate({ videoId: video.id });
  };

  const uploaderStr = video.uploader?.toString() ?? '';

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Media */}
      {isPhoto ? (
        <img
          src={mediaUrl || thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover"
          onLoad={handleVideoVisible}
        />
      ) : (
        <video
          ref={videoRef}
          src={mediaUrl}
          poster={thumbnailUrl}
          className="w-full h-full object-cover"
          loop
          playsInline
          muted
          autoPlay
          onPlay={handleVideoVisible}
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-16 p-4">
        <Link
          to="/profile/$userId"
          params={{ userId: uploaderStr }}
          className="text-white font-bold text-sm mb-1 block hover:underline"
        >
          @{uploaderStr.slice(0, 8)}...
        </Link>
        <p className="text-white/90 text-sm font-medium line-clamp-2">{video.title}</p>
        {video.hashtags.length > 0 && (
          <p className="text-white/60 text-xs mt-1 line-clamp-1">
            {video.hashtags.map((t) => `#${t}`).join(' ')}
          </p>
        )}
      </div>

      {/* Right side actions */}
      <div className="absolute right-3 bottom-20 flex flex-col items-center gap-5">
        {/* Like */}
        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-1"
          disabled={toggleLike.isPending}
        >
          <Heart
            className={`w-7 h-7 drop-shadow ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`}
          />
          <span className="text-white text-xs font-bold drop-shadow">{video.likes.length}</span>
        </button>

        {/* Comments */}
        <button
          onClick={() => setShowComments(true)}
          className="flex flex-col items-center gap-1"
        >
          <MessageCircle className="w-7 h-7 text-white drop-shadow" />
          <span className="text-white text-xs font-bold drop-shadow">💬</span>
        </button>

        {/* Reactions */}
        <div className="relative">
          <button
            onClick={() => setShowReactions(!showReactions)}
            className="flex flex-col items-center gap-1"
          >
            <Flame className="w-7 h-7 text-white drop-shadow" />
            <span className="text-white text-xs font-bold drop-shadow">{video.reactions.length}</span>
          </button>
          {showReactions && (
            <div className="absolute right-10 bottom-0 bg-card border border-border rounded-xl p-2 flex flex-col gap-1 z-10 min-w-[100px]">
              {Object.entries(reactionEmojis).map(([key, { icon, label }]) => (
                <button
                  key={key}
                  onClick={() => handleReaction(key)}
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted text-sm text-foreground"
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          className="flex flex-col items-center gap-1"
          disabled={saveVideo.isPending || unsaveVideo.isPending}
        >
          <Bookmark
            className={`w-7 h-7 drop-shadow ${isSaved ? 'fill-neon-orange text-neon-orange' : 'text-white'}`}
          />
        </button>

        {/* Challenge */}
        {identity && !isOwner && (
          <button
            onClick={() => setShowChallenge(true)}
            className="flex flex-col items-center gap-1"
          >
            <Zap className="w-7 h-7 text-white drop-shadow" />
          </button>
        )}

        {/* Delete (owner only) */}
        {isOwner && (
          <button
            onClick={handleDelete}
            className="flex flex-col items-center gap-1"
            disabled={deleteVideo.isPending}
          >
            <Trash2 className="w-6 h-6 text-red-400 drop-shadow" />
          </button>
        )}
      </div>

      {/* Comments Panel */}
      {showComments && (
        <div className="absolute inset-0 z-20 bg-background/95">
          <CommentsPanel videoId={video.id} onClose={() => setShowComments(false)} />
        </div>
      )}

      {/* Challenge Modal */}
      {showChallenge && (
        <ChallengeModal
          open={showChallenge}
          onClose={() => setShowChallenge(false)}
          challengedUserId={uploaderStr}
          originalVideoId={video.id}
        />
      )}
    </div>
  );
}
