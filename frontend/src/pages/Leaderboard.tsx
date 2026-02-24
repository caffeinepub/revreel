import React from 'react';
import { useGetTrendingVideos, useGetAllVideos, type Video } from '../hooks/useQueries';
import { Crown, Medal, Award, Loader2, Trophy } from 'lucide-react';
import { Link } from '@tanstack/react-router';

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
  if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
  return (
    <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">
      #{rank}
    </span>
  );
}

export default function Leaderboard() {
  const { data: trendingVideos = [], isLoading: trendingLoading } = useGetTrendingVideos();
  const { data: allVideos = [], isLoading: allLoading } = useGetAllVideos();

  const isLoading = trendingLoading || allLoading;

  // Compute top racers by total likes
  const racerMap = new Map<string, { userId: string; totalLikes: number; videoCount: number }>();
  allVideos.forEach((video: Video) => {
    const uid = video.uploader?.toString() || '';
    if (!uid) return;
    const existing = racerMap.get(uid) || { userId: uid, totalLikes: 0, videoCount: 0 };
    existing.totalLikes += video.likes.length;
    existing.videoCount += 1;
    racerMap.set(uid, existing);
  });
  const topRacers = Array.from(racerMap.values())
    .sort((a, b) => b.totalLikes - a.totalLikes)
    .slice(0, 10);

  const topVideos = [...trendingVideos].slice(0, 10);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      {/* Banner */}
      <div className="relative rounded-xl overflow-hidden h-40">
        <img
          src="/assets/generated/leaderboard-banner.dim_1200x400.png"
          alt="Leaderboard"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center px-6">
          <div>
            <h1 className="font-display text-3xl font-black text-white neon-text flex items-center gap-2">
              <Trophy className="w-8 h-8 text-primary" />
              Leaderboard
            </h1>
            <p className="text-white/70 text-sm mt-1">Top racers and trending content</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Trending Videos */}
          <div>
            <h2 className="font-display text-xl font-bold mb-4 text-primary neon-text">🔥 Trending Videos</h2>
            <div className="space-y-3">
              {topVideos.length === 0 ? (
                <p className="text-muted-foreground text-sm">No videos yet</p>
              ) : (
                topVideos.map((video: Video, index) => (
                  <div
                    key={video.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
                  >
                    <RankIcon rank={index + 1} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{video.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {video.likes.length} likes · {Number(video.viewCount).toLocaleString()} views
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Racers */}
          <div>
            <h2 className="font-display text-xl font-bold mb-4 text-primary neon-text">🏆 Top Racers</h2>
            <div className="space-y-3">
              {topRacers.length === 0 ? (
                <p className="text-muted-foreground text-sm">No racers yet</p>
              ) : (
                topRacers.map((racer, index) => (
                  <Link
                    key={racer.userId}
                    to="/profile/$userId"
                    params={{ userId: racer.userId }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
                  >
                    <RankIcon rank={index + 1} />
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary">
                        {racer.userId.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{racer.userId.slice(0, 12)}...</p>
                      <p className="text-xs text-muted-foreground">
                        {racer.totalLikes} total likes · {racer.videoCount} videos
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
