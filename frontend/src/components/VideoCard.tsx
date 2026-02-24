import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import { Heart, MessageCircle, Share2, Play, Volume2, VolumeX, Trash2 } from 'lucide-react';
import { type Video } from '../backend';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useToggleLike, useDeleteVideo } from '../hooks/useQueries';
import { toast } from 'sonner';
import CommentsPanel from './CommentsPanel';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface VideoCardProps {
  video: Video;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function VideoCard({ video, isActive, isMuted, onToggleMute }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMutedRef = useRef(isMuted);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(video.likes.length);
  const { identity } = useInternetIdentity();
  const toggleLike = useToggleLike();
  const deleteVideo = useDeleteVideo();

  const isAuthenticated = !!identity;
  const currentUserId = identity?.getPrincipal().toString();
  const isOwner = !!currentUserId && video.uploader.toString() === currentUserId;

  // Keep ref in sync with prop so effects always read the latest value
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (currentUserId) {
      setLiked(video.likes.some((l) => l.toString() === currentUserId));
    }
    setLikeCount(video.likes.length);
  }, [video.likes, currentUserId]);

  // Sync muted state to video element imperatively — React's muted prop is not reactive after mount
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    videoEl.muted = isMuted;
  }, [isMuted]);

  // Play/pause based on active state; always read current muted value via ref
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (isActive) {
      // Apply current muted state from ref (always up-to-date) before attempting play
      videoEl.muted = isMutedRef.current;
      videoEl.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          // If autoplay with audio is blocked, fall back to muted play
          if (!videoEl.muted) {
            videoEl.muted = true;
            videoEl.play()
              .then(() => setIsPlaying(true))
              .catch(() => setIsPlaying(false));
          } else {
            setIsPlaying(false);
          }
        });
    } else {
      videoEl.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  const handlePlayPause = useCallback(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    if (isPlaying) {
      videoEl.pause();
      setIsPlaying(false);
    } else {
      videoEl.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [isPlaying]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Login to like videos!');
      return;
    }
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => (wasLiked ? c - 1 : c + 1));
    try {
      await toggleLike.mutateAsync(video.id);
    } catch {
      setLiked(wasLiked);
      setLikeCount((c) => (wasLiked ? c + 1 : c - 1));
      toast.error('Failed to like video');
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/filter/video/${video.id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copied to clipboard! 🔗');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  const handleDelete = async () => {
    try {
      await deleteVideo.mutateAsync(video.id);
      toast.success('Reel deleted 🗑️');
    } catch {
      toast.error('Failed to delete reel');
    }
  };

  const videoSrc = video.videoUrl.getDirectURL();
  const thumbnailSrc = video.thumbnail.getDirectURL();

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Video Element — muted attribute intentionally omitted from JSX;
          muted state is controlled entirely via imperative useEffect + isMutedRef
          because React does not reactively update the muted DOM attribute after mount */}
      <video
        ref={videoRef}
        src={videoSrc}
        poster={thumbnailSrc}
        className="absolute inset-0 w-full h-full object-cover"
        loop
        playsInline
        preload="metadata"
        onClick={handlePlayPause}
      />

      {/* Fallback thumbnail if no video */}
      {!videoSrc && (
        <img
          src="/assets/generated/placeholder-thumb.dim_640x360.png"
          alt={video.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Overlay gradient */}
      <div className="absolute inset-0 video-overlay-gradient pointer-events-none" />

      {/* Play/Pause indicator */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
      )}

      {/* Top-right controls: mute + delete */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {/* Mute/Unmute toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
          className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm hover:bg-black/70 transition-colors"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-white" />
          ) : (
            <Volume2 className="w-4 h-4 text-neon" />
          )}
        </button>

        {/* Delete button — only for owner */}
        {isOwner && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm hover:bg-red-500/30 transition-colors"
                aria-label="Delete reel"
              >
                <Trash2 className="w-4 h-4 text-white hover:text-red-400" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display text-foreground">DELETE REEL?</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  This will permanently delete your reel and all its comments. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="font-display text-xs tracking-wider">CANCEL</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-display text-xs tracking-wider"
                >
                  DELETE
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Bottom overlay: info + actions */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-end gap-3 p-4 pb-6">
        {/* Left: video info */}
        <div className="flex-1 min-w-0 space-y-2">
          <Link
            to="/profile/$userId"
            params={{ userId: video.uploader.toString() }}
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-full bg-neon/20 border border-neon/50 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src="/assets/generated/default-avatar.dim_128x128.png"
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-white font-display text-sm font-bold group-hover:text-neon transition-colors truncate">
              @{video.uploader.toString().slice(0, 8)}...
            </span>
          </Link>

          <h3 className="text-white font-display text-xl font-bold leading-tight line-clamp-2">
            {video.title}
          </h3>

          {video.description && (
            <p className="text-white/80 text-sm line-clamp-2">{video.description}</p>
          )}

          <div className="flex flex-wrap gap-1">
            {video.hashtags.slice(0, 4).map((tag) => (
              <Link
                key={tag}
                to="/filter/$type/$value"
                params={{ type: 'hashtag', value: tag }}
                className="text-neon text-xs font-semibold hover:text-neon/80 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>

          <Link
            to="/filter/$type/$value"
            params={{ type: 'category', value: video.category }}
            className="inline-block px-2 py-0.5 rounded bg-neon/20 border border-neon/40 text-neon text-xs font-display font-bold"
          >
            {video.category.toUpperCase()}
          </Link>
        </div>

        {/* Right: action buttons */}
        <div className="flex flex-col items-center gap-4 flex-shrink-0">
          {/* Like */}
          <button
            onClick={handleLike}
            className="flex flex-col items-center gap-1 group"
          >
            <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
              liked ? 'bg-red-500/20 border border-red-500/50' : 'bg-black/50 border border-white/20'
            }`}>
              <Heart
                className={`w-5 h-5 transition-all ${liked ? 'text-red-500 fill-red-500 scale-110' : 'text-white'}`}
              />
            </div>
            <span className="text-white text-xs font-bold">{formatCount(likeCount)}</span>
          </button>

          {/* Comment */}
          <button
            onClick={() => setShowComments(true)}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-11 h-11 rounded-full bg-black/50 border border-white/20 flex items-center justify-center hover:border-neon/50 transition-all">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-xs font-bold">{formatCount(video.comments.length)}</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-11 h-11 rounded-full bg-black/50 border border-white/20 flex items-center justify-center hover:border-neon/50 transition-all">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-xs font-bold">Share</span>
          </button>
        </div>
      </div>

      {/* Comments Panel */}
      {showComments && (
        <CommentsPanel
          videoId={video.id}
          onClose={() => setShowComments(false)}
        />
      )}
    </div>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
