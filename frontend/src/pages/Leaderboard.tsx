import React from 'react';
import { Link } from '@tanstack/react-router';
import { useGetTrendingVideos, useGetAllVideos } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Heart, Play, Crown, Medal, Award } from 'lucide-react';
import { type Video } from '../backend';

export default function Leaderboard() {
  const { data: trendingVideos, isLoading: trendingLoading } = useGetTrendingVideos();
  const { data: allVideos, isLoading: videosLoading } = useGetAllVideos();

  const isLoading = trendingLoading || videosLoading;

  // Compute top uploaders by total likes
  const topUploaders = React.useMemo(() => {
    if (!allVideos) return [];
    const uploaderMap = new Map<string, { likes: number; videos: number }>();
    allVideos.forEach((v) => {
      const uid = v.uploader.toString();
      const existing = uploaderMap.get(uid) ?? { likes: 0, videos: 0 };
      uploaderMap.set(uid, {
        likes: existing.likes + v.likes.length,
        videos: existing.videos + 1,
      });
    });
    return Array.from(uploaderMap.entries())
      .sort((a, b) => b[1].likes - a[1].likes)
      .slice(0, 10)
      .map(([userId, stats]) => ({ userId, ...stats }));
  }, [allVideos]);

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Banner */}
      <div className="relative h-40 overflow-hidden">
        <img
          src="/assets/generated/leaderboard-banner.dim_1200x400.png"
          alt="Leaderboard"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-background" />
        <div className="absolute bottom-4 left-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-neon-yellow" />
            <h1 className="font-display text-3xl text-white">LEADERBOARD</h1>
          </div>
          <p className="text-white/70 text-sm">Top racers & hottest reels</p>
        </div>
      </div>

      <div className="px-4 space-y-8 mt-6">
        {/* Top Videos */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-red-500" />
            <h2 className="font-display text-xl text-foreground">TOP REELS</h2>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : !trendingVideos || trendingVideos.length === 0 ? (
            <p className="text-muted-foreground text-sm">No videos yet. Be the first to upload!</p>
          ) : (
            <div className="space-y-3">
              {trendingVideos.map((video, index) => (
                <VideoRankCard key={video.id} video={video} rank={index + 1} />
              ))}
            </div>
          )}
        </section>

        {/* Top Uploaders */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-5 h-5 text-neon-yellow" />
            <h2 className="font-display text-xl text-foreground">TOP RACERS</h2>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : topUploaders.length === 0 ? (
            <p className="text-muted-foreground text-sm">No racers yet.</p>
          ) : (
            <div className="space-y-3">
              {topUploaders.map(({ userId, likes, videos }, index) => (
                <UploaderRankCard
                  key={userId}
                  userId={userId}
                  likes={likes}
                  videos={videos}
                  rank={index + 1}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
  if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
  return (
    <span className="font-display text-sm text-muted-foreground w-5 text-center">
      {rank}
    </span>
  );
}

function VideoRankCard({ video, rank }: { video: Video; rank: number }) {
  const thumbnailUrl = video.thumbnail.getDirectURL() || '/assets/generated/placeholder-thumb.dim_640x360.png';
  return (
    <div className="flex items-center gap-3 bg-card rounded-xl border border-border p-3 hover:border-neon/30 transition-colors">
      <div className="flex items-center justify-center w-8 flex-shrink-0">
        <RankIcon rank={rank} />
      </div>
      <div className="w-14 h-10 rounded-lg overflow-hidden bg-black flex-shrink-0">
        <img
          src={thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = '/assets/generated/placeholder-thumb.dim_640x360.png'; }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display text-sm text-foreground truncate">{video.title}</p>
        <p className="text-xs text-muted-foreground truncate">
          @{video.uploader.toString().slice(0, 8)}...
        </p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Heart className="w-4 h-4 text-red-500 fill-red-500" />
        <span className="font-display text-sm text-foreground">{video.likes.length}</span>
      </div>
    </div>
  );
}

function UploaderRankCard({
  userId,
  likes,
  videos,
  rank,
}: {
  userId: string;
  likes: number;
  videos: number;
  rank: number;
}) {
  return (
    <Link
      to="/profile/$userId"
      params={{ userId }}
      className="flex items-center gap-3 bg-card rounded-xl border border-border p-3 hover:border-neon/30 transition-colors"
    >
      <div className="flex items-center justify-center w-8 flex-shrink-0">
        <RankIcon rank={rank} />
      </div>
      <div className="w-10 h-10 rounded-full overflow-hidden bg-neon/10 border border-neon/20 flex-shrink-0">
        <img
          src="/assets/generated/default-avatar.dim_128x128.png"
          alt="avatar"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display text-sm text-foreground truncate">
          @{userId.slice(0, 12)}...
        </p>
        <p className="text-xs text-muted-foreground">{videos} reel{videos !== 1 ? 's' : ''}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Heart className="w-4 h-4 text-red-500 fill-red-500" />
        <span className="font-display text-sm text-foreground">{likes}</span>
      </div>
    </Link>
  );
}
