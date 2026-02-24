import React, { useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGetAllVideos } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { Hash, Grid3X3 } from 'lucide-react';

const CATEGORY_COLORS = [
  'from-orange-500/20 to-red-500/20 border-orange-500/30',
  'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
  'from-red-500/20 to-pink-500/20 border-red-500/30',
  'from-amber-500/20 to-yellow-500/20 border-amber-500/30',
  'from-rose-500/20 to-red-500/20 border-rose-500/30',
  'from-orange-600/20 to-amber-500/20 border-orange-600/30',
];

export default function Discover() {
  const { data: videos = [], isLoading } = useGetAllVideos();
  const navigate = useNavigate();

  const categories = useMemo<[string, number][]>(() => {
    const counts = new Map<string, number>();
    videos.forEach((v) => {
      if (v.category) {
        counts.set(v.category, (counts.get(v.category) ?? 0) + 1);
      }
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [videos]);

  const hashtags = useMemo<[string, number][]>(() => {
    const counts = new Map<string, number>();
    videos.forEach((v) => {
      v.hashtags.forEach((tag) => {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      });
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 30);
  }, [videos]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground tracking-wider">DISCOVER</h1>
        <p className="text-muted-foreground text-sm mt-1">Explore categories and trending tags</p>
      </div>

      {/* Categories */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Grid3X3 className="w-5 h-5 text-neon-orange" />
          <h2 className="font-display text-lg font-bold text-foreground tracking-wide">CATEGORIES</h2>
        </div>
        {categories.length === 0 ? (
          <p className="text-muted-foreground text-sm">No categories yet. Upload some videos!</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {categories.map(([name, count], idx) => (
              <button
                key={name}
                onClick={() => navigate({ to: '/feed/filter', search: { type: 'category', value: name } })}
                className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} p-4 hover:scale-[1.02] transition-transform text-left`}
              >
                <p className="font-display font-bold text-foreground text-sm">{name.toUpperCase()}</p>
                <p className="text-muted-foreground text-xs mt-1">{count} video{count !== 1 ? 's' : ''}</p>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Hashtags */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Hash className="w-5 h-5 text-neon-orange" />
          <h2 className="font-display text-lg font-bold text-foreground tracking-wide">TRENDING TAGS</h2>
        </div>
        {hashtags.length === 0 ? (
          <p className="text-muted-foreground text-sm">No hashtags yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {hashtags.map(([tag, count]) => (
              <button
                key={tag}
                onClick={() => navigate({ to: '/feed/filter', search: { type: 'hashtag', value: tag } })}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted border border-border hover:border-neon-orange/50 hover:bg-neon-orange/10 transition-colors text-sm"
              >
                #{tag}
                <span className="ml-1 text-xs text-muted-foreground">{count}</span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
