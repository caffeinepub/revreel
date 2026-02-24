import React, { useState } from 'react';
import { Wrench, Loader2, LogIn } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateMechanicsPost } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';

interface PostIssueModalProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { value: 'Engine', label: 'Engine' },
  { value: 'Brakes', label: 'Brakes' },
  { value: 'Suspension', label: 'Suspension' },
  { value: 'Electrical', label: 'Electrical' },
  { value: 'Bodywork', label: 'Bodywork' },
  { value: 'Transmission', label: 'Transmission' },
  { value: 'Other', label: 'Other' },
];

export default function PostIssueModal({ open, onClose }: PostIssueModalProps) {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const createPost = useCreateMechanicsPost();

  const isValid = title.trim() !== '' && category !== '' && description.trim() !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !isAuthenticated) return;

    try {
      await createPost.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        category,
      });
      toast.success('Issue posted! The community will help 🔧');
      setTitle('');
      setCategory('');
      setDescription('');
      onClose();
    } catch {
      toast.error('Failed to post issue. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card border-border/60 text-foreground max-w-md w-full mx-4">
        <DialogHeader>
          <DialogTitle className="font-display text-xl tracking-widest neon-text flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            POST AN ISSUE
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Describe your car problem and get help from the community
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="issue-title" className="font-display text-xs tracking-wider text-muted-foreground">
              ISSUE TITLE *
            </Label>
            <Input
              id="issue-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Engine knocking at idle"
              className="bg-background/60 border-border/60 focus:border-neon/60 text-foreground placeholder:text-muted-foreground/50"
              maxLength={100}
              disabled={!isAuthenticated}
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="font-display text-xs tracking-wider text-muted-foreground">
              CATEGORY *
            </Label>
            <Select value={category} onValueChange={setCategory} disabled={!isAuthenticated}>
              <SelectTrigger className="bg-background/60 border-border/60 focus:border-neon/60 text-foreground">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/60">
                {CATEGORIES.map((cat) => (
                  <SelectItem
                    key={cat.value}
                    value={cat.value}
                    className="text-foreground focus:bg-neon/10 focus:text-neon"
                  >
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="issue-desc" className="font-display text-xs tracking-wider text-muted-foreground">
              DESCRIPTION *
            </Label>
            <Textarea
              id="issue-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail — when it happens, what you've tried, car make/model/year..."
              className="bg-background/60 border-border/60 focus:border-neon/60 text-foreground placeholder:text-muted-foreground/50 resize-none"
              rows={4}
              maxLength={1000}
              disabled={!isAuthenticated}
            />
          </div>

          {/* Auth prompt */}
          {!isAuthenticated && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neon/30 bg-neon/5">
              <LogIn className="w-4 h-4 text-neon shrink-0" />
              <p className="text-xs text-neon font-display tracking-wide">
                LOGIN TO POST AN ISSUE
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 font-display tracking-wider border-border/60 text-muted-foreground hover:text-foreground"
              disabled={createPost.isPending}
            >
              CANCEL
            </Button>
            <Button
              type="submit"
              disabled={!isValid || !isAuthenticated || createPost.isPending}
              className="flex-1 font-display tracking-wider bg-neon text-primary-foreground hover:bg-neon/90 neon-glow disabled:opacity-50"
            >
              {createPost.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  POSTING...
                </span>
              ) : (
                'POST ISSUE'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
