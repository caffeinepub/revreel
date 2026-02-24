import React, { useState } from 'react';
import { useParams, useNavigate, Link } from '@tanstack/react-router';
import { ArrowLeft, Wrench, Clock, Trash2, Loader2, Send } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  useGetMechanicsPostById,
  useGetUserProfile,
  useAddMechanicsComment,
  useDeleteMechanicsPost,
} from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { type MechanicsComment } from '../backend';
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

function CommentItem({ comment }: { comment: MechanicsComment }) {
  const { data: authorProfile } = useGetUserProfile(comment.authorId.toString());
  return (
    <div className="flex gap-3 py-3 border-b border-border/30 last:border-0">
      <div className="w-8 h-8 rounded-full bg-neon/10 border border-neon/20 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[10px] font-display text-neon">
          {(authorProfile?.username ?? '?').slice(0, 1).toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Link
            to="/profile/$userId"
            params={{ userId: comment.authorId.toString() }}
            className="text-xs font-display text-neon hover:text-neon/80 transition-colors"
          >
            {authorProfile?.username ?? 'Loading...'}
          </Link>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            {timeAgo(comment.timestamp)}
          </span>
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed">{comment.text}</p>
      </div>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-sm border-b border-border/40 px-4 py-3 flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-full" />
        <Skeleton className="h-5 w-48 flex-1" />
      </div>
      <div className="px-4 pt-5 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export default function MechanicsPostDetails() {
  const { postId } = useParams({ from: '/app-layout/mechanics/$postId' });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const currentPrincipal = identity?.getPrincipal().toString();

  const postIdNum = parseInt(postId, 10);
  const { data: post, isLoading } = useGetMechanicsPostById(isNaN(postIdNum) ? undefined : postIdNum);
  const addComment = useAddMechanicsComment();
  const deletePost = useDeleteMechanicsPost();

  const { data: authorProfile } = useGetUserProfile(post?.author.toString() ?? undefined);

  const [commentText, setCommentText] = useState('');
  const [optimisticComments, setOptimisticComments] = useState<MechanicsComment[]>([]);

  const isAuthor = currentPrincipal && post ? post.author.toString() === currentPrincipal : false;
  const categoryColor = post ? (CATEGORY_COLORS[post.category] ?? CATEGORY_COLORS['Other']) : '';

  const allComments = [...(post?.comments ?? []), ...optimisticComments];

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !isAuthenticated) return;

    const text = commentText.trim();
    setCommentText('');

    const optimistic: MechanicsComment = {
      id: BigInt(Date.now()),
      postId: BigInt(postIdNum),
      authorId: identity!.getPrincipal(),
      text,
      timestamp: BigInt(Date.now()) * BigInt(1_000_000),
    };
    setOptimisticComments((prev) => [...prev, optimistic]);

    try {
      await addComment.mutateAsync({ postId: postIdNum, text });
      setOptimisticComments([]);
    } catch {
      toast.error('Failed to post comment. Please try again.');
      setOptimisticComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      setCommentText(text);
    }
  };

  const handleDelete = async () => {
    if (!isAuthor) return;
    try {
      await deletePost.mutateAsync(postIdNum);
      toast.success('Post deleted.');
      navigate({ to: '/mechanics' });
    } catch {
      toast.error('Failed to delete post.');
    }
  };

  if (isLoading) {
    return <DetailsSkeleton />;
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6">
        <Wrench className="w-12 h-12 text-muted-foreground" />
        <h2 className="font-display text-2xl text-foreground">POST NOT FOUND</h2>
        <p className="text-muted-foreground text-center">This issue post doesn't exist or was removed.</p>
        <Link to="/mechanics" className="text-neon font-display text-sm tracking-wider hover:underline">
          ← BACK TO MECHANICS
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-sm border-b border-border/40 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate({ to: '/mechanics' })}
          className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <span className="font-display text-sm text-foreground truncate flex-1">MECHANICS HELP</span>
        {isAuthor && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={deletePost.isPending}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            {deletePost.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>

      {/* Post content */}
      <div className="px-4 pt-5 pb-6">
        <div className="flex items-start gap-3 mb-4">
          <span className={`px-2 py-0.5 rounded-full text-xs font-display border ${categoryColor}`}>
            {post.category}
          </span>
        </div>

        <h1 className="font-display text-2xl text-foreground mb-3 leading-tight">{post.title}</h1>

        <div className="flex items-center gap-3 mb-4">
          <Link
            to="/profile/$userId"
            params={{ userId: post.author.toString() }}
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-full bg-neon/10 border border-neon/20 flex items-center justify-center">
              <span className="text-[10px] font-display text-neon">
                {(authorProfile?.username ?? '?').slice(0, 1).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-xs font-display text-neon group-hover:text-neon/80 transition-colors">
                {authorProfile?.username ?? 'Loading...'}
              </p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeAgo(post.createdAt)}
              </p>
            </div>
          </Link>
        </div>

        <p className="text-foreground/90 text-sm leading-relaxed whitespace-pre-wrap">{post.description}</p>
      </div>

      {/* Comments */}
      <div className="px-4 pb-6">
        <h3 className="font-display text-sm tracking-wider text-muted-foreground mb-3">
          REPLIES ({allComments.length})
        </h3>
        {allComments.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">
            No replies yet. Be the first to help!
          </p>
        ) : (
          <div>
            {allComments.map((comment) => (
              <CommentItem key={comment.id.toString()} comment={comment} />
            ))}
          </div>
        )}
      </div>

      {/* Comment input */}
      {isAuthenticated ? (
        <div className="fixed bottom-16 left-0 right-0 px-4 pb-3 bg-background/95 backdrop-blur-sm border-t border-border/40 z-30">
          <form onSubmit={handleSubmitComment} className="flex gap-2 pt-3">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Share your advice..."
              className="flex-1 bg-card/60 border-border/60 resize-none text-sm min-h-[40px] max-h-[100px]"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitComment(e as unknown as React.FormEvent);
                }
              }}
            />
            <Button
              type="submit"
              disabled={!commentText.trim() || addComment.isPending}
              size="icon"
              className="bg-neon text-primary-foreground hover:bg-neon/90 shrink-0 shadow-neon-sm"
            >
              {addComment.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      ) : (
        <div className="fixed bottom-16 left-0 right-0 px-4 pb-3 bg-background/95 backdrop-blur-sm border-t border-border/40 z-30">
          <p className="text-center text-sm text-muted-foreground pt-3">
            <Link to="/feed" className="text-neon hover:underline">Login</Link> to reply
          </p>
        </div>
      )}
    </div>
  );
}
