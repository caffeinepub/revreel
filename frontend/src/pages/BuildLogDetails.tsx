import { useState } from 'react';
import { useParams, useNavigate, Link } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetBuildLogDetails, useAddBuildStage, useDeleteBuildLog } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
} from '@/components/ui/alert-dialog';
import { BookOpen, Plus, Trash2, ChevronLeft, Loader2, Calendar, Car } from 'lucide-react';

export default function BuildLogDetails() {
  const params = useParams({ strict: false }) as { logId?: string };
  const logId = params.logId ?? '';
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();

  const { data: log, isLoading } = useGetBuildLogDetails(Number(logId));
  const addStage = useAddBuildStage();
  const deleteBuildLog = useDeleteBuildLog();

  const [showAddStage, setShowAddStage] = useState(false);
  const [stageTitle, setStageTitle] = useState('');
  const [stageDesc, setStageDesc] = useState('');
  const [stageImage, setStageImage] = useState('');

  const currentUserId = identity?.getPrincipal().toString() ?? '';
  const isAuthor = log && currentUserId && log.authorId?.toString() === currentUserId;

  const handleAddStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!log || !stageTitle.trim()) return;
    await addStage.mutateAsync({
      logId: log.id,
      title: stageTitle.trim(),
      description: stageDesc.trim(),
      imageUrl: stageImage.trim(),
    });
    setStageTitle('');
    setStageDesc('');
    setStageImage('');
    setShowAddStage(false);
  };

  const handleDelete = async () => {
    if (!log) return;
    await deleteBuildLog.mutateAsync({ logId: log.id });
    navigate({ to: '/builds' });
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!log) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-display font-bold mb-2">Build Log Not Found</h2>
        <Link to="/builds" className="text-primary hover:underline">
          Back to Build Logs
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/builds" className="p-2 rounded hover:bg-muted transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-display font-bold truncate">{log.title}</h1>
          <p className="text-sm text-muted-foreground">
            {log.carYear} {log.carMake} {log.carModel}
          </p>
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
                  This will permanently delete your build log and all its stages.
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
                    'Delete'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Info */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6 space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Car className="h-4 w-4" />
          <span>
            {log.carYear} {log.carMake} {log.carModel}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Started {new Date(log.createdAt).toLocaleDateString()}</span>
        </div>
        {log.description && (
          <p className="text-sm text-foreground mt-2">{log.description}</p>
        )}
      </div>

      {/* Stages */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg">
            Build Stages ({log.stages.length})
          </h2>
          {isAuthor && (
            <button
              onClick={() => setShowAddStage(!showAddStage)}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Stage
            </button>
          )}
        </div>

        {showAddStage && (
          <form
            onSubmit={handleAddStage}
            className="bg-card border border-border rounded-xl p-4 mb-4 space-y-3"
          >
            <div>
              <Label htmlFor="stageTitle">Stage Title *</Label>
              <Input
                id="stageTitle"
                value={stageTitle}
                onChange={e => setStageTitle(e.target.value)}
                placeholder="e.g. Engine Swap"
                required
              />
            </div>
            <div>
              <Label htmlFor="stageDesc">Description</Label>
              <Textarea
                id="stageDesc"
                value={stageDesc}
                onChange={e => setStageDesc(e.target.value)}
                placeholder="Describe what you did..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="stageImage">Image URL (optional)</Label>
              <Input
                id="stageImage"
                value={stageImage}
                onChange={e => setStageImage(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddStage(false)}
                className="flex-1 py-2 rounded border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addStage.isPending || !stageTitle.trim()}
                className="flex-1 py-2 rounded bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {addStage.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  'Add Stage'
                )}
              </button>
            </div>
          </form>
        )}

        {log.stages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No stages yet. Add your first build stage!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {log.stages.map((stage, index) => (
              <div
                key={stage.id}
                className="bg-card border border-border rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <h3 className="font-semibold">{stage.title}</h3>
                </div>
                {stage.description && (
                  <p className="text-sm text-muted-foreground mb-2">{stage.description}</p>
                )}
                {stage.imageUrl && (
                  <img
                    src={stage.imageUrl}
                    alt={stage.title}
                    className="w-full rounded-lg object-cover max-h-48"
                    onError={e => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(stage.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
