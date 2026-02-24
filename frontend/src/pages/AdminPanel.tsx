import { useState } from 'react';
import { Shield, Trash2, AlertTriangle, Loader2, UserX, Copy, Check } from 'lucide-react';
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

function PrincipalDisplay({ principal }: { principal: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(principal).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="w-full max-w-lg mx-auto mb-6 p-4 rounded-lg bg-card/60 border border-border/50 backdrop-blur-sm">
      <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">
        Your Principal ID
      </p>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm text-foreground/90 break-all flex-1 select-all">
          {principal}
        </span>
        <button
          onClick={handleCopy}
          title="Copy Principal ID"
          className="shrink-0 p-1.5 rounded-md hover:bg-neon-orange/10 text-muted-foreground hover:text-neon-orange transition-colors"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
      <p className="text-xs text-muted-foreground/60 mt-1">
        Share this with your developer to grant admin access.
      </p>
    </div>
  );
}

function AdminPanelContent() {
  const { identity } = useInternetIdentity();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const deleteUser = useDeleteUser();

  const [userIdInput, setUserIdInput] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const isAuthenticated = !!identity;
  const principalId = identity?.getPrincipal().toString() ?? null;

  const handleDeleteUser = async () => {
    if (!userIdInput.trim()) return;
    setDeleteError(null);
    setDeleteSuccess(null);
    try {
      await deleteUser.mutateAsync({ userId: userIdInput.trim() });
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
        {principalId && (
          <div className="mt-2 w-full">
            <PrincipalDisplay principal={principalId} />
            <p className="text-xs text-muted-foreground/60 text-center max-w-sm mx-auto">
              The Principal above is your current identity. The backend admin must match this exactly.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
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

      {/* Diagnostic: current principal */}
      {principalId && <PrincipalDisplay principal={principalId} />}

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
              <Check className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{deleteSuccess}</span>
            </div>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={!userIdInput.trim() || deleteUser.isPending}
                className="w-full font-display tracking-wider"
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
                <AlertDialogTitle className="font-display text-foreground">
                  Confirm Delete
                </AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  Are you sure you want to delete user{' '}
                  <span className="font-mono text-foreground">{userIdInput}</span>? This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="font-display text-xs tracking-wider">
                  CANCEL
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteUser}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-display text-xs tracking-wider"
                >
                  DELETE
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminPanel() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background pt-4 pb-24">
        <AdminPanelContent />
      </div>
    </AuthGuard>
  );
}
