import { useState } from 'react';
import { Car } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useCreateCarMeet } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Props {
  open: boolean;
  onClose: () => void;
}

const MEET_CATEGORIES = [
  'Drift',
  'Drag',
  'Show & Shine',
  'Track Day',
  'Cruise',
  'JDM',
  'Euro',
  'Muscle',
  'Other',
];

export default function PostMeetModal({ open, onClose }: Props) {
  const { identity } = useInternetIdentity();
  const createMeet = useCreateCarMeet();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Other');

  const isValid =
    title.trim() !== '' && location.trim() !== '' && dateStr !== '' && category !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity || !isValid) return;
    try {
      await createMeet.mutateAsync({
        title: title.trim(),
        location: location.trim(),
        // date is number (milliseconds) in LocalCarMeet
        date: new Date(dateStr).getTime(),
        description: description.trim(),
        category,
      });
      setTitle('');
      setLocation('');
      setDateStr('');
      setDescription('');
      setCategory('Other');
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
            <Car className="w-5 h-5 text-neon-orange" />
            Post a Car Meet
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-muted-foreground text-sm">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sunday Drift Session"
              className="bg-background border-border mt-1"
              required
            />
          </div>
          <div>
            <Label className="text-muted-foreground text-sm">Location</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Irwindale Speedway, CA"
              className="bg-background border-border mt-1"
              required
            />
          </div>
          <div>
            <Label className="text-muted-foreground text-sm">Date & Time</Label>
            <Input
              type="datetime-local"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="bg-background border-border mt-1"
              required
            />
          </div>
          <div>
            <Label className="text-muted-foreground text-sm">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-background border-border mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {MEET_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-muted-foreground text-sm">Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell people what to expect..."
              className="bg-background border-border mt-1 resize-none"
              rows={3}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-border"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!identity || createMeet.isPending || !isValid}
              className="flex-1 bg-neon-orange text-black hover:bg-neon-yellow font-bold"
            >
              {createMeet.isPending ? 'Posting...' : 'Post Meet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
