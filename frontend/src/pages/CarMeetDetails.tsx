import { useParams, Link } from "@tanstack/react-router";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCarMeetDetails, useJoinMeet, useLeaveMeet } from "../hooks/useQueries";
import { Skeleton } from "@/components/ui/skeleton";
import { Car, MapPin, Calendar, Users, ChevronLeft, Loader2 } from "lucide-react";

export default function CarMeetDetails() {
  const { meetId } = useParams({ strict: false }) as { meetId: string };
  const { identity } = useInternetIdentity();
  const { data: meet, isLoading } = useGetCarMeetDetails(meetId);
  const joinMeet = useJoinMeet();
  const leaveMeet = useLeaveMeet();

  const currentUserId = identity?.getPrincipal().toString() ?? "";
  const isAttending = meet?.attendees?.some((a) => a === currentUserId) ?? false;

  const handleToggleAttend = () => {
    if (isAttending) {
      leaveMeet.mutate(meetId);
    } else {
      joinMeet.mutate(meetId);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!meet) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-display font-bold mb-2">Meet Not Found</h2>
        <Link to="/meets" className="text-primary hover:underline">
          Back to Car Meets
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/meets" className="p-2 rounded hover:bg-muted transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="flex-1 text-xl font-display font-bold truncate">
          {meet.title}
        </h1>
      </div>

      {/* Details Card */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-primary" />
          <span>{meet.location}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-primary" />
          <span>{new Date(meet.date).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Car className="h-4 w-4 text-primary" />
          <span>{meet.category}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-primary" />
          <span>{meet.attendees.length} attending</span>
        </div>
      </div>

      {/* Description */}
      {meet.description && (
        <div className="mb-4">
          <h2 className="font-display font-semibold mb-2">About</h2>
          <p className="text-sm text-muted-foreground">{meet.description}</p>
        </div>
      )}

      {/* Attend Button */}
      {identity && (
        <button
          onClick={handleToggleAttend}
          disabled={joinMeet.isPending || leaveMeet.isPending}
          className={`w-full py-3 rounded font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
            isAttending
              ? "border border-border hover:bg-muted"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {joinMeet.isPending || leaveMeet.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isAttending ? (
            "Leave Meet"
          ) : (
            "Attend Meet"
          )}
        </button>
      )}

      {/* Attendees */}
      {meet.attendees.length > 0 && (
        <div className="mt-6">
          <h2 className="font-display font-semibold mb-3">
            Attendees ({meet.attendees.length})
          </h2>
          <div className="space-y-2">
            {meet.attendees.map((attendeeId, idx) => (
              <Link
                key={attendeeId ?? idx}
                to="/profile/$userId"
                params={{ userId: attendeeId ?? "" }}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-muted-foreground">
                    {attendeeId.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium">{attendeeId.slice(0, 12)}...</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
