import React, { useRef, useState } from 'react';
import { useGetAllVideos, useGetCallerUserProfile, type Video } from '../hooks/useQueries';
import VideoCard from '../components/VideoCard';
import AuthGuard from '../components/AuthGuard';
import { Loader2 } from 'lucide-react';

export default function Feed() {
  const { data: videos = [], isLoading } = useGetAllVideos();
  const { data: currentUserProfile } = useGetCallerUserProfile();

  const sortedVideos = [...videos].sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

  return (
    <AuthGuard>
      <div className="h-[calc(100svh-3.5rem)] overflow-y-scroll snap-y snap-mandatory">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : sortedVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
            <p className="text-lg font-display">No posts yet</p>
            <p className="text-sm">Be the first to upload a reel or photo!</p>
          </div>
        ) : (
          sortedVideos.map((video: Video) => (
            <div key={video.id} className="snap-start snap-always">
              <VideoCard video={video} currentUserProfile={currentUserProfile} />
            </div>
          ))
        )}
      </div>
    </AuthGuard>
  );
}
