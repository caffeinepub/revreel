import React, { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { useGetAllVideos } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { Hash, Layers, TrendingUp, Flame } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  drag: '🏁 Drag Racing',
  drift: '💨 Drift',
  jdm: '🇯🇵 JDM',
  muscle: '💪 Muscle Cars',
  supercar: '🏎️ Supercars',
  offroad: '🏔️ Off-Road',
  daily: '🚗 Daily Drivers',
  tuner: '🔧 Tuner Builds',
};

const CATEGORY_COLORS: Record<string, string> = {
  drag: 'from-red-900/40 to-red-800/20 border-red-700/40',
  drift: 'from-blue-900/40 to-blue-800/20 border-blue-700/40',
  jdm: 'from-pink-900/40 to-pink-800/20 border-pink-700/40',
  muscle: 'from-orange-900/40 to-orange-800/20 border-orange-700/40',
  supercar: 'from-yellow-900/40 to-yellow-800/20 border-yellow-700/40',
  offroad: 'from-green-900/40 to-green-800/20 border-green-700/40',
  daily: 'from-gray-900/40 to-gray-800/20 border-gray-700/40',
  tuner: 'from-purple-900/40 to-purple-800/20 border-purple-700/40',
};

export default function Discover() {
  const { data: videos, isLoading } = useGetAllVideos();

  const { categories, hashtags } = useMemo(() => {
    if (!videos) return { categories: [], hashtags: [] };

    const catMap = new Map<string, number>();
    const tagMap = new Map<string, number>();

    videos.forEach((v) => {
      catMap.set(v.category, (catMap.get(v.category) ?? 0) + 1);
      v.hashtags.forEach((h) => {
        tagMap.set(h, (tagMap.get(h) ?? 0) + 1);
      });
    });

    const categories = Array.from(catMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([value, count]) => ({ value, count, label: CATEGORY_LABELS[value] ?? value }));

    const hashtags = Array.from(tagMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));

    return { categories, hashtags };
  }, [videos]);

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="px-4 pt-4 pb-6 border-b border-border">
        <h1 className="font-display text-3xl text-foreground">DISCOVER</h1>
        <p className="text-muted-foreground text-sm mt-1">Explore by category and hashtag</p>
      </div>

      {isLoading ? (
        <DiscoverSkeleton />
      ) : (
        <div className="px-4 space-y-8 mt-6">
          {/* Categories */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-neon" />
              <h2 className="font-display text-xl text-foreground">CATEGORIES</h2>
            </div>
            {categories.length === 0 ? (
              <p className="text-muted-foreground text-sm">No categories yet. Upload some reels!</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {categories.map(({ value, count, label }) => (
                  <Link
                    key={value}
                    to="/filter/$type/$value"
                    params={{ type: 'category', value }}
                    className={`relative rounded-xl border bg-gradient-to-br p-4 overflow-hidden group transition-all hover:scale-[1.02] ${
                      CATEGORY_COLORS[value] ?? 'from-card to-card border-border'
                    }`}
                  >
                    <div className="font-display text-lg text-foreground group-hover:text-neon transition-colors">
                      {label}
                    </div>
                    <div className="text-muted-foreground text-xs mt-1 font-display">
                      {count} REEL{count !== 1 ? 'S' : ''}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Trending Hashtags */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-neon" />
              <h2 className="font-display text-xl text-foreground">TRENDING TAGS</h2>
            </div>
            {hashtags.length === 0 ? (
              <p className="text-muted-foreground text-sm">No hashtags yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {hashtags.map(({ tag, count }) => (
                  <Link
                    key={tag}
                    to="/filter/$type/$value"
                    params={{ type: 'hashtag', value: tag }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-card border border-border hover:border-neon/50 hover:bg-neon/10 transition-all group"
                  >
                    <Hash className="w-3 h-3 text-neon" />
                    <span className="font-display text-sm text-foreground group-hover:text-neon transition-colors">
                      {tag}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">{count}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* All Videos count */}
          <section className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-neon/10 border border-neon/30 flex items-center justify-center">
              <Flame className="w-6 h-6 text-neon" />
            </div>
            <div>
              <div className="font-display text-2xl text-neon">{videos?.length ?? 0}</div>
              <div className="text-muted-foreground text-sm font-display">TOTAL REELS</div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function DiscoverSkeleton() {
  return (
    <div className="px-4 space-y-6 mt-6">
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
    </div>
  );
}
