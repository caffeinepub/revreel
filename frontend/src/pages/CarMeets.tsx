import React, { useState } from 'react';
import { Plus, Calendar, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@tanstack/react-router';
import PostMeetModal from '../components/PostMeetModal';
import { useGetAllCarMeets, useJoinCarMeet, useLeaveCarMeet, type CarMeet } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';
import { MapPin, Users } from 'lucide-react';

const CATEGORY_FILTERS = ['ALL', 'JDM', 'MUSCLE', 'DRIFT', 'DRAG', 'SUPERCAR', 'OFFROAD'];
type DateFilter = 'upcoming' | 'past';

function MeetCard({
  meet,
  currentUserId,
  isAuthenticated,
  onAttend,
  onLeave,
  isAttendLoading,
  isLeaveLoading,
  onLoginPrompt,
}: {
  meet: CarMeet;
  currentUserId: string | undefined;
  isAuthenticated: boolean;
  onAttend: (meetId: string) => Promise<void>;
  onLeave: (meetId: string) => Promise<void>;
  isAttendLoading: boolean;
  isLeaveLoading: boolean;
  onLoginPrompt: () => void;
}) {
  const isAttending = currentUserId
    ? meet.attendees.some((a) => a.toString() === currentUserId)
    : false;

  const meetDate = new Date(Number(meet.date) / 1_000_000);
  const isPast = meetDate < new Date();

  const handleAttend = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
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
    <Link to="/meets/$meetId" params={{ meetId: meet.id }} className="block">
      <div className="bg-card border border-border rounded-2xl p-4 hover:border-neon-orange/40 transition-colors">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground text-base leading-tight line-clamp-1">
              {meet.title}
            </h3>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-neon-orange/20 text-neon-orange text-xs font-bold">
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
            <span>{meetDate.toLocaleDateString()} {meetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Users size={14} className="flex-shrink-0" />
            <span>{meet.attendees.length} attending</span>
          </div>
        </div>

        {isAuthenticated && !isPast && (
          <button
            onClick={handleAttend}
            disabled={isAttendLoading || isLeaveLoading}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 ${
              isAttending
                ? 'bg-muted text-muted-foreground hover:bg-red-500/20 hover:text-red-400'
                : 'bg-neon-orange/20 text-neon-orange hover:bg-neon-orange/30'
            }`}
          >
            {isAttending ? 'Leave Meet' : 'Attend Meet'}
          </button>
        )}
      </div>
    </Link>
  );
}

export default function CarMeets() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const currentUserId = identity?.getPrincipal().toString();

  const [showPostModal, setShowPostModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilter>('upcoming');

  const { data: meets, isLoading } = useGetAllCarMeets();
  const joinMeet = useJoinCarMeet();
  const leaveMeet = useLeaveCarMeet();

  const [loadingMeetId, setLoadingMeetId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<'attend' | 'leave' | null>(null);

  const now = Date.now();

  const filteredMeets = (meets ?? []).filter((meet) => {
    const categoryMatch = activeCategory === 'ALL' || meet.category.toLowerCase() === activeCategory.toLowerCase();
    const meetMs = Number(meet.date) / 1_000_000;
    const dateMatch = dateFilter === 'upcoming' ? meetMs >= now : meetMs < now;
    return categoryMatch && dateMatch;
  });

  const sortedMeets = [...filteredMeets].sort((a, b) => {
    const aMs = Number(a.date) / 1_000_000;
    const bMs = Number(b.date) / 1_000_000;
    return dateFilter === 'upcoming' ? aMs - bMs : bMs - aMs;
  });

  const handleAttend = async (meetId: string) => {
    setLoadingMeetId(meetId);
    setLoadingAction('attend');
    try {
      await joinMeet.mutateAsync({ meetId });
      toast.success("You're attending! 🚗");
    } catch {
      toast.error('Failed to join meet.');
    } finally {
      setLoadingMeetId(null);
      setLoadingAction(null);
    }
  };

  const handleLeave = async (meetId: string) => {
    setLoadingMeetId(meetId);
    setLoadingAction('leave');
    try {
      await leaveMeet.mutateAsync({ meetId });
      toast.success('Left the meet.');
    } catch {
      toast.error('Failed to leave meet.');
    } finally {
      setLoadingMeetId(null);
      setLoadingAction(null);
    }
  };

  const handleLoginPrompt = () => {
    toast.info('Login to attend car meets!');
  };

  const handleFabClick = () => {
    if (!isAuthenticated) {
      toast.info('Login to post a car meet!');
      return;
    }
    setShowPostModal(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="relative px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <Car className="w-6 h-6 text-neon-orange" />
          <h1 className="font-display text-3xl tracking-widest text-neon-orange">CAR MEETS</h1>
        </div>
        <p className="text-sm text-muted-foreground pl-9">Find and join local car meetups</p>
      </div>

      {/* Category Filter Pills */}
      <div className="px-4 pb-3 overflow-x-auto">
        <div className="flex gap-2 w-max">
          {CATEGORY_FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveCategory(filter)}
              className={`font-display text-xs tracking-wider px-3 py-1.5 rounded-full border transition-all whitespace-nowrap ${
                activeCategory === filter
                  ? 'bg-neon-orange text-black border-neon-orange'
                  : 'bg-transparent text-muted-foreground border-border/60 hover:border-neon-orange/40 hover:text-foreground'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Date Toggle */}
      <div className="px-4 pb-4">
        <div className="inline-flex rounded-lg border border-border/60 overflow-hidden">
          <button
            onClick={() => setDateFilter('upcoming')}
            className={`font-display text-xs tracking-wider px-4 py-2 transition-all ${
              dateFilter === 'upcoming'
                ? 'bg-neon-orange text-black'
                : 'bg-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            UPCOMING
          </button>
          <button
            onClick={() => setDateFilter('past')}
            className={`font-display text-xs tracking-wider px-4 py-2 transition-all border-l border-border/60 ${
              dateFilter === 'past'
                ? 'bg-neon-orange text-black'
                : 'bg-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            PAST
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-24 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/40 p-4 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-40" />
              <div className="flex justify-between pt-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-7 w-20" />
              </div>
            </div>
          ))
        ) : sortedMeets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-neon-orange/10 border border-neon-orange/20 flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-neon-orange/60" />
            </div>
            <h3 className="font-display text-lg tracking-wider text-foreground mb-2">NO MEETS FOUND</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {activeCategory !== 'ALL'
                ? `No ${activeCategory} ${dateFilter} meets found. Try a different filter!`
                : `No ${dateFilter} meets found. ${dateFilter === 'upcoming' ? 'Be the first to post one!' : ''}`}
            </p>
            {isAuthenticated && dateFilter === 'upcoming' && (
              <Button
                onClick={() => setShowPostModal(true)}
                className="mt-6 font-display tracking-wider bg-neon-orange text-black hover:bg-neon-orange/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                POST A MEET
              </Button>
            )}
          </div>
        ) : (
          sortedMeets.map((meet) => (
            <MeetCard
              key={meet.id}
              meet={meet}
              currentUserId={currentUserId}
              isAuthenticated={isAuthenticated}
              onAttend={handleAttend}
              onLeave={handleLeave}
              isAttendLoading={loadingMeetId === meet.id && loadingAction === 'attend'}
              isLeaveLoading={loadingMeetId === meet.id && loadingAction === 'leave'}
              onLoginPrompt={handleLoginPrompt}
            />
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={handleFabClick}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-neon-orange text-black shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        aria-label="Post a meet"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Post Meet Modal */}
      <PostMeetModal
        open={showPostModal}
        onClose={() => setShowPostModal(false)}
      />
    </div>
  );
}
