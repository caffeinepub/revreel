import React from 'react';
import { MapPin, Calendar, Users } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import type { CarMeet } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useJoinMeet, useLeaveMeet } from '../hooks/useQueries';

interface CarMeetCardProps {
  meet: CarMeet;
}

export default function CarMeetCard({ meet }: CarMeetCardProps) {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const currentUserId = identity?.getPrincipal().toString();

  const joinMeet = useJoinMeet();
  const leaveMeet = useLeaveMeet();

  const isAttending = currentUserId
    ? meet.attendees.some((a) => a.toString() === currentUserId)
    : false;

  const meetDate = new Date(meet.date);
  const isPast = meetDate < new Date();

  const handleAttend = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isAuthenticated) return;
    if (isAttending) {
      leaveMeet.mutate(meet.id);
    } else {
      joinMeet.mutate(meet.id);
    }
  };

  return (
    <Link to="/meets/$meetId" params={{ meetId: meet.id }} className="block">
      <div className="bg-card border border-border rounded-2xl p-4 hover:border-primary/40 transition-colors">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground text-base leading-tight line-clamp-1">
              {meet.title}
            </h3>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold">
              {meet.category}
            </span>
          </div>
          {isPast && (
            <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
              Past
            </span>
          )}
        </div>

        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <MapPin size={14} className="flex-shrink-0" />
            <span className="line-clamp-1">{meet.location}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Calendar size={14} className="flex-shrink-0" />
            <span>
              {meetDate.toLocaleDateString()}{' '}
              {meetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Users size={14} className="flex-shrink-0" />
            <span>{meet.attendees.length} attending</span>
          </div>
        </div>

        {isAuthenticated && !isPast && (
          <button
            onClick={handleAttend}
            disabled={joinMeet.isPending || leaveMeet.isPending}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 ${
              isAttending
                ? 'bg-muted text-muted-foreground hover:bg-destructive/20 hover:text-destructive'
                : 'bg-primary/20 text-primary hover:bg-primary/30'
            }`}
          >
            {isAttending ? 'Leave Meet' : 'Attend Meet'}
          </button>
        )}
      </div>
    </Link>
  );
}
