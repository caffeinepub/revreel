import React, { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import {
  useGetBuildLogById,
  useAddBuildStage,
  useDeleteBuildLog,
  useGetUserProfile,
  type BuildLog,
  type BuildStage,
} from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import AuthGuard from '../components/AuthGuard';
import { Loader2, Plus, Trash2, ArrowLeft, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function BuildLogDetails() {
  const { buildId } = useParams({ strict: false }) as { buildId: string };
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();

  const id = Number(buildId);
  const { data: log, isLoading } = useGetBuildLogById(id);
  const { data: authorProfile } = useGetUserProfile(log?.authorId?.toString() || '');
  const addStage = useAddBuildStage();
  const deleteBuildLog = useDeleteBuildLog();

  const [showAddStage, setShowAddStage] = useState(false);
  const [stageTitle, setStageTitle] = useState('');
  const [stageDesc, setStageDesc] = useState('');
  const [stageImage, setStageImage] = useState('');

  const myPrincipal = identity?.getPrincipal().toString();
  const isOwner = log?.authorId?.toString() === myPrincipal;

  const handleAddStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!log || !stageTitle.trim()) return;
    await addStage.mutateAsync({
      buildId: Number(log.id),
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
    if (confirm('Delete this build log?')) {
      await deleteBuildLog.mutateAsync({ buildId: Number(log.id) });
      navigate({ to: '/builds' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!log) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-muted-foreground">
        Build log not found.
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Back */}
        <button
          onClick={() => navigate({ to: '/builds' })}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Builds
        </button>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="font-display text-2xl font-black text-primary neon-text">{log.title}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {log.carYear} {log.carMake} {log.carModel}
            </p>
            {authorProfile && (
              <p className="text-xs text-muted-foreground mt-0.5">by {authorProfile.username}</p>
            )}
          </div>
          {isOwner && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleteBuildLog.isPending}
            >
              {deleteBuildLog.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>

        {log.description && (
          <p className="text-foreground/80 text-sm mb-6">{log.description}</p>
        )}

        {/* Stages */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <Wrench className="w-5 h-5 text-primary" />
              Build Stages ({log.stages.length})
            </h2>
            {isOwner && (
              <Button
                size="sm"
                onClick={() => setShowAddStage(!showAddStage)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Stage
              </Button>
            )}
          </div>

          {showAddStage && (
            <form onSubmit={handleAddStage} className="p-4 rounded-lg bg-card border border-border space-y-3">
              <div className="space-y-1">
                <Label>Stage Title *</Label>
                <Input
                  value={stageTitle}
                  onChange={(e) => setStageTitle(e.target.value)}
                  placeholder="e.g. Engine Swap"
                  className="bg-muted border-border"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea
                  value={stageDesc}
                  onChange={(e) => setStageDesc(e.target.value)}
                  placeholder="Describe this stage..."
                  className="bg-muted border-border resize-none"
                  rows={2}
                />
              </div>
              <div className="space-y-1">
                <Label>Image URL (optional)</Label>
                <Input
                  value={stageImage}
                  onChange={(e) => setStageImage(e.target.value)}
                  placeholder="https://..."
                  className="bg-muted border-border"
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddStage(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={addStage.isPending}
                >
                  {addStage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Stage'}
                </Button>
              </div>
            </form>
          )}

          {log.stages.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No stages yet.</p>
          ) : (
            log.stages.map((stage: BuildStage, index: number) => (
              <div key={stage.id.toString()} className="p-4 rounded-lg bg-card border border-border">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm">{stage.title}</h3>
                    {stage.description && (
                      <p className="text-muted-foreground text-xs mt-1">{stage.description}</p>
                    )}
                    {stage.imageUrl && (
                      <img
                        src={stage.imageUrl}
                        alt={stage.title}
                        className="mt-2 rounded-lg w-full max-h-48 object-cover"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
