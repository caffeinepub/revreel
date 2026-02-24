import React, { useState } from 'react';
import { useParams, Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Calendar, MapPin, Users, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGetCarMeetDetails, useJoinCarMeet, useLeaveCarMeet, type UserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';

const CATEGORY_COLORS: Record<string, string> = {
  jdm: 'bg-neon-orange/20 text-neon-orange border-neon-orange/40',
  muscle: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  drift: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  drag: 'bg-red-500/20 text-red-400 border-red-500/40',
  supercar: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  offroad: 'bg-green-500/20 text-green-400 border-green-500/40',
  all: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
};

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isUpcoming(timestamp: bigint): boolean {
  return Number(timestamp) / 1_000_000 > Date.now();
}

function DetailsSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-sm border-b border-border/40 px-4 py-3 flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-full" />
        <Skeleton className="h-5 w-48 flex-1" />
      </div>
      <div className="px-4 pt-5 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export default function CarMeetDetails() {
  const { meetId } = useParams({ strict: false }) as { meetId: string };
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const currentPrincipal = identity?.getPrincipal().toString();

  const { data: meet, isLoading } = useGetCarMeetDetails(meetId);
  const joinMeet = useJoinCarMeet();
  const leaveMeet = useLeaveCarMeet();
  const [actionLoading, setActionLoading] = useState(false);

  const isAttending = currentPrincipal
    ? (meet?.attendees ?? []).some((a: UserProfile) => a.id.toString() === currentPrincipal)
    : false;

  const upcoming = meet ? isUpcoming(meet.date) : false;
  const categoryColor = meet ? (CATEGORY_COLORS[meet.category.toLowerCase()] ?? CATEGORY_COLORS['all']) : '';

  const handleAttend = async () => {
    if (!isAuthenticated) {
      toast.info('Login to attend car meets!');
      return;
    }
    setActionLoading(true);
    try {
      if (isAttending) {
        await leaveMeet.mutateAsync({ meetId });
        toast.success('Left the meet.');
      } else {
        await joinMeet.mutateAsync({ meetId });
        toast.success("You're attending! 🚗");
      }
    } catch {
      toast.error('Action failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return <DetailsSkeleton />;
  }

  if (!meet) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6">
        <Car className="w-12 h-12 text-muted-foreground" />
        <h2 className="font-display text-2xl text-foreground">MEET NOT FOUND</h2>
        <p className="text-muted-foreground text-center">This car meet doesn't exist or was removed.</p>
        <Link to="/meets" className="text-neon-orange font-display text-sm tracking-wider hover:underline">
          ← BACK TO MEETS
        </Link>
      </div>
    );
  }

  const organizerAvatarUrl = meet.organizer?.avatar?.getDirectURL() || '/assets/generated/default-avatar.dim_128x128.png';

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-sm border-b border-border/40 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate({ to: '/meets' })}
          className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          aria-label="Back to meets"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <h1 className="font-display text-lg tracking-wider text-foreground truncate flex-1">{meet.title}</h1>
        <span className={`shrink-0 text-[10px] font-display tracking-wider px-2 py-0.5 rounded border ${categoryColor}`}>
          {meet.category.toUpperCase()}
        </span>
      </div>

      <div className="px-4 pt-5 space-y-6">
        {/* Status badge */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-xs font-display tracking-wider px-3 py-1 rounded-full border ${
            upcoming
              ? 'bg-neon-orange/10 text-neon-orange border-neon-orange/30'
              : 'bg-muted text-muted-foreground border-border/40'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${upcoming ? 'bg-neon-orange animate-pulse' : 'bg-muted-foreground'}`} />
            {upcoming ? 'UPCOMING' : 'PAST EVENT'}
          </span>
        </div>

        {/* Title & Organizer */}
        <div className="space-y-3">
          <h2 className="font-display text-3xl tracking-wide text-foreground leading-tight">{meet.title}</h2>
          {meet.organizer && (
            <Link
              to="/profile/$userId"
              params={{ userId: meet.organizer.id.toString() }}
              className="flex items-center gap-2.5 group w-fit"
            >
              <Avatar className="w-8 h-8 border border-neon-orange/30">
                <AvatarImage src={organizerAvatarUrl} alt={meet.organizer.username} />
                <AvatarFallback className="bg-neon-orange/10 text-neon-orange text-xs font-display">
                  {meet.organizer.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs text-muted-foreground">Organized by</p>
                <p className="text-sm font-display text-neon-orange group-hover:text-neon-orange/80 transition-colors">
                  {meet.organizer.username}
                </p>
              </div>
            </Link>
          )}
        </div>

        {/* Date & Location */}
        <div className="bg-card/60 border border-border/60 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-neon-orange/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-neon-orange" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{formatDate(meet.date)}</p>
              <p className="text-xs text-muted-foreground">{formatTime(meet.date)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-neon-orange/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-neon-orange" />
            </div>
            <p className="text-sm font-semibold text-foreground">{meet.location}</p>
          </div>
        </div>

        {/* Description */}
        {meet.description && (
          <div>
            <h3 className="font-display text-sm tracking-wider text-muted-foreground mb-2">ABOUT THIS MEET</h3>
            <p className="text-foreground/80 text-sm leading-relaxed">{meet.description}</p>
          </div>
        )}

        {/* Attend Button */}
        <Button
          onClick={handleAttend}
          disabled={actionLoading}
          className={`w-full font-display tracking-wider ${
            isAttending
              ? 'bg-muted text-muted-foreground hover:bg-red-500/20 hover:text-red-400 border border-border'
              : 'bg-neon-orange text-black hover:bg-neon-orange/90'
          }`}
        >
          {actionLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              {isAttending ? 'LEAVING...' : 'JOINING...'}
            </span>
          ) : isAttending ? (
            'LEAVE MEET'
          ) : (
            <>
              <Users className="w-4 h-4 mr-2" />
              ATTEND MEET
            </>
          )}
        </Button>

        {/* Attendees */}
        <div>
          <h3 className="font-display text-sm tracking-wider text-muted-foreground mb-3">
            ATTENDEES ({meet.attendees.length})
          </h3>
          {meet.attendees.length === 0 ? (
            <p className="text-muted-foreground text-sm">No attendees yet. Be the first!</p>
          ) : (
            <ScrollArea className="h-48">
              <div className="space-y-2 pr-3">
                {meet.attendees.map((attendee: UserProfile) => (
                  <Link
                    key={attendee.id.toString()}
                    to="/profile/$userId"
                    params={{ userId: attendee.id.toString() }}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage
                        src={attendee.avatarUrl || attendee.avatar?.getDirectURL() || '/assets/generated/default-avatar.dim_128x128.png'}
                        alt={attendee.username}
                      />
                      <AvatarFallback className="bg-neon-orange/10 text-neon-orange text-xs">
                        {attendee.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground">{attendee.username}</span>
                  </Link>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
}
