import React from 'react';
import { Calendar, MapPin, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import { type CarMeet } from '../backend';
import { useGetUserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

interface CarMeetCardProps {
  meet: CarMeet;
  onAttend: (meetId: string) => void;
  onLeave: (meetId: string) => void;
  isAttendLoading: boolean;
  isLeaveLoading: boolean;
  onLoginPrompt: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  jdm: 'bg-neon/20 text-neon border-neon/40',
  muscle: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  drift: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  drag: 'bg-red-500/20 text-red-400 border-red-500/40',
  supercar: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  offroad: 'bg-green-500/20 text-green-400 border-green-500/40',
  all: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
};

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  const date = new Date(ms);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  const date = new Date(ms);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isUpcoming(timestamp: bigint): boolean {
  const ms = Number(timestamp) / 1_000_000;
  return ms > Date.now();
}

export default function CarMeetCard({
  meet,
  onAttend,
  onLeave,
  isAttendLoading,
  isLeaveLoading,
  onLoginPrompt,
}: CarMeetCardProps) {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const currentPrincipal = identity?.getPrincipal().toString();

  const { data: organizer } = useGetUserProfile(meet.organizer.toString());

  const isAttending = currentPrincipal
    ? meet.attendees.some((a) => a.toString() === currentPrincipal)
    : false;

  const upcoming = isUpcoming(meet.date);
  const categoryColor = CATEGORY_COLORS[meet.category.toLowerCase()] ?? CATEGORY_COLORS['all'];

  const handleAttendClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      onLoginPrompt();
      return;
    }
    if (isAttending) {
      onLeave(meet.id);
    } else {
      onAttend(meet.id);
    }
  };

  return (
    <Link
      to="/meets/$meetId"
      params={{ meetId: meet.id }}
      className={`relative rounded-xl border bg-card/60 backdrop-blur-sm overflow-hidden transition-all hover:border-neon/40 block ${
        upcoming ? 'border-border' : 'border-border/40 opacity-70'
      }`}
    >
      {/* Top accent line */}
      <div className={`h-0.5 w-full ${upcoming ? 'bg-gradient-to-r from-neon via-neon/60 to-transparent' : 'bg-border/40'}`} />

      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg tracking-wide text-foreground truncate">{meet.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              by <span className="text-neon/80">{organizer?.username ?? '...'}</span>
            </p>
          </div>
          <span className={`shrink-0 text-[10px] font-display tracking-wider px-2 py-0.5 rounded border ${categoryColor}`}>
            {meet.category.toUpperCase()}
          </span>
        </div>

        {/* Details */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 text-neon/70 shrink-0" />
            <span>{formatDate(meet.date)} · {formatTime(meet.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 text-neon/70 shrink-0" />
            <span className="truncate">{meet.location}</span>
          </div>
          {meet.description && (
            <p className="text-xs text-muted-foreground/80 line-clamp-2 pt-0.5">{meet.description}</p>
          )}
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="w-3.5 h-3.5 text-neon/70" />
            <span className="font-display text-xs tracking-wide">
              {meet.attendees.length} {meet.attendees.length === 1 ? 'RACER' : 'RACERS'}
            </span>
          </div>

          {upcoming && (
            <Button
              size="sm"
              onClick={handleAttendClick}
              disabled={isAttendLoading || isLeaveLoading}
              className={`font-display text-xs tracking-wider h-7 px-3 transition-all ${
                isAttending
                  ? 'bg-secondary text-secondary-foreground hover:bg-destructive hover:text-destructive-foreground border border-border'
                  : 'bg-neon text-primary-foreground hover:bg-neon/90 neon-glow'
              }`}
            >
              {(isAttendLoading || isLeaveLoading) ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : isAttending ? (
                'LEAVE'
              ) : (
                'ATTEND'
              )}
            </Button>
          )}

          {!upcoming && (
            <span className="text-[10px] font-display tracking-wider text-muted-foreground/60 border border-border/40 px-2 py-0.5 rounded">
              PAST EVENT
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
