import { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useGetAllVideos } from "../hooks/useQueries";
import { Search, TrendingUp, Hash, Film } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Discover() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: videos = [] } = useGetAllVideos();

  // Compute categories
  const categories = useMemo(() => {
    const map = new Map<string, number>();
    (videos as any[]).forEach((v: any) => {
      if (v.category) {
        map.set(v.category, (map.get(v.category) ?? 0) + 1);
      }
    });
    const result: [string, number][] = [];
    map.forEach((count, name) => result.push([name, count]));
    return result.sort((a, b) => b[1] - a[1]);
  }, [videos]);

  // Compute hashtags
  const hashtags = useMemo(() => {
    const map = new Map<string, number>();
    (videos as any[]).forEach((v: any) => {
      (v.hashtags ?? []).forEach((tag: string) => {
        map.set(tag, (map.get(tag) ?? 0) + 1);
      });
    });
    const result: [string, number][] = [];
    map.forEach((count, tag) => result.push([tag, count]));
    return result.sort((a, b) => b[1] - a[1]).slice(0, 20);
  }, [videos]);

  // Filter videos by search
  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return (videos as any[]).filter(
      (v: any) =>
        v.title?.toLowerCase().includes(q) ||
        v.description?.toLowerCase().includes(q) ||
        v.category?.toLowerCase().includes(q) ||
        (v.hashtags ?? []).some((t: string) => t.toLowerCase().includes(q))
    );
  }, [videos, searchQuery]);

  const handleCategoryClick = (name: string) => {
    navigate({
      to: "/filtered-feed",
      search: { type: "category", value: name },
    });
  };

  const handleHashtagClick = (tag: string) => {
    navigate({
      to: "/filtered-feed",
      search: { type: "hashtag", value: tag },
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-display font-bold mb-4">Discover</h1>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search videos, categories, hashtags..."
          className="pl-9"
        />
      </div>

      {/* Search Results */}
      {searchQuery.trim() && (
        <div className="mb-6">
          <h2 className="text-lg font-display font-semibold mb-3 flex items-center gap-2">
            <Film className="h-5 w-5 text-primary" />
            Results ({filteredVideos.length})
          </h2>
          {filteredVideos.length === 0 ? (
            <p className="text-muted-foreground text-sm">No videos found.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filteredVideos.slice(0, 10).map((v: any) => (
                <div
                  key={v.id}
                  className="bg-muted/30 rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() =>
                    navigate({
                      to: "/filtered-feed",
                      search: { type: "category", value: v.category },
                    })
                  }
                >
                  <p className="text-sm font-medium line-clamp-2">{v.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {v.category}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Categories */}
      {!searchQuery.trim() && (
        <>
          <div className="mb-6">
            <h2 className="text-lg font-display font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Categories
            </h2>
            {categories.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No categories yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {categories.map(([name, count]) => (
                  <button
                    key={name}
                    onClick={() => handleCategoryClick(name)}
                    className="flex items-center justify-between bg-muted/30 hover:bg-muted/60 rounded-lg px-4 py-3 transition-colors text-left"
                  >
                    <span className="font-medium text-sm">{name}</span>
                    <span className="text-xs text-muted-foreground">
                      {count} video{count !== 1 ? "s" : ""}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hashtags */}
          <div>
            <h2 className="text-lg font-display font-semibold mb-3 flex items-center gap-2">
              <Hash className="h-5 w-5 text-primary" />
              Trending Hashtags
            </h2>
            {hashtags.length === 0 ? (
              <p className="text-muted-foreground text-sm">No hashtags yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {hashtags.map(([tag, count]) => (
                  <button
                    key={tag}
                    onClick={() => handleHashtagClick(tag)}
                    className="flex items-center gap-1 bg-muted/30 hover:bg-muted/60 rounded-full px-3 py-1.5 text-sm transition-colors"
                  >
                    <span className="text-primary">#</span>
                    <span>{tag}</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
