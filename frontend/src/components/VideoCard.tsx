import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, Bookmark, BookmarkCheck, Trash2, Volume2, VolumeX, Zap, Flame, Star, ThumbsUp, Wind } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useToggleLike,
  useAddReaction,
  useRemoveReaction,
  useSaveVideo,
  useUnsaveVideo,
  useDeleteVideo,
  useIncrementViewCount,
  type UserProfile,
} from '../hooks/useQueries';
import { type Video, ReactionType, Variant_video_photo } from '../backend';
import CommentsPanel from './CommentsPanel';
import ChallengeModal from './ChallengeModal';

interface VideoCardProps {
  video: Video;
  isActive: boolean;
  isMuted: boolean;
  onMuteToggle: () => void;
  currentUserProfile: UserProfile | null;
}

const reactionConfig = [
  { type: ReactionType.fire, icon: Flame, label: 'Fire', color: 'text-orange-400' },
  { type: ReactionType.hype, icon: Zap, label: 'Hype', color: 'text-yellow-400' },
  { type: ReactionType.like, icon: ThumbsUp, label: 'Like', color: 'text-blue-400' },
  { type: ReactionType.respect, icon: Star, label: 'Respect', color: 'text-purple-400' },
  { type: ReactionType.wild, icon: Wind, label: 'Wild', color: 'text-green-400' },
];

