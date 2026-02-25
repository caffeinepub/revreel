import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCarMeets } from "../hooks/useQueries";
import type { CarMeet } from "../hooks/useQueries";
import { Skeleton } from "@/components/ui/skeleton";
import CarMeetCard from "../components/CarMeetCard";
import PostMeetModal from "../components/PostMeetModal";
import { Car, Plus } from "lucide-react";

export default function CarMeets() {
  const { identity } = useInternetIdentity();
  const { data: meets = [], isLoading } = useGetCarMeets();
  const [showModal, setShowModal] = useState(false);

  const isAuthenticated = !!identity;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">Car Meets</h1>
        {isAuthenticated && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Post Meet
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : (meets as CarMeet[]).length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Car className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No car meets yet</p>
          <p className="text-sm">Be the first to organize a meet!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(meets as CarMeet[]).map((meet) => (
            <CarMeetCard
              key={meet.id}
              meet={meet}
            />
          ))}
        </div>
      )}

      <PostMeetModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
