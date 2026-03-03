import { useState } from 'react';
import { useParams, Link, useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useGetMechanicsPostDetails,
  useAddMechanicsComment,
  useDeleteMechanicsPost,
} from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { Wrench, ChevronLeft, MessageCircle, Loader2, Trash2 } from 'lucide-react';

export default function MechanicsPostDetails() {
  const params = useParams({ strict: false }) as { postId?: string };
  const postId = params.postId ?? '';
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const [commentText, setCommentText] = useState('');

  const { data: post, isLoading } = useGetMechanicsPostDetails(Number(postId));
  const addComment = useAddMechanicsComment();
  const deletePost = useDeleteMechanicsPost();

  const currentUserId = identity?.getPrincipal().toString() ?? '';
  const isAuthor = post && currentUserId && post.author === currentUserId;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !identity) return;
    await addComment.mutateAsync({ postId: Number(postId), text: commentText.trim() });
    setCommentText('');
  };

  const handleDelete = async () => {
    if (!post || !confirm('Delete this post?')) return;
    await deletePost.mutateAsync(post.id);
    navigate({ to: '/mechanics' });
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Wrench className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-display font-bold mb-2">Post Not Found</h2>
        <Link to="/mechanics" className="text-primary hover:underline">
          Back to Mechanics Help
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/mechanics" className="p-2 rounded hover:bg-muted transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-display font-bold truncate">{post.title}</h1>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {post.category}
          </span>
        </div>
        {isAuthor && (
          <button
            onClick={handleDelete}
            disabled={deletePost.isPending}
            className="p-2 rounded hover:bg-destructive/10 text-destructive transition-colors"
          >
            {deletePost.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <p className="text-sm text-foreground">{post.description}</p>
        <p className="text-xs text-muted-foreground mt-2">
          {new Date(post.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div>
        <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          Replies ({post.comments.length})
        </h2>

        {identity && (
          <form onSubmit={handleAddComment} className="mb-4 flex gap-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a reply..."
              className="flex-1 bg-muted border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={addComment.isPending || !commentText.trim()}
              className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {addComment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Reply'
              )}
            </button>
          </form>
        )}

        {post.comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No replies yet. Be the first to help!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {post.comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-card border border-border rounded-xl p-3"
              >
                <p className="text-sm text-foreground">{comment.text}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(comment.timestamp).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
