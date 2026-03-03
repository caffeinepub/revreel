import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGetVideos } from '../hooks/useQueries';
import { Video } from '../backend';
import { Search, Hash, Loader2 } from 'lucide-react';

const CATEGORIES = [
  { label: 'Drift', emoji: '🌀' },
  { label: 'Drag', emoji: '🏁' },
  { label: 'Track', emoji: '🏎️' },
  { label: 'Show', emoji: '✨' },
  { label: 'Build', emoji: '🔧' },
  { label: 'Street', emoji: '🛣️' },
  { label: 'Off-Road', emoji: '🌲' },
  { label: 'Other', emoji: '🚗' },
];

export default function Discover() {
  const navigate = useNavigate();
  const { data: videos = [], isLoading } = useGetVideos();
  const [query, setQuery] = useState('');

  const q = query.toLowerCase().trim();
  const filtered: Video[] = q
    ? videos.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.hashtags.some((h) => h.toLowerCase().includes(q)) ||
          v.category.toLowerCase().includes(q),
      )
    : [];

  const allHashtags = Array.from(
    new Set(videos.flatMap((v) => v.hashtags)),
  ).slice(0, 20);

  return (
    <div className="min-h-full bg-background text-foreground pb-24 px-4 pt-6">
      <h1 className="text-2xl font-display font-bold text-primary mb-4">Discover</h1>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search videos, hashtags, categories…"
          className="w-full bg-muted border border-border text-foreground placeholder:text-muted-foreground rounded-full pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Search results */}
      {q && (
        <div className="mb-6">
          <h2 className="text-muted-foreground text-sm font-semibold mb-3">
            Results ({filtered.length})
          </h2>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">No results found.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filtered.map((v: Video) => (
                <button
                  key={v.id}
                  className="relative aspect-video bg-muted rounded-lg overflow-hidden text-left"
                  onClick={() => navigate({ to: '/feed' })}
                >
                  <img
                    src={v.thumbnail.getDirectURL() || '/assets/generated/placeholder-thumb.dim_640x360.png'}
                    alt={v.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <p className="absolute bottom-2 left-2 right-2 text-white text-xs font-semibold line-clamp-2">
                    {v.title}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Categories */}
      {!q && (
        <>
          <h2 className="text-muted-foreground text-sm font-semibold mb-3">Categories</h2>
          <div className="grid grid-cols-4 gap-2 mb-6">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                onClick={() =>
                  navigate({
                    to: '/filtered-feed',
                    search: { category: cat.label, hashtag: '' },
                  })
                }
                className="flex flex-col items-center gap-1 bg-card border border-border rounded-xl py-3 hover:border-primary/40 transition-colors"
              >
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-muted-foreground text-xs">{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Trending hashtags */}
          {allHashtags.length > 0 && (
            <>
              <h2 className="text-muted-foreground text-sm font-semibold mb-3">Trending Hashtags</h2>
              <div className="flex flex-wrap gap-2">
                {allHashtags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() =>
                      navigate({
                        to: '/filtered-feed',
                        search: { category: '', hashtag: tag },
                      })
                    }
                    className="flex items-center gap-1 bg-card border border-border rounded-full px-3 py-1.5 text-sm text-primary hover:border-primary/40 transition-colors"
                  >
                    <Hash className="w-3 h-3" />
                    {tag}
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
