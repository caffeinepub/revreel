import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Wrench, Plus, Trash2, Calendar, ChevronLeft } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetBuildLogById, useAddBuildStage, useDeleteBuildLog, useGetUserProfile } from '../hooks/useQueries';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function BuildLogDetails() {
  const { buildId } = useParams({ from: '/app-layout/builds/$buildId' });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const id = parseInt(buildId, 10);
  const { data: log, isLoading } = useGetBuildLogById(isNaN(id) ? undefined : id);
  const { data: author } = useGetUserProfile(log?.authorId.toString());
  const addStage = useAddBuildStage();
  const deleteBuildLog = useDeleteBuildLog();

  const [showAddStage, setShowAddStage] = useState(false);
  const [stageForm, setStageForm] = useState({ title: '', description: '', imageUrl: '' });

  const currentUserId = identity?.getPrincipal().toString();
  const isOwner = log && currentUserId && log.authorId.toString() === currentUserId;

  const handleAddStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!log) return;
    try {
      await addStage.mutateAsync({
        buildLogId: Number(log.id),
        stageTitle: stageForm.title,
        stageDescription: stageForm.description,
        imageUrl: stageForm.imageUrl,
      });
      setStageForm({ title: '', description: '', imageUrl: '' });
      setShowAddStage(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!log || !confirm('Delete this build log?')) return;
    try {
      await deleteBuildLog.mutateAsync(Number(log.id));
      navigate({ to: '/builds' });
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="h-8 w-48 bg-card/50 animate-pulse rounded" />
        <div className="h-32 bg-card/50 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!log) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-muted-foreground">Build log not found</p>
        <button onClick={() => navigate({ to: '/builds' })} className="mt-4 text-neon-orange hover:underline text-sm">
          Back to Build Logs
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button
        onClick={() => navigate({ to: '/builds' })}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4 text-sm transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Builds
      </button>

      {/* Header */}
      <div className="bg-card/60 backdrop-blur border border-border rounded-xl p-5 mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">{log.title}</h1>
        <p className="text-neon-orange font-semibold text-lg mb-2">
          {log.carYear} {log.carMake} {log.carModel}
        </p>
        <p className="text-muted-foreground text-sm mb-3">{log.description}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {author?.avatarUrl && (
              <img src={author.avatarUrl} alt={author.username} className="w-5 h-5 rounded-full object-cover" />
            )}
            <span>by {author?.username ?? '...'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(Number(log.createdAt) / 1_000_000).toLocaleDateString()}</span>
          </div>
        </div>

        {isOwner && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
            <Button
              onClick={() => setShowAddStage(!showAddStage)}
              className="flex-1 bg-neon-orange text-black hover:bg-neon-yellow font-bold text-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Stage
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteBuildLog.isPending}
              variant="outline"
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Add Stage Form */}
      {showAddStage && (
        <div className="bg-card/60 backdrop-blur border border-neon-orange/40 rounded-xl p-4 mb-6">
          <h3 className="font-display font-bold text-foreground mb-3">Add Build Stage</h3>
          <form onSubmit={handleAddStage} className="space-y-3">
            <div>
              <Label className="text-muted-foreground text-sm">Stage Title</Label>
              <Input
                value={stageForm.title}
                onChange={e => setStageForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Engine Removal"
                className="bg-background border-border mt-1"
                required
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Description</Label>
              <Textarea
                value={stageForm.description}
                onChange={e => setStageForm(f => ({ ...f, description: e.target.value }))}
                placeholder="What did you do in this stage?"
                className="bg-background border-border mt-1 resize-none"
                rows={2}
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Image URL (optional)</Label>
              <Input
                value={stageForm.imageUrl}
                onChange={e => setStageForm(f => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://..."
                className="bg-background border-border mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAddStage(false)} className="flex-1 border-border text-sm">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addStage.isPending || !stageForm.title}
                className="flex-1 bg-neon-orange text-black hover:bg-neon-yellow font-bold text-sm"
              >
                {addStage.isPending ? 'Adding...' : 'Add Stage'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Timeline */}
      <div>
        <h2 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-neon-orange" />
          Build Timeline ({log.stages.length} stages)
        </h2>
        {log.stages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No stages yet. {isOwner ? 'Add your first stage above!' : ''}
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-neon-orange/20" />
            <div className="space-y-4">
              {log.stages.map((stage) => (
                <div key={String(stage.id)} className="relative pl-10">
                  <div className="absolute left-2.5 top-3 w-3 h-3 rounded-full bg-neon-orange border-2 border-background" />
                  <div className="bg-card/60 backdrop-blur border border-border rounded-xl p-4">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-semibold text-foreground">{stage.title}</h4>
                      <span className="text-xs text-muted-foreground">
                        {new Date(Number(stage.createdAt) / 1_000_000).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{stage.description}</p>
                    {stage.imageUrl && (
                      <img
                        src={stage.imageUrl}
                        alt={stage.title}
                        className="mt-3 rounded-lg w-full object-cover max-h-48"
                        onError={e => (e.currentTarget.style.display = 'none')}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
