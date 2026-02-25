import { useParams, useNavigate, Link } from "@tanstack/react-router";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetListing, useDeactivateListing, useGetUserProfile } from "../hooks/useQueries";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tag, Car, DollarSign, ChevronLeft, Loader2, User } from "lucide-react";

export default function ListingDetails() {
  const { listingId } = useParams({ from: "/app-layout/classifieds/$listingId" });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();

  const id = Number(listingId);
  const { data: listing, isLoading } = useGetListing(isNaN(id) ? 0 : id);
  const deactivate = useDeactivateListing();

  const sellerId = (listing as any)?.sellerId?.toString() ?? "";
  const { data: sellerProfile } = useGetUserProfile(sellerId);

  const currentUserId = identity?.getPrincipal().toString() ?? "";
  const isSeller = !!currentUserId && currentUserId === sellerId;

  const handleDeactivate = async () => {
    if (!listing) return;
    await deactivate.mutateAsync({ id: Number((listing as any).id) });
    navigate({ to: "/classifieds" });
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (!listing || !(listing as any).isActive) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Tag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-display font-bold mb-2">
          Listing Not Found
        </h2>
        <Link to="/classifieds" className="text-primary hover:underline">
          Back to Classifieds
        </Link>
      </div>
    );
  }

  const l = listing as any;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/classifieds"
          className="p-2 rounded hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="flex-1 text-xl font-display font-bold truncate">
          {l.title}
        </h1>
        {isSeller && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="text-sm text-destructive hover:underline">
                Remove
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Listing?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will deactivate your listing. It cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeactivate}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deactivate.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Remove"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Image */}
      {l.imageUrl && (
        <img
          src={l.imageUrl}
          alt={l.title}
          className="w-full rounded-xl object-cover max-h-64 mb-4"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      )}

      {/* Details */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <Car className="h-4 w-4 text-primary" />
          <span>
            {l.year} {l.make} {l.model}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <DollarSign className="h-4 w-4 text-primary" />
          <span className="font-bold text-lg">{l.price}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Tag className="h-4 w-4 text-primary" />
          <span>
            {l.category} · {l.condition}
          </span>
        </div>
      </div>

      {/* Description */}
      {l.description && (
        <div className="mb-4">
          <h2 className="font-display font-semibold mb-2">Description</h2>
          <p className="text-sm text-muted-foreground">{l.description}</p>
        </div>
      )}

      {/* Seller */}
      {sellerProfile && (
        <div className="bg-muted/30 rounded-xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            {sellerProfile.avatarUrl ? (
              <img
                src={sellerProfile.avatarUrl}
                alt={sellerProfile.username}
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">{sellerProfile.username}</p>
            <Link
              to="/profile/$userId"
              params={{ userId: sellerId }}
              className="text-xs text-primary hover:underline"
            >
              View Profile
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
