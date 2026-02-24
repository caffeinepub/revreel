import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useGetVideosByCategory, useGetVideosByHashtag } from '../hooks/useQueries';
import VideoCard from '../components/VideoCard';
import { ArrowLeft, Hash, Layers } from 'lucide-react';

const MUTE_STORAGE_KEY = 'revreel_feed_muted';

export default function FilteredFeed() {
  const params = useParams({ from: '/filter/$type/$value' });
  const { type, value } = params;
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Shared mute state synced with sessionStorage — default false (unmuted)
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    const stored = sessionStorage.getItem(MUTE_STORAGE_KEY);
    return stored === null ? false : stored === 'true';
  });

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      sessionStorage.setItem(MUTE_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const categoryQuery = useGetVideosByCategory(type === 'category' ? value : '');
  const hashtagQuery = useGetVideosByHashtag(type === 'hashtag' ? value : '');

  const { data: videos, isLoading } = type === 'category' ? categoryQuery : hashtagQuery;

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const scrollTop = container.scrollTop;
    const height = container.clientHeight;
    setActiveIndex(Math.round(scrollTop / height));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const label = type === 'hashtag' ? `#${value}` : value.toUpperCase();
  const Icon = type === 'hashtag' ? Hash : Layers;

  return (
    <div className="relative h-[calc(100vh-7rem)] overflow-hidden">
      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center gap-3 px-4 pt-3 pb-2 bg-gradient-to-b from-black/70 to-transparent">
        <Link to="/discover" className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
          <ArrowLeft className="w-4 h-4 text-white" />
        </Link>
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-neon" />
          <span className="font-display text-white text-sm tracking-wider">{label}</span>
          {videos && (
            <span className="text-white/60 text-xs">· {videos.length} reels</span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="h-full flex items-center justify-center bg-black">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-2 border-neon rounded-full border-t-transparent animate-spin mx-auto" />
            <p className="text-white/60 font-display text-lg">LOADING...</p>
          </div>
        </div>
      ) : !videos || videos.length === 0 ? (
        <div className="h-full flex items-center justify-center bg-black">
          <div className="text-center space-y-4 px-6">
            <Icon className="w-12 h-12 text-white/30 mx-auto" />
            <h3 className="font-display text-2xl text-white">NO REELS FOUND</h3>
            <p className="text-white/60 text-sm">No videos for {label} yet.</p>
            <Link
              to="/upload"
              className="inline-block px-6 py-3 bg-neon text-primary-foreground font-display rounded-lg neon-glow"
            >
              BE THE FIRST 🔥
            </Link>
          </div>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="h-full overflow-y-scroll scrollbar-hide"
          style={{ scrollSnapType: 'y mandatory' }}
        >
          {videos.map((video, index) => (
            <div
              key={video.id}
              className="w-full flex-shrink-0"
              style={{ height: '100%', scrollSnapAlign: 'start' }}
            >
              <VideoCard
                video={video}
                isActive={index === activeIndex}
                isMuted={isMuted}
                onToggleMute={handleToggleMute}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
