import React from 'react';
import { useIsAdmin, useGetAllUsers, useDeleteUser } from '../hooks/useQueries';
import { UserProfile } from '../backend';
import { Loader2, ShieldAlert, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPanel() {
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: users = [], isLoading: usersLoading } = useGetAllUsers();
  const deleteUser = useDeleteUser();

  const handleDelete = (userId: string) => {
    deleteUser.mutate(userId, {
      onSuccess: () => toast.success('User deleted'),
      onError: (err: unknown) =>
        toast.error(err instanceof Error ? err.message : 'Failed to delete user'),
    });
  };

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-neon-orange animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
        <ShieldAlert className="w-12 h-12 text-red-400" />
        <p className="text-white/60">Access denied. Admins only.</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background text-white pb-24 px-4 pt-6">
      <h1 className="text-2xl font-display font-bold text-neon-orange mb-6">Admin Panel</h1>

      {usersLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-neon-orange animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <p className="text-white/50 text-center py-8">No users found.</p>
      ) : (
        <div className="space-y-2">
          {users.map((user: UserProfile) => (
            <div
              key={user.id.toString()}
              className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{user.username}</p>
                <p className="text-white/40 text-xs truncate">{user.id.toString()}</p>
              </div>
              <button
                onClick={() => handleDelete(user.id.toString())}
                className="text-red-400 hover:text-red-300 transition-colors"
                disabled={deleteUser.isPending}
              >
                {deleteUser.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
