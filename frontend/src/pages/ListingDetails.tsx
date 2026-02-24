import { useParams, useNavigate } from '@tanstack/react-router';
import { ShoppingBag, ChevronLeft, Trash2, User, Calendar } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetListingById, useDeactivateListing, useGetUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';

export default function ListingDetails() {
  const { listingId } = useParams({ from: '/app-layout/classifieds/$listingId' });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const id = parseInt(listingId, 10);
  const { data: listing, isLoading } = useGetListingById(isNaN(id) ? undefined : id);
  const { data: seller } = useGetUserProfile(listing?.sellerId.toString());
  const deactivate = useDeactivateListing();

  const currentUserId = identity?.getPrincipal().toString();
  const isSeller = listing && currentUserId && listing.sellerId.toString() === currentUserId;

  const handleRemove = async () => {
    if (!listing || !confirm('Remove this listing?')) return;
    try {
      await deactivate.mutateAsync(Number(listing.id));
      navigate({ to: '/classifieds' });
    } catch (err) {
      console.error(err);
    }
  };

  const conditionColor = {
    New: 'text-green-400 border-green-400/30 bg-green-400/10',
    Used: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
    Parts: 'text-red-400 border-red-400/30 bg-red-400/10',
  }[listing?.condition ?? ''] ?? 'text-muted-foreground border-border bg-card/50';

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="h-8 w-48 bg-card/50 animate-pulse rounded" />
        <div className="aspect-video bg-card/50 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-muted-foreground">Listing not found</p>
        <button onClick={() => navigate({ to: '/classifieds' })} className="mt-4 text-neon-orange hover:underline text-sm">
          Back to Classifieds
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button
        onClick={() => navigate({ to: '/classifieds' })}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4 text-sm transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Classifieds
      </button>

      <div className="bg-card/60 backdrop-blur border border-border rounded-xl overflow-hidden">
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-full aspect-video object-cover"
            onError={e => { e.currentTarget.src = '/assets/generated/placeholder-thumb.dim_640x360.png'; }}
          />
        ) : (
          <img src="/assets/generated/placeholder-thumb.dim_640x360.png" alt="placeholder" className="w-full aspect-video object-cover" />
        )}

        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="font-display text-2xl font-bold text-foreground">{listing.title}</h1>
            <span className={`text-sm px-2 py-1 rounded border flex-shrink-0 ${conditionColor}`}>
              {listing.condition}
            </span>
          </div>

          <p className="text-neon-orange font-bold text-2xl mb-2">${listing.price}</p>
          <p className="text-muted-foreground text-sm mb-1">
            {listing.year} {listing.make} {listing.model}
          </p>
          <span className="text-xs text-muted-foreground/70 bg-muted/30 px-2 py-0.5 rounded">
            {listing.category}
          </span>

          <div className="mt-4 pt-4 border-t border-border/50">
            <h3 className="font-semibold text-foreground mb-2">Description</h3>
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">{listing.description}</p>
          </div>

          <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {seller?.avatarUrl ? (
                <img src={seller.avatarUrl} alt={seller.username} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-neon-orange/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-neon-orange" />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-foreground">{seller?.username ?? '...'}</p>
                <p className="text-xs text-muted-foreground">Seller</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(Number(listing.createdAt) / 1_000_000).toLocaleDateString()}</span>
            </div>
          </div>

          {isSeller && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <Button
                onClick={handleRemove}
                disabled={deactivate.isPending}
                variant="outline"
                className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deactivate.isPending ? 'Removing...' : 'Remove Listing'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
