import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Plus, ShoppingBag, Tag, Car } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetAllActiveListings, useGetUserProfile } from '../hooks/useQueries';
import { Listing } from '../backend';
import PostListingModal from '../components/PostListingModal';

function ListingCard({ listing, onClick }: { listing: Listing; onClick: () => void }) {
  const { data: seller } = useGetUserProfile(listing.sellerId.toString());

  const conditionColor = {
    New: 'text-green-400 border-green-400/30 bg-green-400/10',
    Used: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
    Parts: 'text-red-400 border-red-400/30 bg-red-400/10',
  }[listing.condition] ?? 'text-muted-foreground border-border bg-card/50';

  return (
    <div
      onClick={onClick}
      className="bg-card/60 backdrop-blur border border-border hover:border-neon-orange/50 rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-neon group"
    >
      <div className="aspect-video bg-background/50 overflow-hidden">
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={e => {
              e.currentTarget.src = '/assets/generated/placeholder-thumb.dim_640x360.png';
            }}
          />
        ) : (
          <img
            src="/assets/generated/placeholder-thumb.dim_640x360.png"
            alt="placeholder"
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display font-bold text-foreground group-hover:text-neon-orange transition-colors line-clamp-1 text-sm">
            {listing.title}
          </h3>
          <span className={`text-xs px-1.5 py-0.5 rounded border flex-shrink-0 ${conditionColor}`}>
            {listing.condition}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-1">
          {listing.year} {listing.make} {listing.model}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-neon-orange font-bold text-sm">${listing.price}</span>
          <span className="text-xs text-muted-foreground">{seller?.username ?? '...'}</span>
        </div>
        <div className="mt-1.5">
          <span className="text-xs text-muted-foreground/70 bg-muted/30 px-1.5 py-0.5 rounded">
            {listing.category}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Classifieds() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: listings, isLoading } = useGetAllActiveListings();
  const [showModal, setShowModal] = useState(false);

  const sorted = listings
    ? [...listings].sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
    : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-neon-orange" />
          Classifieds
        </h1>
        <p className="text-sm text-muted-foreground">{sorted.length} listings</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[4/5] rounded-xl bg-card/50 animate-pulse border border-border" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">No listings yet</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Be the first to post a listing!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {sorted.map(listing => (
            <ListingCard
              key={String(listing.id)}
              listing={listing}
              onClick={() => navigate({ to: '/classifieds/$listingId', params: { listingId: String(listing.id) } })}
            />
          ))}
        </div>
      )}

      {identity && (
        <button
          onClick={() => setShowModal(true)}
          className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-neon-orange text-black flex items-center justify-center shadow-neon hover:bg-neon-yellow transition-colors z-40"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      <PostListingModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
