import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';
import { useGetComments, useAddComment } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { type Comment } from '../backend';

interface CommentsPanelProps {
  videoId: string;
  onClose: () => void;
}

export default function CommentsPanel({ videoId, onClose }: CommentsPanelProps) {
  const [text, setText] = useState('');
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: comments, isLoading } = useGetComments(videoId);
  const addComment = useAddComment();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !isAuthenticated) return;
    try {
      await addComment.mutateAsync({ videoId, text: text.trim() });
      setText('');
      toast.success('Comment posted!');
    } catch {
      toast.error('Failed to post comment');
    }
  };

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col justify-end"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-card/95 backdrop-blur-xl rounded-t-2xl border-t border-border max-h-[70%] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-neon" />
            <span className="font-display text-sm text-foreground">
              {comments?.length ?? 0} COMMENTS
            </span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments list */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))
          ) : comments && comments.length > 0 ? (
            [...comments]
              .sort((a, b) => Number(a.timestamp - b.timestamp))
              .map((comment: Comment) => (
                <CommentItem key={comment.id.toString()} comment={comment} />
              ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No comments yet. Be the first!</p>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border flex-shrink-0">
          {isAuthenticated ? (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground text-sm"
                maxLength={300}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!text.trim() || addComment.isPending}
                className="bg-neon text-primary-foreground hover:bg-neon/90 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          ) : (
            <p className="text-center text-muted-foreground text-sm py-2">
              Login to comment
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CommentItem({ comment }: { comment: Comment }) {
  const timeAgo = getTimeAgo(Number(comment.timestamp) / 1_000_000);
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-neon/10 border border-neon/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
        <img
          src="/assets/generated/default-avatar.dim_128x128.png"
          alt="avatar"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-display text-neon">
            @{comment.authorId.toString().slice(0, 8)}...
          </span>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
        <p className="text-sm text-foreground mt-0.5 break-words">{comment.text}</p>
      </div>
    </div>
  );
}

function getTimeAgo(timestampMs: number): string {
  const now = Date.now();
  const diff = now - timestampMs;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}
