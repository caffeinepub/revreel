import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useSearch, useNavigate } from '@tanstack/react-router';
import { useGetVideos } from '../hooks/useQueries';
import VideoCard from '../components/VideoCard';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function FilteredFeed() {
  const search = useSearch({ strict: false }) as { category?: string; hashtag?: string };
  const navigate = useNavigate();
  const { data: videos = [], isLoading } = useGetVideos();

  const category = search.category ?? '';
  const hashtag = search.hashtag ?? '';

  const filtered = videos.filter((v) => {
    if (category) return v.category.toLowerCase() === category.toLowerCase();
    if (hashtag) return v.hashtags.some((h) => h.toLowerCase() === hashtag.toLowerCase());
    return true;
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

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
  }, [filtered.length, handleObserver]);

  const label = category ? `#${category}` : hashtag ? `#${hashtag}` : 'All';

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 bg-surface border-b border-white/10 z-10">
        <button onClick={() => navigate({ to: '/discover' })} className="text-white/70 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-bold">{label}</h1>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-neon-orange animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <p className="text-white/50">No videos found for {label}.</p>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="flex-1 overflow-y-scroll snap-y snap-mandatory"
          style={{ scrollbarWidth: 'none' }}
        >
          {filtered.map((video, idx) => (
            <div
              key={video.id}
              ref={(el) => { itemRefs.current[idx] = el; }}
              className="w-full h-full snap-start snap-always"
            >
              <VideoCard video={video} isActive={idx === activeIndex} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
