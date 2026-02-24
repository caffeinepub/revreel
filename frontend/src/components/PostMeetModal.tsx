import React, { useState } from 'react';
import { X, Loader2, CalendarPlus } from 'lucide-react';
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
import { useCreateCarMeet } from '../hooks/useQueries';
import { toast } from 'sonner';

interface PostMeetModalProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { value: 'jdm', label: 'JDM' },
  { value: 'muscle', label: 'Muscle Cars' },
  { value: 'drift', label: 'Drift' },
  { value: 'drag', label: 'Drag Racing' },
  { value: 'supercar', label: 'Supercars' },
  { value: 'offroad', label: 'Off-Road' },
  { value: 'all', label: 'All Cars Welcome' },
];

export default function PostMeetModal({ open, onClose }: PostMeetModalProps) {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  const createMeet = useCreateCarMeet();

  const isValid = title.trim() !== '' && location.trim() !== '' && dateTime !== '' && category !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    // Convert local datetime string to nanoseconds timestamp
    const dateMs = new Date(dateTime).getTime();
    const dateNs = BigInt(dateMs) * BigInt(1_000_000);

    try {
      await createMeet.mutateAsync({
        title: title.trim(),
        location: location.trim(),
        date: dateNs,
        description: description.trim(),
        category,
      });
      toast.success('Meet posted! 🚗💨');
      // Reset form
      setTitle('');
      setLocation('');
      setDateTime('');
      setDescription('');
      setCategory('');
      onClose();
    } catch (err) {
      toast.error('Failed to post meet. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card border-border/60 text-foreground max-w-md w-full mx-4">
        <DialogHeader>
          <DialogTitle className="font-display text-xl tracking-widest neon-text flex items-center gap-2">
            <CalendarPlus className="w-5 h-5" />
            POST A MEET
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Organize a car meetup for the community
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="meet-title" className="font-display text-xs tracking-wider text-muted-foreground">
              EVENT TITLE *
            </Label>
            <Input
              id="meet-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sunday JDM Cruise Night"
              className="bg-background/60 border-border/60 focus:border-neon/60 text-foreground placeholder:text-muted-foreground/50"
              maxLength={80}
            />
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label htmlFor="meet-location" className="font-display text-xs tracking-wider text-muted-foreground">
              LOCATION *
            </Label>
            <Input
              id="meet-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Downtown Parking Lot, Los Angeles CA"
              className="bg-background/60 border-border/60 focus:border-neon/60 text-foreground placeholder:text-muted-foreground/50"
              maxLength={120}
            />
          </div>

          {/* Date & Time */}
          <div className="space-y-1.5">
            <Label htmlFor="meet-datetime" className="font-display text-xs tracking-wider text-muted-foreground">
              DATE & TIME *
            </Label>
            <Input
              id="meet-datetime"
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="bg-background/60 border-border/60 focus:border-neon/60 text-foreground [color-scheme:dark]"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="font-display text-xs tracking-wider text-muted-foreground">
              CATEGORY *
            </Label>
            <Select value={category} onValueChange={setCategory}>
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
            <Label htmlFor="meet-desc" className="font-display text-xs tracking-wider text-muted-foreground">
              DESCRIPTION
            </Label>
            <Textarea
              id="meet-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell the community what to expect..."
              className="bg-background/60 border-border/60 focus:border-neon/60 text-foreground placeholder:text-muted-foreground/50 resize-none"
              rows={3}
              maxLength={400}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 font-display tracking-wider border-border/60 text-muted-foreground hover:text-foreground"
              disabled={createMeet.isPending}
            >
              CANCEL
            </Button>
            <Button
              type="submit"
              disabled={!isValid || createMeet.isPending}
              className="flex-1 font-display tracking-wider bg-neon text-primary-foreground hover:bg-neon/90 neon-glow disabled:opacity-50 disabled:neon-glow-none"
            >
              {createMeet.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  POSTING...
                </span>
              ) : (
                'POST MEET'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
