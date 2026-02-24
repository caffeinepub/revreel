import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Plus, Wrench, Calendar, Layers } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetAllBuildLogs, useGetUserProfile } from '../hooks/useQueries';
import { BuildLog } from '../backend';
import StartBuildLogModal from '../components/StartBuildLogModal';

function BuildLogCard({ log, onClick }: { log: BuildLog; onClick: () => void }) {
  const { data: author } = useGetUserProfile(log.authorId.toString());
  const date = new Date(Number(log.createdAt) / 1_000_000).toLocaleDateString();

  return (
    <div
      onClick={onClick}
      className="bg-card/60 backdrop-blur border border-border hover:border-neon-orange/50 rounded-xl p-4 cursor-pointer transition-all hover:shadow-neon group"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-display font-bold text-foreground group-hover:text-neon-orange transition-colors line-clamp-1">
          {log.title}
        </h3>
      </div>
      <p className="text-neon-orange text-sm font-semibold mb-2">
        {log.carYear} {log.carMake} {log.carModel}
      </p>
      <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{log.description}</p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Layers className="w-3.5 h-3.5" />
          <span>{log.stages.length} stages</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>{date}</span>
        </div>
      </div>
      {author && (
        <div className="mt-2 pt-2 border-t border-border/50 flex items-center gap-2">
          {author.avatarUrl ? (
            <img src={author.avatarUrl} alt={author.username} className="w-5 h-5 rounded-full object-cover" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-neon-orange/20 flex items-center justify-center">
              <Wrench className="w-3 h-3 text-neon-orange" />
            </div>
          )}
          <span className="text-xs text-muted-foreground">{author.username}</span>
        </div>
      )}
    </div>
  );
}

export default function BuildLogs() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: buildLogs, isLoading } = useGetAllBuildLogs();
  const [showModal, setShowModal] = useState(false);

  const sorted = buildLogs
    ? [...buildLogs].sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
    : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <Wrench className="w-6 h-6 text-neon-orange" />
          Build Logs
        </h1>
        <p className="text-sm text-muted-foreground">{sorted.length} builds</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 rounded-xl bg-card/50 animate-pulse border border-border" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16">
          <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">No build logs yet</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Be the first to document your build!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sorted.map(log => (
            <BuildLogCard
              key={String(log.id)}
              log={log}
              onClick={() => navigate({ to: '/builds/$buildId', params: { buildId: String(log.id) } })}
            />
          ))}
        </div>
      )}

      {identity && (
        <button
          onClick={() => setShowModal(true)}
          className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-neon-orange text-black flex items-center justify-center shadow-neon hover:bg-neon-yellow transition-colors z-40"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      <StartBuildLogModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
