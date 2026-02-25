import React, { useState, useRef } from 'react';
import { useGetComments, useAddComment, type Comment } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { X, Send, Loader2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CommentsPanelProps {
  videoId: string;
  onClose: () => void;
}

export default function CommentsPanel({ videoId, onClose }: CommentsPanelProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { identity } = useInternetIdentity();

  const { data: comments = [], isLoading } = useGetComments(videoId);
  const addComment = useAddComment();

  const sortedComments = [...comments].sort((a, b) => {
    return Number(b.timestamp) - Number(a.timestamp);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !identity) return;
    try {
      await addComment.mutateAsync({ videoId, text: text.trim() });
      setText('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  const formatTime = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h3 className="font-display font-bold text-lg">
            Comments {comments.length > 0 && <span className="text-muted-foreground text-sm">({comments.length})</span>}
          </h3>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : sortedComments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <MessageCircle className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">No comments yet. Be the first!</p>
          </div>
        ) : (
          sortedComments.map((comment: Comment) => (
            <div key={comment.id.toString()} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">
                  {(comment.authorName || 'U').slice(0, 1).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm">{comment.authorName || 'Unknown'}</span>
                  <span className="text-xs text-muted-foreground">{formatTime(comment.timestamp)}</span>
                </div>
                <p className="text-sm text-foreground/90 break-words">{comment.text}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      {identity ? (
        <form onSubmit={handleSubmit} className="p-4 border-t border-border flex gap-2">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-muted border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
            maxLength={500}
            disabled={addComment.isPending}
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
            disabled={addComment.isPending || !text.trim()}
          >
            {addComment.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      ) : (
        <div className="p-4 border-t border-border text-center text-sm text-muted-foreground">
          Log in to leave a comment
        </div>
      )}
    </div>
  );
}
