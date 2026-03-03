import { useState } from 'react';
import { Wrench } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useCreateBuildLog } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function StartBuildLogModal({ open, onClose }: Props) {
  const { identity } = useInternetIdentity();
  const createBuildLog = useCreateBuildLog();
  const [form, setForm] = useState({
    title: '',
    carMake: '',
    carModel: '',
    carYear: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity) return;
    try {
      // authorId is injected by useCreateBuildLog from the current user's identity
      await createBuildLog.mutateAsync(form);
      setForm({ title: '', carMake: '', carModel: '', carYear: '', description: '' });
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground flex items-center gap-2">
            <Wrench className="w-5 h-5 text-neon-orange" />
            Start a Build Log
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-muted-foreground text-sm">Build Title</Label>
            <Input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. SR20 Swap Build"
              className="bg-background border-border mt-1"
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-muted-foreground text-sm">Make</Label>
              <Input
                value={form.carMake}
                onChange={e => setForm(f => ({ ...f, carMake: e.target.value }))}
                placeholder="Nissan"
                className="bg-background border-border mt-1"
                required
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Model</Label>
              <Input
                value={form.carModel}
                onChange={e => setForm(f => ({ ...f, carModel: e.target.value }))}
                placeholder="240SX"
                className="bg-background border-border mt-1"
                required
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Year</Label>
              <Input
                value={form.carYear}
                onChange={e => setForm(f => ({ ...f, carYear: e.target.value }))}
                placeholder="1993"
                className="bg-background border-border mt-1"
                required
              />
            </div>
          </div>
          <div>
            <Label className="text-muted-foreground text-sm">Description</Label>
            <Textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Tell us about your build goals..."
              className="bg-background border-border mt-1 resize-none"
              rows={3}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-border">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!identity || createBuildLog.isPending || !form.title || !form.carMake || !form.carModel || !form.carYear}
              className="flex-1 bg-neon-orange text-black hover:bg-neon-yellow font-bold"
            >
              {createBuildLog.isPending ? 'Creating...' : 'Start Build'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
