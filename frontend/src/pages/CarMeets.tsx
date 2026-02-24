import React, { useState } from 'react';
import { Plus, Calendar, Loader2, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import CarMeetCard from '../components/CarMeetCard';
import PostMeetModal from '../components/PostMeetModal';
import { useGetAllCarMeets, useJoinCarMeet, useLeaveCarMeet } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';

const CATEGORY_FILTERS = ['ALL', 'JDM', 'MUSCLE', 'DRIFT', 'DRAG', 'SUPERCAR', 'OFFROAD'];
type DateFilter = 'upcoming' | 'past';

export default function CarMeets() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

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
    // Category filter
    const categoryMatch = activeCategory === 'ALL' || meet.category.toLowerCase() === activeCategory.toLowerCase();
    // Date filter
    const meetMs = Number(meet.date) / 1_000_000;
    const dateMatch = dateFilter === 'upcoming' ? meetMs >= now : meetMs < now;
    return categoryMatch && dateMatch;
  });

  // Sort upcoming ascending (soonest first), past descending (most recent first)
  const sortedMeets = [...filteredMeets].sort((a, b) => {
    const aMs = Number(a.date) / 1_000_000;
    const bMs = Number(b.date) / 1_000_000;
    return dateFilter === 'upcoming' ? aMs - bMs : bMs - aMs;
  });

  const handleAttend = async (meetId: string) => {
    setLoadingMeetId(meetId);
    setLoadingAction('attend');
    try {
      await joinMeet.mutateAsync(meetId);
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
      await leaveMeet.mutateAsync(meetId);
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
          <Car className="w-6 h-6 text-neon" />
          <h1 className="font-display text-3xl tracking-widest neon-text">CAR MEETS</h1>
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
                  ? 'bg-neon text-primary-foreground border-neon neon-glow'
                  : 'bg-transparent text-muted-foreground border-border/60 hover:border-neon/40 hover:text-foreground'
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
                ? 'bg-neon text-primary-foreground'
                : 'bg-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            UPCOMING
          </button>
          <button
            onClick={() => setDateFilter('past')}
            className={`font-display text-xs tracking-wider px-4 py-2 transition-all border-l border-border/60 ${
              dateFilter === 'past'
                ? 'bg-neon text-primary-foreground'
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
            <div className="w-16 h-16 rounded-full bg-neon/10 border border-neon/20 flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-neon/60" />
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
                className="mt-6 font-display tracking-wider bg-neon text-primary-foreground hover:bg-neon/90 neon-glow"
              >
                <Plus className="w-4 h-4 mr-2" />
                POST A MEET
              </Button>
            )}
          </div>
        ) : (
          sortedMeets.map((meet) => (
            <CarMeetCard
              key={meet.id}
              meet={meet}
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
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-neon text-primary-foreground shadow-lg neon-glow flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
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
