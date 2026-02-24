import React, { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Send, Trash2, Wrench, Loader2 } from 'lucide-react';
import { type MechanicsComment, useGetMechanicsPostById, useAddMechanicsComment, useDeleteMechanicsPost } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

function timeAgo(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function MechanicsPostDetails() {
  const { postId } = useParams({ from: '/app-layout/mechanics/$postId' });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const currentUserId = identity?.getPrincipal().toString();

  const [commentText, setCommentText] = useState('');

  const { data: post, isLoading } = useGetMechanicsPostById(Number(postId));
  const addComment = useAddMechanicsComment();
  const deletePost = useDeleteMechanicsPost();

  const isAuthor = post && currentUserId
    ? post.author.toString() === currentUserId
    : false;

  const handleSubmitComment = async () => {
    if (!commentText.trim() || addComment.isPending) return;
    await addComment.mutateAsync({ postId: Number(postId), text: commentText.trim() });
    setCommentText('');
  };

  const handleDelete = async () => {
    if (!isAuthor) return;
    await deletePost.mutateAsync({ postId: Number(postId) });
    navigate({ to: '/mechanics' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neon-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Post not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 pt-20">
      <div className="max-w-lg mx-auto px-4">
        {/* Back */}
        <button
          onClick={() => navigate({ to: '/mechanics' })}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-5 py-2"
        >
          <ArrowLeft size={20} />
          <span className="text-base font-medium">Back</span>
        </button>

        {/* Post */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl bg-neon-orange/10 flex items-center justify-center flex-shrink-0">
              <Wrench size={20} className="text-neon-orange" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-foreground text-xl leading-tight">{post.title}</h1>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-neon-orange/20 text-neon-orange text-xs font-bold">
                {post.category}
              </span>
            </div>
            {isAuthor && (
              <button
                onClick={handleDelete}
                disabled={deletePost.isPending}
                className="w-11 h-11 flex items-center justify-center rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex-shrink-0"
              >
                {deletePost.isPending ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
              </button>
            )}
          </div>
          <p className="text-foreground/80 text-base leading-relaxed mb-3">{post.description}</p>
          <p className="text-muted-foreground text-sm">{timeAgo(post.createdAt)}</p>
        </div>

        {/* Comments */}
        <h2 className="font-bold text-foreground text-lg mb-3">
          {post.comments.length} {post.comments.length === 1 ? 'Reply' : 'Replies'}
        </h2>

        <div className="space-y-3 mb-5">
          {post.comments.map((comment: MechanicsComment) => (
            <div key={String(comment.id)} className="bg-card border border-border rounded-xl p-4">
              <p className="text-foreground text-sm leading-relaxed mb-2">{comment.text}</p>
              <p className="text-muted-foreground text-xs">{timeAgo(comment.timestamp)}</p>
            </div>
          ))}
        </div>

        {/* Add comment */}
        {identity && (
          <div className="flex gap-3">
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Share your knowledge..."
              rows={2}
              className="flex-1 px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-neon-orange resize-none text-base"
            />
            <button
              onClick={handleSubmitComment}
              disabled={!commentText.trim() || addComment.isPending}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-neon-orange text-black hover:bg-neon-orange/90 disabled:opacity-50 transition-colors flex-shrink-0 self-end"
            >
              {addComment.isPending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
