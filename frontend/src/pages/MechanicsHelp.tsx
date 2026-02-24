import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Plus, Wrench, MessageSquare, Clock } from 'lucide-react';
import { type MechanicsPost, useGetAllMechanicsPosts } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import PostIssueModal from '../components/PostIssueModal';

const CATEGORIES = ['All', 'Engine', 'Brakes', 'Suspension', 'Electrical', 'Bodywork', 'Transmission', 'Other'];

function timeAgo(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function PostCard({ post }: { post: MechanicsPost }) {
  return (
    <Link to="/mechanics/$postId" params={{ postId: String(post.id) }} className="block">
      <div className="bg-card border border-border rounded-2xl p-4 hover:border-neon-orange/40 transition-colors">
        <div className="flex items-start gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-neon-orange/10 flex items-center justify-center flex-shrink-0">
            <Wrench size={18} className="text-neon-orange" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground text-base leading-tight line-clamp-1">{post.title}</h3>
            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-neon-orange/20 text-neon-orange text-xs font-bold">
              {post.category}
            </span>
          </div>
        </div>
        <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{post.description}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <MessageSquare size={12} />
            <span>{post.comments.length} replies</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>{timeAgo(post.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function MechanicsHelp() {
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { data: posts = [], isLoading } = useGetAllMechanicsPosts();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const filtered = selectedCategory === 'All'
    ? posts
    : posts.filter(p => p.category === selectedCategory);

  const sorted = [...filtered].sort((a, b) => Number(b.createdAt) - Number(a.createdAt));

  return (
    <div className="min-h-screen bg-background pb-24 pt-20">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-3xl font-display font-bold text-foreground">Mechanics Help</h1>
          {isAuthenticated && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-neon-orange text-black font-bold text-base hover:bg-neon-orange/90 transition-colors"
            >
              <Plus size={18} />
              Ask
            </button>
          )}
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-bold transition-colors ${
                selectedCategory === cat
                  ? 'bg-neon-orange text-black'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-neon-orange border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Wrench size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No posts yet</p>
            <p className="text-sm mt-1">Be the first to ask a question!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sorted.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <PostIssueModal open={showModal} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
