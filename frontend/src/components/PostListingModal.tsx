import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useCreateListing } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  open: boolean;
  onClose: () => void;
}

const CONDITIONS = ['New', 'Used', 'Parts'];
const CATEGORIES = ['Engine', 'Suspension', 'Brakes', 'Wheels & Tires', 'Exterior', 'Interior', 'Electronics', 'Exhaust', 'Transmission', 'Other'];

export default function PostListingModal({ open, onClose }: Props) {
  const { identity } = useInternetIdentity();
  const createListing = useCreateListing();
  const [form, setForm] = useState({
    title: '',
    description: '',
    make: '',
    model: '',
    year: '',
    price: '',
    condition: 'Used',
    imageUrl: '',
    category: 'Other',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity) return;
    try {
      // sellerId is injected by useCreateListing from the current user's identity
      await createListing.mutateAsync(form);
      setForm({ title: '', description: '', make: '', model: '', year: '', price: '', condition: 'Used', imageUrl: '', category: 'Other' });
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-neon-orange" />
            Post a Listing
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="text-muted-foreground text-sm">Title</Label>
            <Input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. SR20DET Engine"
              className="bg-background border-border mt-1"
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-muted-foreground text-sm">Make</Label>
              <Input value={form.make} onChange={e => setForm(f => ({ ...f, make: e.target.value }))} placeholder="Nissan" className="bg-background border-border mt-1" required />
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Model</Label>
              <Input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} placeholder="240SX" className="bg-background border-border mt-1" required />
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Year</Label>
              <Input value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} placeholder="1993" className="bg-background border-border mt-1" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-muted-foreground text-sm">Price ($)</Label>
              <Input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="1500" className="bg-background border-border mt-1" required />
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Condition</Label>
              <Select value={form.condition} onValueChange={v => setForm(f => ({ ...f, condition: v }))}>
                <SelectTrigger className="bg-background border-border mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-muted-foreground text-sm">Category</Label>
            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger className="bg-background border-border mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-muted-foreground text-sm">Image URL (optional)</Label>
            <Input
              value={form.imageUrl}
              onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
              placeholder="https://..."
              className="bg-background border-border mt-1"
            />
          </div>
          <div>
            <Label className="text-muted-foreground text-sm">Description</Label>
            <Textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe the part or item..."
              className="bg-background border-border mt-1 resize-none"
              rows={3}
              required
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-border">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!identity || createListing.isPending || !form.title || !form.make || !form.model || !form.year || !form.price}
              className="flex-1 bg-neon-orange text-black hover:bg-neon-yellow font-bold"
            >
              {createListing.isPending ? 'Posting...' : 'Post Listing'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
