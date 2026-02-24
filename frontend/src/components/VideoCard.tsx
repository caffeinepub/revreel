import { useRef, useEffect, useState } from 'react';
import { Heart, MessageCircle, Share2, Trash2, Volume2, VolumeX, Bookmark, Flag, BadgeCheck } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useToggleLike, useDeleteVideo, useGetUserProfile, useAddReaction, useRemoveReaction, useSaveVideo, useUnsaveVideo, useGetCallerUserProfile, useIncrementViewCount, useGetChallengesForVideo, useGetComments } from '../hooks/useQueries';
import { Video, ReactionType } from '../backend';
import CommentsPanel from './CommentsPanel';
import ChallengeModal from './ChallengeModal';

interface VideoCardProps {
  video: Video;
  isActive: boolean;
  isMuted: boolean;
  onMuteToggle: () => void;
}

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: ReactionType.like, emoji: '👍', label: 'Like' },
  { type: ReactionType.fire, emoji: '🔥', label: 'Fire' },
  { type: ReactionType.hype, emoji: '⚡', label: 'Hype' },
  { type: ReactionType.respect, emoji: '🤙', label: 'Respect' },
  { type: ReactionType.wild, emoji: '😤', label: 'Wild' },
];

export default function VideoCard({ video, isActive, isMuted, onMuteToggle }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMutedRef = useRef(isMuted);
  const viewCountedRef = useRef(false);
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: uploaderProfile } = useGetUserProfile(video.uploader.toString());
  const { data: challenges } = useGetChallengesForVideo(undefined);
  const { data: comments } = useGetComments(video.id);

  const toggleLike = useToggleLike();
  const deleteVideo = useDeleteVideo();
  const addReaction = useAddReaction();
  const removeReaction = useRemoveReaction();
  const saveVideo = useSaveVideo();
  const unsaveVideo = useUnsaveVideo();
  const incrementViewCount = useIncrementViewCount();

  const [showComments, setShowComments] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);

  const currentUserId = identity?.getPrincipal().toString();
  const isOwner = currentUserId && video.uploader.toString() === currentUserId;
  const isLiked = currentUserId ? video.likes.some(l => l.toString() === currentUserId) : false;

  const userReaction = currentUserId
    ? video.reactions.find(([uid]) => uid.toString() === currentUserId)?.[1]
    : undefined;

  const isSaved = userProfile?.savedVideos?.some(id => id.toString() === video.id) ?? false;

  // Use fetched comment count for accurate display
  const commentCount = comments?.length ?? video.comments.length;

  // Reaction counts
  const reactionCounts = REACTIONS.map(r => ({
    ...r,
    count: video.reactions.filter(([, rt]) => rt === r.type).length,
  })).filter(r => r.count > 0);

  const uploaderUserId = video.uploader.toString();

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (isActive) {
      videoEl.muted = isMutedRef.current;
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          videoEl.muted = true;
          videoEl.play().catch(() => {});
        });
      }
      if (!viewCountedRef.current) {
        viewCountedRef.current = true;
        incrementViewCount.mutate(video.id);
      }
    } else {
      videoEl.pause();
      viewCountedRef.current = false;
    }
  }, [isActive]);

  const handleLike = () => {
    if (!identity) return;
    toggleLike.mutate(video.id);
  };

  const handleReaction = (reactionType: ReactionType) => {
    if (!identity) return;
    if (userReaction === reactionType) {
      removeReaction.mutate(video.id);
    } else {
      addReaction.mutate({ videoId: video.id, reaction: reactionType });
    }
    setShowReactions(false);
  };

  const handleBookmark = () => {
    if (!identity) return;
    const videoIdNum = parseInt(video.id, 10);
    if (isNaN(videoIdNum)) return;
    if (isSaved) {
      unsaveVideo.mutate(videoIdNum);
    } else {
      saveVideo.mutate(videoIdNum);
    }
  };

  const handleDelete = () => {
    if (!identity || !isOwner) return;
    deleteVideo.mutate(video.id);
  };

  const videoUrl = video.videoUrl.getDirectURL();
  const thumbnailUrl = video.thumbnail.getDirectURL();

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnailUrl}
        loop
        playsInline
        muted={isMuted}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

      {/* Mute toggle */}
      <button
        onClick={onMuteToggle}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white"
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      {/* Video info */}
      <div className="absolute bottom-0 left-0 right-16 p-4 z-10">
        {/* Clickable uploader row — navigates to their profile */}
        <Link
          to="/profile/$userId"
          params={{ userId: uploaderUserId }}
          aria-label={`View ${uploaderProfile?.username ?? 'uploader'}'s profile`}
          className="flex items-center gap-2 mb-1 w-fit group"
          onClick={(e) => e.stopPropagation()}
        >
          {uploaderProfile?.avatarUrl ? (
            <img
              src={uploaderProfile.avatarUrl}
              alt={uploaderProfile.username}
              className="w-8 h-8 rounded-full object-cover border border-neon-orange/50 group-hover:border-neon-orange transition-colors"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-neon-orange/20 border border-neon-orange/50 group-hover:border-neon-orange flex items-center justify-center text-xs text-neon-orange font-bold transition-colors">
              {uploaderProfile?.username?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <div className="flex items-center gap-1">
            <span className="text-white font-semibold text-sm group-hover:text-neon-orange transition-colors drop-shadow">
              {uploaderProfile?.username ?? '...'}
            </span>
            {uploaderProfile?.verified && (
              <BadgeCheck className="w-4 h-4 text-neon-orange" />
            )}
          </div>
        </Link>

        <h3 className="text-white font-bold text-base mb-1 line-clamp-2">{video.title}</h3>
        {video.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {video.hashtags.slice(0, 3).map(tag => (
              <span key={tag} className="text-neon-orange text-xs">#{tag}</span>
            ))}
          </div>
        )}
        {reactionCounts.length > 0 && (
          <div className="flex gap-2 mt-1">
            {reactionCounts.map(r => (
              <span key={r.type} className="text-xs text-white/80">{r.emoji} {r.count}</span>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="absolute right-2 bottom-20 flex flex-col items-center gap-4 z-10">
        {/* Reaction button */}
        <div className="relative">
          <button
            onClick={() => setShowReactions(!showReactions)}
            className={`flex flex-col items-center gap-1 ${isLiked || userReaction ? 'text-neon-orange' : 'text-white'}`}
          >
            <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-lg">
              {userReaction ? REACTIONS.find(r => r.type === userReaction)?.emoji ?? '❤️' : '❤️'}
            </div>
            <span className="text-xs font-bold">{video.likes.length + video.reactions.length}</span>
          </button>
          {showReactions && (
            <div className="absolute bottom-12 right-0 bg-card/90 backdrop-blur border border-border rounded-2xl p-2 flex gap-1 shadow-neon">
              {REACTIONS.map(r => (
                <button
                  key={r.type}
                  onClick={() => handleReaction(r.type)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-transform hover:scale-125 ${
                    userReaction === r.type ? 'bg-neon-orange/20 ring-1 ring-neon-orange' : 'hover:bg-white/10'
                  }`}
                  title={r.label}
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Comments */}
        <button
          onClick={() => setShowComments(true)}
          className="flex flex-col items-center gap-1 text-white"
        >
          <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
            <MessageCircle className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold">{commentCount}</span>
        </button>

        {/* Bookmark */}
        {identity && (
          <button
            onClick={handleBookmark}
            className={`flex flex-col items-center gap-1 ${isSaved ? 'text-neon-orange' : 'text-white'}`}
          >
            <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
              <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-neon-orange' : ''}`} />
            </div>
          </button>
        )}

        {/* Challenge */}
        {identity && (
          <button
            onClick={() => setShowChallengeModal(true)}
            className="flex flex-col items-center gap-1 text-white"
          >
            <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
              <Flag className="w-5 h-5" />
            </div>
          </button>
        )}

        {/* Share */}
        <button className="flex flex-col items-center gap-1 text-white">
          <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </div>
        </button>

        {/* Delete (owner only) */}
        {isOwner && (
          <button
            onClick={handleDelete}
            disabled={deleteVideo.isPending}
            className="flex flex-col items-center gap-1 text-red-400"
          >
            <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
          </button>
        )}
      </div>

      {/* Comments panel */}
      {showComments && (
        <CommentsPanel videoId={video.id} onClose={() => setShowComments(false)} />
      )}

      {/* Challenge modal */}
      {showChallengeModal && (
        <ChallengeModal
          video={video}
          onClose={() => setShowChallengeModal(false)}
        />
      )}
    </div>
  );
}
