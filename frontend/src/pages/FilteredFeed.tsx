import React from 'react';
import { useParams } from '@tanstack/react-router';
import { useGetVideosByCategory, useGetVideosByHashtag, useGetCallerUserProfile } from '../hooks/useQueries';
import VideoCard from '../components/VideoCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export default function FilteredFeed() {
  // Use strict: false to avoid route path mismatch issues
  const params = useParams({ strict: false }) as { type?: string; value?: string };
  const type = params.type ?? '';
  const value = params.value ?? '';

  const { data: currentUserProfile } = useGetCallerUserProfile();

  const categoryQuery = useGetVideosByCategory(type === 'category' ? value : '');
  const hashtagQuery = useGetVideosByHashtag(type === 'hashtag' ? value : '');

  const { data: videos = [], isLoading } = type === 'category' ? categoryQuery : hashtagQuery;

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Back header */}
      <div className="sticky top-14 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/discover" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display font-bold text-foreground">
            {type === 'category' ? value.toUpperCase() : `#${value}`}
          </h1>
          <p className="text-xs text-muted-foreground">{videos.length} video{videos.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <p className="text-muted-foreground text-lg font-display">No videos found</p>
          <p className="text-muted-foreground text-sm mt-2">
            {type === 'category' ? `No videos in "${value}" category yet.` : `No videos tagged #${value} yet.`}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} currentUserProfile={currentUserProfile ?? null} />
          ))}
        </div>
      )}
    </div>
  );
}
