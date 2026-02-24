import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Plus, Tag, Car, DollarSign } from 'lucide-react';
import { type Listing, useGetAllActiveListings } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import PostListingModal from '../components/PostListingModal';

const CATEGORIES = ['Cars', 'Parts', 'Wheels', 'Audio', 'Exterior', 'Interior', 'Tools', 'Other'];

function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link to="/classifieds/$listingId" params={{ listingId: String(listing.id) }} className="block">
      <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-neon-orange/40 transition-colors">
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-full h-44 object-cover"
          />
        ) : (
          <div className="w-full h-44 bg-muted flex items-center justify-center">
            <Car size={40} className="text-muted-foreground opacity-40" />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-foreground text-base leading-tight line-clamp-1">{listing.title}</h3>
            <span className="flex-shrink-0 flex items-center gap-1 text-neon-orange font-bold text-base">
              <DollarSign size={14} />
              {listing.price}
            </span>
          </div>
          <p className="text-muted-foreground text-sm line-clamp-2 mb-2">{listing.description}</p>
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-full bg-neon-orange/20 text-neon-orange text-xs font-bold">
              {listing.category}
            </span>
            <span className="text-muted-foreground text-xs">{listing.condition}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Classifieds() {
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { data: listings = [], isLoading } = useGetAllActiveListings();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const filtered = selectedCategory
    ? listings.filter(l => l.category === selectedCategory)
    : listings;

  return (
    <div className="min-h-screen bg-background pb-24 pt-20">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-3xl font-display font-bold text-foreground">Classifieds</h1>
          {isAuthenticated && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-neon-orange text-black font-bold text-base hover:bg-neon-orange/90 transition-colors"
            >
              <Plus size={18} />
              Post
            </button>
          )}
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-bold transition-colors ${
              !selectedCategory
                ? 'bg-neon-orange text-black'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-bold transition-colors ${
                selectedCategory === cat
                  ? 'bg-neon-orange text-black'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <Tag size={12} />
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-neon-orange border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Tag size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No listings found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <PostListingModal open={showModal} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
