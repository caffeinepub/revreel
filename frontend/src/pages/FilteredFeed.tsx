import React from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useGetVideosByCategory, useGetVideosByHashtag, useGetCallerUserProfile } from '../hooks/useQueries';
import VideoCard from '../components/VideoCard';
import { ArrowLeft, Hash, Layers, Loader2 } from 'lucide-react';

export default function FilteredFeed() {
  const { type, value } = useParams({ from: '/app-layout/filter/$type/$value' });

  const categoryQuery = useGetVideosByCategory(type === 'category' ? value : '');
  const hashtagQuery = useGetVideosByHashtag(type === 'hashtag' ? value : '');
  const { data: currentUserProfile } = useGetCallerUserProfile();

  const { data: videos, isLoading } = type === 'category' ? categoryQuery : hashtagQuery;

  const label = type === 'hashtag' ? `#${value}` : String(value).toUpperCase();
  const Icon = type === 'hashtag' ? Hash : Layers;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-background/90 backdrop-blur-sm border-b border-border">
        <Link to="/discover" className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </Link>
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <span className="font-display text-foreground text-sm tracking-wider font-bold">{label}</span>
          {videos && (
            <span className="text-muted-foreground text-xs">· {videos.length} posts</span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !videos || videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground px-6 text-center">
          <Icon className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-lg font-semibold">No posts found</p>
          <p className="text-sm mt-1">No videos for {label} yet.</p>
          <Link
            to="/upload"
            className="mt-4 inline-block px-6 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Be the first 🔥
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {videos.map((video) => (
            <div key={video.id} className="snap-start snap-always">
              <VideoCard
                video={video}
                currentUserProfile={currentUserProfile ?? null}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
