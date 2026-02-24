import React, { useState } from 'react';
import { type Listing, useGetAllActiveListings } from '../hooks/useQueries';
import { Link } from '@tanstack/react-router';
import { ShoppingBag, Loader2, Plus, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import PostListingModal from '../components/PostListingModal';

export default function Classifieds() {
  const { data: listings = [], isLoading } = useGetAllActiveListings();
  const { identity } = useInternetIdentity();
  const [showModal, setShowModal] = useState(false);

  const activeListings = listings.filter((l: Listing) => l.isActive);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-primary" />
          <h1 className="font-display text-2xl font-black text-primary neon-text">Classifieds</h1>
        </div>
        {identity && (
          <Button
            onClick={() => setShowModal(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
          >
            <Plus className="w-4 h-4 mr-1" />
            Post Listing
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : activeListings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <ShoppingBag className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-lg font-semibold">No listings yet</p>
          <p className="text-sm mt-1">Be the first to post a listing!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeListings.map((listing: Listing) => (
            <Link
              key={listing.id.toString()}
              to="/classifieds/$listingId"
              params={{ listingId: listing.id.toString() }}
              className="block rounded-xl bg-card border border-border hover:border-primary/50 transition-colors overflow-hidden"
            >
              {listing.imageUrl ? (
                <img
                  src={listing.imageUrl}
                  alt={listing.title}
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-40 bg-muted flex items-center justify-center">
                  <ShoppingBag className="w-10 h-10 text-muted-foreground/30" />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-bold text-sm truncate">{listing.title}</h3>
                <p className="text-primary font-bold text-lg mt-1">${listing.price}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">
                    {listing.year} {listing.make} {listing.model}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Tag className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{listing.condition}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <PostListingModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
