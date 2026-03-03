import React from 'react';
import { ExternalLink } from 'lucide-react';

const EBAY_AFFILIATE_URL =
  'https://ebay.com/inf/revreel?mkcid=1&mkrid=711-53200-19255-0&siteid=0&campid=5339143418&toolid=80008&mkevt=1';

interface AftermarketAdBannerProps {
  className?: string;
}

export default function AftermarketAdBanner({ className = '' }: AftermarketAdBannerProps) {
  return (
    <a
      href={EBAY_AFFILIATE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`block group relative overflow-hidden rounded-xl border border-neon-orange/30 bg-card/80 backdrop-blur-sm hover:border-neon-orange/70 transition-all duration-300 hover:shadow-neon ${className}`}
    >
      {/* Sponsored label */}
      <span className="absolute top-2 left-2 z-10 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground bg-background/70 px-1.5 py-0.5 rounded">
        Sponsored
      </span>

      <div className="flex items-center gap-0 overflow-hidden">
        {/* Banner image */}
        <div className="relative flex-shrink-0 w-full">
          <img
            src="/assets/generated/aftermarket-ad-banner.dim_800x160.png"
            alt="Shop Aftermarket Car Parts on eBay"
            className="w-full h-auto object-cover"
            style={{ maxHeight: '120px', objectPosition: 'center' }}
          />
          {/* Overlay gradient + CTA */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/10 via-transparent to-background/80 flex items-center justify-end pr-4">
            <div className="flex flex-col items-end gap-1">
              <span className="font-display font-bold text-sm text-foreground drop-shadow-lg leading-tight text-right">
                Shop Aftermarket Parts
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold text-neon-orange group-hover:text-neon-yellow transition-colors">
                Find deals on eBay
                <ExternalLink className="h-3 w-3" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}
