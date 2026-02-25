import { Link } from "@tanstack/react-router";
import { useGetListings } from "../hooks/useQueries";
import type { Listing } from "../hooks/useQueries";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag, Car, DollarSign } from "lucide-react";

export default function Classifieds() {
  const { data: listings = [], isLoading } = useGetListings();

  const activeListings = (listings as Listing[]).filter((l) => l.isActive);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">Classifieds</h1>
        <Link
          to="/classifieds/$listingId"
          params={{ listingId: "new" }}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Tag className="h-4 w-4" />
          Post Listing
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : activeListings.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Tag className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No listings yet</p>
          <p className="text-sm">Be the first to post a car or part!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeListings.map((listing) => (
            <Link
              key={listing.id}
              to="/classifieds/$listingId"
              params={{ listingId: String(listing.id) }}
              className="block bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex gap-3">
                {listing.imageUrl && (
                  <img
                    src={listing.imageUrl}
                    alt={listing.title}
                    className="h-20 w-20 rounded-lg object-cover flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-base truncate">
                    {listing.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Car className="h-3 w-3" />
                      {listing.year} {listing.make} {listing.model}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {listing.price}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {listing.description}
                  </p>
                  <div className="mt-1">
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                      {listing.condition}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
