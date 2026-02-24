import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useGetAllVideos, useGetCallerUserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import VideoCard from '../components/VideoCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Flame, Users } from 'lucide-react';
import { type Video } from '../backend';

type FeedTab = 'foryou' | 'following';

const MUTE_STORAGE_KEY = 'revreel_feed_muted';

export default function Feed() {
  const [activeTab, setActiveTab] = useState<FeedTab>('foryou');
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const [isMuted, setIsMuted] = useState<boolean>(() => {
    const stored = sessionStorage.getItem(MUTE_STORAGE_KEY);
    return stored === null ? false : stored === 'true';
  });

  const handleMuteToggle = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      sessionStorage.setItem(MUTE_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const { data: allVideos, isLoading } = useGetAllVideos();
  const { data: userProfile } = useGetCallerUserProfile();

  const videos: Video[] = allVideos ?? [];

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const scrollTop = container.scrollTop;
    const height = container.clientHeight;
    const newIndex = Math.round(scrollTop / height);
    setActiveIndex(newIndex);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div className="relative h-[calc(100vh-7rem)] overflow-hidden">
      {/* Tab bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-center gap-6 pt-3 pb-2">
        <button
          onClick={() => setActiveTab('foryou')}
          className={`font-display text-sm tracking-widest transition-all pb-1 border-b-2 ${
            activeTab === 'foryou'
              ? 'text-white border-neon neon-text'
              : 'text-white/60 border-transparent hover:text-white/80'
          }`}
        >
          <Flame className="inline w-3 h-3 mr-1" />
          FOR YOU
        </button>
        {isAuthenticated && (
          <button
            onClick={() => setActiveTab('following')}
            className={`font-display text-sm tracking-widest transition-all pb-1 border-b-2 ${
              activeTab === 'following'
                ? 'text-white border-neon neon-text'
                : 'text-white/60 border-transparent hover:text-white/80'
            }`}
          >
            <Users className="inline w-3 h-3 mr-1" />
            FOLLOWING
          </button>
        )}
      </div>

      {/* Video feed */}
      {isLoading ? (
        <FeedSkeleton />
      ) : videos.length === 0 ? (
        <EmptyFeed />
      ) : (
        <div
          ref={containerRef}
          className="h-full overflow-y-scroll snap-mandatory scrollbar-hide"
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
                onMuteToggle={handleMuteToggle}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="h-full flex items-center justify-center bg-black">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-2 border-neon rounded-full border-t-transparent animate-spin mx-auto" />
        <p className="text-white/60 font-display text-lg tracking-widest">LOADING REELS...</p>
      </div>
    </div>
  );
}

function EmptyFeed() {
  return (
    <div className="h-full flex items-center justify-center bg-black">
      <div className="text-center space-y-4 px-6">
        <img
          src="/assets/generated/placeholder-thumb.dim_640x360.png"
          alt="No videos"
          className="w-48 h-28 object-cover rounded-lg mx-auto opacity-50"
        />
        <h3 className="font-display text-2xl text-white">NO REELS YET</h3>
        <p className="text-white/60 text-sm">Be the first to drop a reel! Upload your best racing content.</p>
      </div>
    </div>
  );
}
