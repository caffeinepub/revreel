import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { useGetComments, useAddComment } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Comment } from '../backend';

interface CommentsPanelProps {
  videoId: string;
  onClose: () => void;
}

export default function CommentsPanel({ videoId, onClose }: CommentsPanelProps) {
  const { identity } = useInternetIdentity();
  const { data: comments = [], isLoading } = useGetComments(videoId);
  const addComment = useAddComment();
  const [text, setText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !identity) return;
    try {
      await addComment.mutateAsync({ videoId, text: text.trim() });
      setText('');
    } catch {
      // ignore
    }
  };

  const sorted = [...comments].sort(
    (a: Comment, b: Comment) => Number(b.timestamp) - Number(a.timestamp),
  );

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-black/90">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 className="text-white font-bold text-base">Comments ({comments.length})</h3>
        <button onClick={onClose} className="text-white/70 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
        {isLoading ? (
          <p className="text-white/50 text-sm text-center py-4">Loading…</p>
        ) : sorted.length === 0 ? (
          <p className="text-white/50 text-sm text-center py-4">No comments yet. Be the first!</p>
        ) : (
          sorted.map((comment: Comment) => (
            <div key={String(comment.id)} className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-neon-orange/20 flex items-center justify-center shrink-0">
                <span className="text-neon-orange text-xs font-bold">
                  {comment.authorName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-neon-orange text-xs font-semibold">{comment.authorName}</p>
                <p className="text-white text-sm">{comment.text}</p>
                <p className="text-white/40 text-xs mt-0.5">
                  {new Date(Number(comment.timestamp) / 1_000_000).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-white/10 px-4 py-3">
        {identity ? (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment…"
              className="flex-1 bg-white/10 text-white placeholder-white/40 rounded-full px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-neon-orange"
            />
            <button
              type="submit"
              disabled={!text.trim() || addComment.isPending}
              className="bg-neon-orange text-black rounded-full p-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <p className="text-white/50 text-sm text-center">Log in to comment</p>
        )}
      </div>
    </div>
  );
}
