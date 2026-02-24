import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { Search, X, Video, User, Hash, Layers } from 'lucide-react';
import { useGetAllVideos, useGetAllUsers } from '../hooks/useQueries';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const CATEGORY_COLORS = [
  'from-orange-500/20 to-red-500/20 border-orange-500/30',
  'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
  'from-green-500/20 to-emerald-500/20 border-green-500/30',
  'from-purple-500/20 to-pink-500/20 border-purple-500/30',
  'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
  'from-red-500/20 to-pink-500/20 border-red-500/30',
  'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
  'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
];

export default function Discover() {
  const { data: videos } = useGetAllVideos();
  const { data: allUsers } = useGetAllUsers();
  const [searchInput, setSearchInput] = useState('');
  const searchQuery = useDebounce(searchInput, 300);

  const categories = videos
    ? [...new Map(videos.map(v => [v.category, v])).entries()].map(([cat], idx) => ({
        name: cat,
        count: videos.filter(v => v.category === cat).length,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      }))
    : [];

  const hashtags = videos
    ? [...new Map(
        videos.flatMap(v => v.hashtags).map(h => [h, videos.filter(v => v.hashtags.includes(h)).length])
      ).entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
    : [];

  const isSearching = searchQuery.trim().length > 0;

  const matchingVideos = isSearching && videos
    ? videos.filter(v =>
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.hashtags.some(h => h.toLowerCase().includes(searchQuery.toLowerCase())) ||
        v.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const matchingUsers = isSearching && allUsers
    ? allUsers.filter(u =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="font-display text-2xl font-bold text-foreground mb-4">DISCOVER</h1>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Search videos, users, hashtags..."
          className="w-full bg-card border border-border rounded-xl pl-10 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon/50 transition-colors"
        />
        {searchInput && (
          <button
            onClick={() => setSearchInput('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isSearching ? (
        <div className="space-y-6">
          {/* Video results */}
          <div>
            <h2 className="font-display font-bold text-foreground mb-3 flex items-center gap-2">
              <Video className="w-4 h-4 text-neon" />
              Videos ({matchingVideos.length})
            </h2>
            {matchingVideos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No videos found</p>
            ) : (
              <div className="space-y-2">
                {matchingVideos.slice(0, 10).map(v => (
                  <Link
                    key={v.id}
                    to="/filter/$type/$value"
                    params={{ type: 'category', value: v.category }}
                    className="flex items-center gap-3 p-2 rounded-lg border border-border hover:border-neon/40 bg-card/40 transition-all"
                  >
                    <img
                      src={v.thumbnail.getDirectURL()}
                      alt={v.title}
                      className="w-16 h-10 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground line-clamp-1">{v.title}</p>
                      <p className="text-xs text-muted-foreground">{v.category}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* User results */}
          <div>
            <h2 className="font-display font-bold text-foreground mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-neon" />
              Users ({matchingUsers.length})
            </h2>
            {matchingUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users found</p>
            ) : (
              <div className="space-y-2">
                {matchingUsers.slice(0, 10).map(u => (
                  <Link
                    key={u.id.toString()}
                    to="/profile/$userId"
                    params={{ userId: u.id.toString() }}
                    className="flex items-center gap-3 p-2 rounded-lg border border-border hover:border-neon/40 bg-card/40 transition-all"
                  >
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={u.username} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-neon/20 flex items-center justify-center text-neon font-bold">
                        {u.username[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-foreground">{u.username}</p>
                      <p className="text-xs text-muted-foreground">{u.id.toString().slice(0, 12)}...</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
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
                {categories.map(({ name, count, color }) => (
                  <Link
                    key={name}
                    to="/filter/$type/$value"
                    params={{ type: 'category', value: name }}
                    className={`relative rounded-xl border bg-gradient-to-br ${color} p-4 hover:scale-[1.02] transition-transform`}
                  >
                    <p className="font-display font-bold text-foreground text-sm">{name.toUpperCase()}</p>
                    <p className="text-muted-foreground text-xs mt-1">{count} reels</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Hashtags */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Hash className="w-5 h-5 text-neon" />
              <h2 className="font-display text-xl text-foreground">TRENDING TAGS</h2>
            </div>
            {hashtags.length === 0 ? (
              <p className="text-muted-foreground text-sm">No hashtags yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {hashtags.map(([tag, count]) => (
                  <Link
                    key={tag}
                    to="/filter/$type/$value"
                    params={{ type: 'hashtag', value: tag }}
                    className="px-3 py-1.5 rounded-full bg-card border border-border hover:border-neon/50 text-sm text-foreground hover:text-neon transition-colors"
                  >
                    #{tag}
                    <span className="ml-1 text-xs text-muted-foreground">{count}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
