import { useState } from "react";
import { useParams, useNavigate, Link } from "@tanstack/react-router";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetBuildLog,
  useAddBuildStage,
  useDeleteBuildLog,
} from "../hooks/useQueries";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  BookOpen,
  Plus,
  Trash2,
  ChevronLeft,
  Loader2,
  Calendar,
  Car,
} from "lucide-react";

export default function BuildLogDetails() {
  const { buildId } = useParams({ from: "/app-layout/builds/$buildId" });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();

  const { data: log, isLoading } = useGetBuildLog(Number(buildId));
  const addStage = useAddBuildStage();
  const deleteBuildLog = useDeleteBuildLog();

  const [showAddStage, setShowAddStage] = useState(false);
  const [stageTitle, setStageTitle] = useState("");
  const [stageDesc, setStageDesc] = useState("");
  const [stageImage, setStageImage] = useState("");

  const currentUserId = identity?.getPrincipal().toString() ?? "";
  const isAuthor =
    log && currentUserId && log.authorId?.toString() === currentUserId;

  const handleAddStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!log || !stageTitle.trim()) return;
    await addStage.mutateAsync({
      buildLogId: Number(log.id),
      stage: {
        title: stageTitle.trim(),
        description: stageDesc.trim(),
        imageUrl: stageImage.trim(),
      },
    });
    setStageTitle("");
    setStageDesc("");
    setStageImage("");
    setShowAddStage(false);
  };

  const handleDelete = async () => {
    if (!log) return;
    await deleteBuildLog.mutateAsync({ id: Number(log.id) });
    navigate({ to: "/builds" });
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

  if (!log) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-display font-bold mb-2">
          Build Log Not Found
        </h2>
        <Link
          to="/builds"
          className="text-primary hover:underline"
        >
          Back to Build Logs
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/builds"
          className="p-2 rounded hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-display font-bold truncate">
            {log.title}
          </h1>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
            <span className="flex items-center gap-1">
              <Car className="h-3 w-3" />
              {log.carYear} {log.carMake} {log.carModel}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(Number(log.createdAt) / 1_000_000).toLocaleDateString()}
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
                <AlertDialogTitle>Delete Build Log?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. All stages will be permanently
                  deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteBuildLog.isPending ? (
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
      {log.description && (
        <p className="text-muted-foreground text-sm mb-6">{log.description}</p>
      )}

      {/* Stages */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-semibold">
            Build Stages ({(log.stages ?? []).length})
          </h2>
          {isAuthor && (
            <button
              onClick={() => setShowAddStage(!showAddStage)}
              className="flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Plus className="h-4 w-4" />
              Add Stage
            </button>
          )}
        </div>

        {/* Add Stage Form */}
        {showAddStage && (
          <form
            onSubmit={handleAddStage}
            className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border"
          >
            <div className="space-y-1.5">
              <Label>Stage Title *</Label>
              <Input
                value={stageTitle}
                onChange={(e) => setStageTitle(e.target.value)}
                placeholder="e.g. Engine Swap"
                disabled={addStage.isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={stageDesc}
                onChange={(e) => setStageDesc(e.target.value)}
                placeholder="Describe what you did..."
                rows={3}
                disabled={addStage.isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Image URL (optional)</Label>
              <Input
                value={stageImage}
                onChange={(e) => setStageImage(e.target.value)}
                placeholder="https://..."
                disabled={addStage.isPending}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddStage(false)}
                className="flex-1 py-2 rounded border border-border text-sm hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addStage.isPending || !stageTitle.trim()}
                className="flex-1 py-2 rounded bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {addStage.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Add Stage"
                )}
              </button>
            </div>
          </form>
        )}

        {/* Stage List */}
        {(log.stages ?? []).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No stages yet. Add your first build stage!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(log.stages as any[]).map((stage: any, idx: number) => (
              <div
                key={stage.id ?? idx}
                className="bg-muted/20 rounded-xl p-4 border border-border"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{stage.title}</h3>
                    {stage.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {stage.description}
                      </p>
                    )}
                    {stage.imageUrl && (
                      <img
                        src={stage.imageUrl}
                        alt={stage.title}
                        className="mt-2 rounded-lg max-h-48 object-cover w-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
