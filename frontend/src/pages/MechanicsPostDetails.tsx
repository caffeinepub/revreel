import { useState } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetMechanicsPost,
  usePostMechanicsComment,
  useDeleteMechanicsPost,
} from "../hooks/useQueries";
import type { MechanicsComment } from "../hooks/useQueries";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Wrench,
  ChevronLeft,
  Trash2,
  Send,
  Loader2,
  Clock,
  MessageCircle,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export default function MechanicsPostDetails() {
  const { postId } = useParams({ from: "/app-layout/mechanics/$postId" });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();

  const { data: post, isLoading } = useGetMechanicsPost(Number(postId));
  const addComment = usePostMechanicsComment();
  const deletePost = useDeleteMechanicsPost();

  const [commentText, setCommentText] = useState("");

  const currentUserId = identity?.getPrincipal().toString() ?? "";
  const isAuthor =
    post && currentUserId && (post as any).author?.toString() === currentUserId;

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !post) return;
    await addComment.mutateAsync({
      postId: Number((post as any).id),
      text: commentText.trim(),
    });
    setCommentText("");
  };

  const handleDelete = async () => {
    if (!post) return;
    await deletePost.mutateAsync({ postId: Number((post as any).id) });
    navigate({ to: "/mechanics" });
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-32 w-full" />
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

  const p = post as any;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/mechanics"
          className="p-2 rounded hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-display font-bold truncate">{p.title}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
              {p.category}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(Number(p.createdAt) / 1_000_000).toLocaleDateString()}
            </span>
          </div>
        </div>
        {isAuthor && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="p-2 rounded hover:bg-destructive/10 text-destructive transition-colors">
                <Trash2 className="h-5 w-5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Post?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deletePost.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Description */}
      {p.description && (
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <p className="text-sm">{p.description}</p>
        </div>
      )}

      {/* Comments */}
      <div className="mb-4">
        <h2 className="font-display font-semibold mb-3 flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          Replies ({(p.comments ?? []).length})
        </h2>

        {(p.comments ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No replies yet. Be the first to help!
          </p>
        ) : (
          <div className="space-y-3">
            {(p.comments as MechanicsComment[]).map((comment, idx) => (
              <div
                key={comment.id ?? idx}
                className="bg-muted/20 rounded-xl p-3 border border-border"
              >
                <p className="text-sm">{comment.text}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(
                    Number(comment.timestamp) / 1_000_000
                  ).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Comment */}
      {identity && (
        <form onSubmit={handleSubmitComment} className="flex gap-2">
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Share your advice..."
            rows={2}
            className="flex-1 resize-none"
            disabled={addComment.isPending}
          />
          <button
            type="submit"
            disabled={addComment.isPending || !commentText.trim()}
            className="self-end p-2.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {addComment.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
      )}
    </div>
  );
}
