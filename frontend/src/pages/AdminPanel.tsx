import { useState } from 'react';
import { Shield, Trash2, AlertTriangle, Loader2, UserX } from 'lucide-react';
import { useIsAdmin, useDeleteUser } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import AuthGuard from '../components/AuthGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function AdminPanelContent() {
  const { identity } = useInternetIdentity();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const deleteUser = useDeleteUser();

  const [userIdInput, setUserIdInput] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const isAuthenticated = !!identity;

  const handleDeleteUser = async () => {
    if (!userIdInput.trim()) return;
    setDeleteError(null);
    setDeleteSuccess(null);
    try {
      await deleteUser.mutateAsync(userIdInput.trim());
      setDeleteSuccess(`User ${userIdInput.trim()} has been deleted successfully.`);
      setUserIdInput('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete user.';
      setDeleteError(message);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <Shield className="w-16 h-16 text-neon-orange opacity-60" />
        <h2 className="text-2xl font-display font-bold text-foreground">Admin Access Required</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          You must be logged in to access the admin panel.
        </p>
      </div>
    );
  }

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-neon-orange" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <AlertTriangle className="w-16 h-16 text-destructive opacity-80" />
        <h2 className="text-2xl font-display font-bold text-foreground">Access Denied</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          You do not have admin privileges to access this panel.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-neon-orange/10 border border-neon-orange/30">
          <Shield className="w-6 h-6 text-neon-orange" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground tracking-wide">
            Admin Panel
          </h1>
          <p className="text-sm text-muted-foreground">Manage users and platform settings</p>
        </div>
      </div>

      {/* Delete User Card */}
      <Card className="bg-card/60 border-border/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <UserX className="w-5 h-5 text-destructive" />
            Delete User Account
          </CardTitle>
          <CardDescription>
            Permanently remove a user account by their Principal ID. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId" className="text-foreground/80">
              User Principal ID
            </Label>
            <Input
              id="userId"
              placeholder="e.g. aaaaa-aa or 2vxsx-fae..."
              value={userIdInput}
              onChange={(e) => {
                setUserIdInput(e.target.value);
                setDeleteError(null);
                setDeleteSuccess(null);
              }}
              className="bg-background/50 border-border/60 text-foreground placeholder:text-muted-foreground/50 font-mono text-sm"
            />
          </div>

          {deleteError && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          {deleteSuccess && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
              <Shield className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{deleteSuccess}</span>
            </div>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={!userIdInput.trim() || deleteUser.isPending}
                className="w-full"
              >
                {deleteUser.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete User
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-foreground">
                  Confirm User Deletion
                </AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  Are you sure you want to permanently delete the user with Principal ID:
                  <span className="block mt-2 font-mono text-xs text-foreground/80 break-all bg-background/50 p-2 rounded border border-border/50">
                    {userIdInput.trim()}
                  </span>
                  This action <strong className="text-destructive">cannot be undone</strong>.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-border/60">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteUser}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete User
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Footer note */}
      <p className="mt-6 text-xs text-muted-foreground/50 text-center">
        Admin actions are logged and irreversible. Use with caution.
      </p>
    </div>
  );
}

export default function AdminPanel() {
  return (
    <AuthGuard>
      <AdminPanelContent />
    </AuthGuard>
  );
}