export default function VideoCard({ video, isActive, isMuted, onMuteToggle, currentUserProfile }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showComments, setShowComments] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);
  const [hasIncrementedView, setHasIncrementedView] = useState(false);

  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const currentUserId = identity?.getPrincipal().toString();

  const toggleLike = useToggleLike();
  const addReaction = useAddReaction();
  const removeReaction = useRemoveReaction();
  const saveVideo = useSaveVideo();
  const unsaveVideo = useUnsaveVideo();
  const deleteVideo = useDeleteVideo();
  const incrementView = useIncrementViewCount();

  const isPhoto = video.mediaType === Variant_video_photo.photo;
  const mediaUrl = video.mediaUrl.getDirectURL();
  const thumbnailUrl = video.thumbnail.getDirectURL();

  const isLiked = isAuthenticated && currentUserId
    ? video.likes.some(l => l.toString() === currentUserId)
    : false;

  const isSaved = isAuthenticated && currentUserProfile
    ? currentUserProfile.savedVideos.includes(Number(video.id))
    : false;

  const isOwner = isAuthenticated && currentUserId
    ? video.uploader.toString() === currentUserId
    : false;

  const userReaction = isAuthenticated && currentUserId
    ? video.reactions.find(([uid]) => uid.toString() === currentUserId)?.[1]
    : undefined;

  const reactionCounts = video.reactions.reduce((acc, [, type]) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  useEffect(() => {
    if (isPhoto) return;
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (isActive) {
      videoEl.muted = isMuted;
      videoEl.play().catch(() => {
        videoEl.muted = true;
        videoEl.play().catch(() => {});
      });
    } else {
      videoEl.pause();
    }
  }, [isActive, isMuted, isPhoto]);

  useEffect(() => {
    if (isPhoto) return;
    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.muted = isMuted;
    }
  }, [isMuted, isPhoto]);

  useEffect(() => {
    if (isActive && !hasIncrementedView) {
      setHasIncrementedView(true);
      incrementView.mutate({ videoId: video.id });
    }
  }, [isActive, hasIncrementedView, video.id, incrementView]);

  const handleLike = useCallback(() => {
    if (!isAuthenticated) return;
    toggleLike.mutate({ videoId: video.id });
  }, [isAuthenticated, toggleLike, video.id]);

  const handleReaction = useCallback((reactionType: ReactionType) => {
    if (!isAuthenticated) return;
    if (userReaction === reactionType) {
      removeReaction.mutate({ videoId: video.id });
    } else {
      addReaction.mutate({ videoId: video.id, reaction: reactionType });
    }
    setShowReactions(false);
  }, [isAuthenticated, userReaction, removeReaction, addReaction, video.id]);

  const handleSave = useCallback(() => {
    if (!isAuthenticated) return;
    if (isSaved) {
      unsaveVideo.mutate({ videoId: video.id });
    } else {
      saveVideo.mutate({ videoId: video.id });
    }
  }, [isAuthenticated, isSaved, unsaveVideo, saveVideo, video.id]);

  const handleDelete = useCallback(() => {
    if (!isOwner) return;
    deleteVideo.mutate({ videoId: video.id });
  }, [isOwner, deleteVideo, video.id]);

  const uploaderName = (video as unknown as { uploaderName?: string }).uploaderName
    || video.uploader.toString().slice(0, 8) + '...';

  const uploaderAvatar = (video as unknown as { uploaderAvatar?: string }).uploaderAvatar;

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      {/* Media */}
      {isPhoto ? (
        <img
          src={mediaUrl}
          alt={video.title}
          className="w-full h-full object-cover"
        />
      ) : (
        <video
          ref={videoRef}
          src={mediaUrl}
          poster={thumbnailUrl}
          loop
          playsInline
          className="w-full h-full object-cover"
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

      {/* Top right: mute button (video only) */}
      {!isPhoto && (
        <button
          onClick={onMuteToggle}
          className="absolute top-20 right-4 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-black/50 border border-white/20 text-white hover:bg-black/70 transition-colors"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
        </button>
      )}

      {/* Right side action buttons */}
      <div className="absolute right-3 bottom-32 z-20 flex flex-col items-center gap-5">
        {/* Like */}
        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-1 group"
          aria-label="Like"
        >
          <div className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${
            isLiked ? 'bg-red-500/30 text-red-400' : 'bg-black/40 text-white hover:bg-black/60'
          }`}>
            <Heart size={24} fill={isLiked ? 'currentColor' : 'none'} />
          </div>
          <span className="text-white text-xs font-bold drop-shadow">{video.likes.length}</span>
        </button>

        {/* Reactions */}
        <div className="relative flex flex-col items-center">
          <button
            onClick={() => setShowReactions(!showReactions)}
            className="flex flex-col items-center gap-1 group"
            aria-label="Reactions"
          >
            <div className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${
              userReaction ? 'bg-yellow-500/30 text-yellow-400' : 'bg-black/40 text-white hover:bg-black/60'
            }`}>
              <Flame size={24} />
            </div>
            <span className="text-white text-xs font-bold drop-shadow">
              {video.reactions.length}
            </span>
          </button>

          {showReactions && (
            <div className="absolute right-14 bottom-0 bg-black/90 border border-white/20 rounded-2xl p-2 flex flex-col gap-1 min-w-[120px]">
              {reactionConfig.map(({ type, icon: Icon, label, color }) => (
                <button
                  key={type}
                  onClick={() => handleReaction(type)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors ${
                    userReaction === type ? 'bg-white/20' : ''
                  }`}
                >
                  <Icon size={18} className={color} />
                  <span className="text-white text-sm font-medium">{label}</span>
                  {reactionCounts[type] ? (
                    <span className="text-white/60 text-xs ml-auto">{reactionCounts[type]}</span>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Comments */}
        <button
          onClick={() => setShowComments(true)}
          className="flex flex-col items-center gap-1 group"
          aria-label="Comments"
        >
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-all">
            <MessageCircle size={24} />
          </div>
          <span className="text-white text-xs font-bold drop-shadow">{video.comments.length}</span>
        </button>

        {/* Save */}
        {isAuthenticated && (
          <button
            onClick={handleSave}
            className="flex flex-col items-center gap-1 group"
            aria-label={isSaved ? 'Unsave' : 'Save'}
          >
            <div className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${
              isSaved ? 'bg-neon-orange/30 text-neon-orange' : 'bg-black/40 text-white hover:bg-black/60'
            }`}>
              {isSaved ? <BookmarkCheck size={24} /> : <Bookmark size={24} />}
            </div>
          </button>
        )}

        {/* Challenge */}
        {isAuthenticated && (
          <button
            onClick={() => setShowChallenge(true)}
            className="flex flex-col items-center gap-1 group"
            aria-label="Challenge"
          >
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-all">
              <Zap size={24} />
            </div>
            <span className="text-white text-xs font-bold drop-shadow">Duel</span>
          </button>
        )}

        {/* Delete (owner only) */}
        {isOwner && (
          <button
            onClick={handleDelete}
            className="flex flex-col items-center gap-1 group"
            aria-label="Delete"
          >
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-all">
              <Trash2 size={22} />
            </div>
          </button>
        )}
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-20 left-3 right-20 z-20">
        {/* Uploader */}
        <Link
          to="/profile/$userId"
          params={{ userId: video.uploader.toString() }}
          className="flex items-center gap-2 mb-2 group w-fit"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-neon-orange/60 flex-shrink-0">
            {uploaderAvatar ? (
              <img src={uploaderAvatar} alt={uploaderName} className="w-full h-full object-cover" />
            ) : (
              <img src="/assets/generated/default-avatar.dim_128x128.png" alt={uploaderName} className="w-full h-full object-cover" />
            )}
          </div>
          <span className="text-white font-bold text-base drop-shadow group-hover:text-neon-orange transition-colors">
            @{uploaderName}
          </span>
        </Link>

        {/* Title */}
        <h3 className="text-white font-bold text-lg leading-tight drop-shadow mb-1 line-clamp-2">
          {video.title}
        </h3>

        {/* Description */}
        {video.description && (
          <p className="text-white/80 text-sm drop-shadow line-clamp-2 mb-1">
            {video.description}
          </p>
        )}

        {/* Hashtags */}
        {video.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {video.hashtags.slice(0, 4).map(tag => (
              <span key={tag} className="text-neon-orange text-sm font-medium drop-shadow">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Media type badge */}
        {isPhoto && (
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-neon-orange/20 border border-neon-orange/40 text-neon-orange text-xs font-bold">
            📷 Photo
          </span>
        )}
      </div>

      {/* Comments Panel */}
      {showComments && (
        <CommentsPanel
          videoId={video.id}
          onClose={() => setShowComments(false)}
        />
      )}

      {/* Challenge Modal */}
      {showChallenge && (
        <ChallengeModal
          video={video}
          onClose={() => setShowChallenge(false)}
        />
      )}
    </div>
  );
}
