import React from 'react';
import { useDeleteUser, useGetAllUsers, type UserProfile } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { useQuery } from '@tanstack/react-query';
import AuthGuard from '../components/AuthGuard';
import { Loader2, Trash2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export default function AdminPanel() {
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: users = [], isLoading: usersLoading } = useGetAllUsers();
  const deleteUser = useDeleteUser();

  const handleDelete = (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUser.mutate(userId);
    }
  };

  return (
    <AuthGuard>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <ShieldAlert className="w-7 h-7 text-primary" />
          <h1 className="font-display text-2xl font-black text-primary neon-text">Admin Panel</h1>
        </div>

        {adminLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !isAdmin ? (
          <div className="text-center py-16">
            <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-3" />
            <p className="text-lg font-semibold text-destructive">Access Denied</p>
            <p className="text-muted-foreground text-sm mt-1">You don't have admin privileges.</p>
          </div>
        ) : (
          <div>
            <h2 className="font-display text-lg font-bold mb-4">
              All Users ({users.length})
            </h2>
            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user: UserProfile) => (
                  <div
                    key={user.id?.toString()}
                    className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.username} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-primary">
                          {user.username.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{user.username}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.id?.toString()}</p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(user.id?.toString() || '')}
                      disabled={deleteUser.isPending}
                    >
                      {deleteUser.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
