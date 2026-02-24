import React, { useState } from 'react';
import { Plus, Wrench, MessageSquare, Clock, LogIn, Loader2 } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetAllMechanicsPosts, useGetUserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import PostIssueModal from '../components/PostIssueModal';
import { type MechanicsPost } from '../backend';
import { toast } from 'sonner';

const CATEGORY_COLORS: Record<string, string> = {
  Engine: 'bg-red-500/20 text-red-400 border-red-500/40',
  Brakes: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  Suspension: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  Electrical: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  Bodywork: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  Transmission: 'bg-neon/20 text-neon border-neon/40',
  Other: 'bg-muted text-muted-foreground border-border/40',
};

function timeAgo(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  const diff = Date.now() - ms;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function PostCard({ post }: { post: MechanicsPost }) {
  const authorId = post.author.toString();
  const { data: authorProfile } = useGetUserProfile(authorId);
  const categoryColor = CATEGORY_COLORS[post.category] ?? CATEGORY_COLORS['Other'];

  return (
    <Link
      to="/mechanics/$postId"
      params={{ postId: post.id.toString() }}
      className="block rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden hover:border-neon/30 transition-all group"
    >
      <div className="h-0.5 bg-gradient-to-r from-neon/60 via-neon/20 to-transparent" />
      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base tracking-wide text-foreground group-hover:text-neon transition-colors leading-tight flex-1">
            {post.title}
          </h3>
          <span className={`shrink-0 text-[10px] font-display tracking-wider px-2 py-0.5 rounded border ${categoryColor}`}>
            {post.category.toUpperCase()}
          </span>
        </div>

        {/* Description preview */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {post.description}
        </p>

        {/* Footer row */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-neon/20 border border-neon/30 flex items-center justify-center">
              <span className="text-[9px] font-display text-neon">
                {(authorProfile?.username ?? '?').slice(0, 1).toUpperCase()}
              </span>
            </div>
            <span className="text-xs text-muted-foreground font-display">
              {authorProfile?.username ?? 'Loading...'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="w-3.5 h-3.5" />
              {post.comments.length}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              {timeAgo(post.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function MechanicsHelp() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const [showPostModal, setShowPostModal] = useState(false);

  const { data: posts, isLoading } = useGetAllMechanicsPosts();

  // Sort newest first
  const sortedPosts = [...(posts ?? [])].sort((a, b) => {
    return Number(b.createdAt) - Number(a.createdAt);
  });

  const handleFabClick = () => {
    if (!isAuthenticated) {
      toast.info('Login to post an issue!');
      return;
    }
    setShowPostModal(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="relative px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <Wrench className="w-6 h-6 text-neon" />
          <h1 className="font-display text-3xl tracking-widest neon-text">MECHANICS HELP</h1>
        </div>
        <p className="text-sm text-muted-foreground pl-9">Post your car issues and get help from the community</p>
      </div>

      {/* Content */}
      <div className="px-4 pb-28 space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/40 p-4 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex justify-between pt-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))
        ) : sortedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-neon/10 border border-neon/20 flex items-center justify-center mb-4">
              <Wrench className="w-8 h-8 text-neon/60" />
            </div>
            <h3 className="font-display text-lg tracking-wider text-foreground mb-2">NO ISSUES YET</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Be the first to post a mechanics issue and get help from fellow racers!
            </p>
            {isAuthenticated && (
              <button
                onClick={() => setShowPostModal(true)}
                className="mt-6 font-display tracking-wider text-sm px-5 py-2.5 rounded-lg bg-neon text-primary-foreground hover:bg-neon/90 neon-glow transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                POST AN ISSUE
              </button>
            )}
            {!isAuthenticated && (
              <div className="mt-6 flex items-center gap-2 px-4 py-2.5 rounded-lg border border-neon/30 bg-neon/5">
                <LogIn className="w-4 h-4 text-neon" />
                <span className="text-xs text-neon font-display tracking-wide">LOGIN TO POST AN ISSUE</span>
              </div>
            )}
          </div>
        ) : (
          sortedPosts.map((post) => (
            <PostCard key={post.id.toString()} post={post} />
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={handleFabClick}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-neon text-primary-foreground shadow-lg neon-glow flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        aria-label="Post an issue"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Post Issue Modal */}
      <PostIssueModal
        open={showPostModal}
        onClose={() => setShowPostModal(false)}
      />
    </div>
  );
}
