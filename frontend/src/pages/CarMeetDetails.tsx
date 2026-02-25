import { useParams, Link } from "@tanstack/react-router";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCarMeetDetails, useJoinCarMeet, useLeaveCarMeet } from "../hooks/useQueries";
import type { UserProfile } from "../hooks/useQueries";
import { Skeleton } from "@/components/ui/skeleton";
import { Car, MapPin, Calendar, Users, ChevronLeft, Loader2 } from "lucide-react";

export default function CarMeetDetails() {
  const { meetId } = useParams({ from: "/app-layout/meets/$meetId" });
  const { identity } = useInternetIdentity();
  const { data: meet, isLoading } = useGetCarMeetDetails(meetId);
  const joinMeet = useJoinCarMeet();
  const leaveMeet = useLeaveCarMeet();

  const currentUserId = identity?.getPrincipal().toString() ?? "";
  const isAttending = (meet as any)?.attendees?.some(
    (a: UserProfile) => a.id?.toString() === currentUserId
  );

  const handleToggleAttend = () => {
    if (isAttending) {
      leaveMeet.mutate({ meetId });
    } else {
      joinMeet.mutate({ meetId });
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

  const m = meet as any;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/meets" className="p-2 rounded hover:bg-muted transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="flex-1 text-xl font-display font-bold truncate">
          {m.title}
        </h1>
      </div>

      {/* Details Card */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-primary" />
          <span>{m.location}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-primary" />
          <span>
            {new Date(Number(m.date) / 1_000_000).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Car className="h-4 w-4 text-primary" />
          <span>{m.category}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-primary" />
          <span>{(m.attendees ?? []).length} attending</span>
        </div>
      </div>

      {/* Description */}
      {m.description && (
        <div className="mb-4">
          <h2 className="font-display font-semibold mb-2">About</h2>
          <p className="text-sm text-muted-foreground">{m.description}</p>
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
      {(m.attendees ?? []).length > 0 && (
        <div className="mt-6">
          <h2 className="font-display font-semibold mb-3">
            Attendees ({(m.attendees ?? []).length})
          </h2>
          <div className="space-y-2">
            {(m.attendees as UserProfile[]).map((attendee, idx) => (
              <Link
                key={attendee.id?.toString() ?? idx}
                to="/profile/$userId"
                params={{ userId: attendee.id?.toString() ?? "" }}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-muted overflow-hidden flex-shrink-0">
                  {attendee.avatarUrl ? (
                    <img
                      src={attendee.avatarUrl}
                      alt={attendee.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {attendee.username?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium">{attendee.username}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
