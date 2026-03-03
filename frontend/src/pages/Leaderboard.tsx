import React from 'react';
import { useGetVideos, useGetUserProfile } from '../hooks/useQueries';
import { Video } from '../backend';
import { Trophy, Zap, Loader2 } from 'lucide-react';
import AftermarketAdBanner from '../components/AftermarketAdBanner';

function TopRacerItem({ userId, rank }: { userId: string; rank: number }) {
  const { data: profile } = useGetUserProfile(userId);
  const avatarUrl = profile?.avatarUrl || profile?.avatar?.getDirectURL() || '';

  return (
    <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
      <span className="text-neon-orange font-bold text-lg w-6 text-center">{rank}</span>
      <div className="w-10 h-10 rounded-full bg-neon-orange/20 overflow-hidden shrink-0">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-neon-orange font-bold text-sm">
              {(profile?.username ?? userId).charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold truncate">
          {profile?.username ?? userId.slice(0, 12) + '…'}
        </p>
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const { data: videos = [], isLoading } = useGetVideos();

  const topVideos = [...videos]
    .sort((a: Video, b: Video) => Number(b.viewCount) - Number(a.viewCount))
    .slice(0, 10);

  const uploaderCounts: Record<string, number> = {};
  videos.forEach((v: Video) => {
    const uid = v.uploader.toString();
    uploaderCounts[uid] = (uploaderCounts[uid] ?? 0) + Number(v.viewCount);
  });
  const topRacers = Object.entries(uploaderCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([uid]) => uid);

  return (
    <div className="min-h-full bg-background text-white pb-24 px-4 pt-6">
      <h1 className="text-2xl font-display font-bold text-neon-orange mb-6 flex items-center gap-2">
        <Trophy className="w-6 h-6" /> Leaderboard
      </h1>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-neon-orange animate-spin" />
        </div>
      ) : (
        <>
          {/* Trending Videos */}
          <section className="mb-6">
            <h2 className="text-white/70 text-sm font-semibold mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-neon-yellow" /> Trending Videos
            </h2>
            {topVideos.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-4">No videos yet.</p>
            ) : (
              <div className="space-y-2">
                {topVideos.map((v: Video, i) => (
                  <div key={v.id} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                    <span className="text-neon-orange font-bold text-lg w-6 text-center">{i + 1}</span>
                    <div className="w-12 h-8 rounded overflow-hidden shrink-0">
                      <img
                        src={v.thumbnail.getDirectURL() || '/assets/generated/placeholder-thumb.dim_640x360.png'}
                        alt={v.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{v.title}</p>
                      <p className="text-white/40 text-xs">{Number(v.viewCount).toLocaleString()} views</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <AftermarketAdBanner />

          {/* Top Racers */}
          <section>
            <h2 className="text-white/70 text-sm font-semibold mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-neon-orange" /> Top Racers
            </h2>
            {topRacers.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-4">No racers yet.</p>
            ) : (
              <div className="space-y-2">
                {topRacers.map((uid, i) => (
                  <TopRacerItem key={uid} userId={uid} rank={i + 1} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
