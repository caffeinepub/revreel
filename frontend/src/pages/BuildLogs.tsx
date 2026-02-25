import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetBuildLogs } from "../hooks/useQueries";
import type { BuildLog } from "../hooks/useQueries";
import { Skeleton } from "@/components/ui/skeleton";
import StartBuildLogModal from "../components/StartBuildLogModal";
import { BookOpen, Plus, Car, Calendar } from "lucide-react";

export default function BuildLogs() {
  const { identity } = useInternetIdentity();
  const { data: buildLogs = [], isLoading } = useGetBuildLogs();
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
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : (buildLogs as BuildLog[]).length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No build logs yet</p>
          <p className="text-sm">
            Share your car build journey with the community!
          </p>
          {isAuthenticated && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Start a Build Log
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {(buildLogs as BuildLog[]).map((log) => (
            <Link
              key={log.id}
              to="/builds/$buildId"
              params={{ buildId: String(log.id) }}
              className="block bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
            >
              <h3 className="font-display font-bold text-base mb-1">
                {log.title}
              </h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Car className="h-3 w-3" />
                  {log.carYear} {log.carMake} {log.carModel}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(
                    Number(log.createdAt) / 1_000_000
                  ).toLocaleDateString()}
                </span>
              </div>
              {log.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {log.description}
                </p>
              )}
              <div className="mt-2 text-xs text-primary">
                {(log.stages ?? []).length} stage
                {(log.stages ?? []).length !== 1 ? "s" : ""}
              </div>
            </Link>
          ))}
        </div>
      )}

      <StartBuildLogModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
