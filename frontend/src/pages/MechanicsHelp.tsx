import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useGetMechanicsPosts } from "../hooks/useQueries";
import type { MechanicsPost } from "../hooks/useQueries";
import { Skeleton } from "@/components/ui/skeleton";
import PostIssueModal from "../components/PostIssueModal";
import { Wrench, Plus, MessageCircle, Clock } from "lucide-react";

export default function MechanicsHelp() {
  const { data: posts = [], isLoading } = useGetMechanicsPosts();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">Mechanics Help</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Post Issue
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : (posts as MechanicsPost[]).length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Wrench className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No issues posted yet</p>
          <p className="text-sm">
            Ask the community for help with your car problems!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {(posts as MechanicsPost[]).map((post) => (
            <Link
              key={post.id}
              to="/mechanics/$postId"
              params={{ postId: String(post.id) }}
              className="block bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-base truncate">
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                      {post.category}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(
                        Number(post.createdAt) / 1_000_000
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  {post.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {post.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {(post.comments ?? []).length}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <PostIssueModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
