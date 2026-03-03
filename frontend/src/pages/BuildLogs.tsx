import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useGetBuildLogs } from '../hooks/useQueries';
import type { BuildLog } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import StartBuildLogModal from '../components/StartBuildLogModal';
import AftermarketAdBanner from '../components/AftermarketAdBanner';
import { BookOpen, Plus, Car, Calendar } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

export default function BuildLogs() {
  const { identity } = useInternetIdentity();
  const { data: logs = [], isLoading } = useGetBuildLogs();
  const [showModal, setShowModal] = useState(false);

  const isAuthenticated = !!identity;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">Build Logs</h1>
        {isAuthenticated && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Build
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : (logs as BuildLog[]).length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No build logs yet</p>
          <p className="text-sm">Share your build journey!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(logs as BuildLog[]).map((log, index) => (
            <div key={log.id}>
              <Link
                to="/builds/$logId"
                params={{ logId: String(log.id) }}
                className="block bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Car className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-base truncate">{log.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {log.carYear} {log.carMake} {log.carModel}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(log.createdAt).toLocaleDateString()}
                      </span>
                      <span>{log.stages.length} stage{log.stages.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              </Link>
              {(index + 1) % 4 === 0 && <AftermarketAdBanner className="mt-3" />}
            </div>
          ))}
        </div>
      )}

      <StartBuildLogModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
