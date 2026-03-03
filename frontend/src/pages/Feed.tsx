import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useGetVideos } from '../hooks/useQueries';
import VideoCard from '../components/VideoCard';
import { Loader2 } from 'lucide-react';

export default function Feed() {
  const { data: videos = [], isLoading } = useGetVideos();
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const sorted = [...videos].sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const idx = itemRefs.current.indexOf(entry.target as HTMLDivElement);
        if (idx !== -1) setActiveIndex(idx);
      }
    });
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: containerRef.current,
      threshold: 0.6,
    });
    itemRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sorted.length, handleObserver]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-neon-orange animate-spin" />
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
        <p className="text-white/60 text-lg">No videos yet.</p>
        <p className="text-white/40 text-sm">Be the first to upload a reel!</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-scroll snap-y snap-mandatory"
      style={{ scrollbarWidth: 'none' }}
    >
      {sorted.map((video, idx) => (
        <div
          key={video.id}
          ref={(el) => { itemRefs.current[idx] = el; }}
          className="w-full h-full snap-start snap-always"
        >
          <VideoCard video={video} isActive={idx === activeIndex} />
        </div>
      ))}
    </div>
  );
}
