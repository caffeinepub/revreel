import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Plus, Wrench, Calendar, Car } from 'lucide-react';
import { type BuildLog, useGetAllBuildLogs } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import StartBuildLogModal from '../components/StartBuildLogModal';
import AuthGuard from '../components/AuthGuard';

function BuildLogCard({ log }: { log: BuildLog }) {
  const createdAt = new Date(Number(log.createdAt) / 1_000_000);

  return (
    <Link to="/builds/$buildId" params={{ buildId: String(log.id) }} className="block">
      <div className="bg-card border border-border rounded-2xl p-4 hover:border-neon-orange/40 transition-colors">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-neon-orange/10 flex items-center justify-center flex-shrink-0">
            <Car size={22} className="text-neon-orange" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground text-base leading-tight line-clamp-1">{log.title}</h3>
            <p className="text-muted-foreground text-sm mt-0.5">
              {log.carYear} {log.carMake} {log.carModel}
            </p>
          </div>
        </div>

        {log.description && (
          <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{log.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Wrench size={12} />
            <span>{log.stages.length} stage{log.stages.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>{createdAt.toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function BuildLogs() {
  const [showModal, setShowModal] = useState(false);
  const { data: buildLogs = [], isLoading } = useGetAllBuildLogs();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background pb-24 pt-20">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-display font-bold text-foreground">Build Logs</h1>
            {isAuthenticated && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-neon-orange text-black font-bold text-base hover:bg-neon-orange/90 transition-colors"
              >
                <Plus size={18} />
                New Build
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-neon-orange border-t-transparent rounded-full animate-spin" />
            </div>
          ) : buildLogs.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Wrench size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No build logs yet</p>
              <p className="text-sm mt-1">Be the first to document your build!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {buildLogs.map(log => (
                <BuildLogCard key={log.id} log={log} />
              ))}
            </div>
          )}
        </div>

        {showModal && (
          <StartBuildLogModal open={showModal} onClose={() => setShowModal(false)} />
        )}
      </div>
    </AuthGuard>
  );
}
