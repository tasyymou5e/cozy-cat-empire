import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MarketListing, BREEDS } from '@/types/game';
import { Badge } from '@/components/ui/badge';

interface MarketPanelProps {
  listings: MarketListing[];
  money: number;
  hasSpace: boolean;
  onBuy: (listingId: string) => void;
}

const catEmojis: Record<string, string> = {
  'stray': '🐱',
  'tabby': '🐈',
  'persian': '😺',
  'siamese': '😸',
  'maine-coon': '🦁',
  'british-shorthair': '😻',
  'ragdoll': '🐾',
  'bengal': '🐆',
};

export function MarketPanel({ listings, money, hasSpace, onBuy }: MarketPanelProps) {
  const [animatingListing, setAnimatingListing] = useState<string | null>(null);

  const handleBuy = (listingId: string, price: number) => {
    if (money >= price && hasSpace) {
      setAnimatingListing(listingId);
      setTimeout(() => setAnimatingListing(null), 600);
    }
    onBuy(listingId);
  };

  return (
    <div className="market-panel">
      <h3 className="font-bold text-lg mb-3">🛒 Cat Market</h3>
      <p className="text-xs text-muted-foreground mb-3">Refreshes every 3 days</p>
      
      {listings.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No cats available. Check back later!</p>
      ) : (
        <div className="space-y-2">
          {listings.map(listing => {
            const breed = BREEDS[listing.cat.breed];
            const isAnimating = animatingListing === listing.id;
            return (
              <div 
                key={listing.id} 
                className={`market-listing transition-all duration-300 ${
                  isAnimating 
                    ? 'scale-105 ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/20' 
                    : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-2xl transition-transform duration-300 ${
                    isAnimating ? 'scale-125' : ''
                  }`}>
                    {catEmojis[listing.cat.breed]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{listing.cat.name}</p>
                      <Badge variant="outline" className="text-xs">{breed.name}</Badge>
                      {isAnimating && (
                        <span className="text-xs text-green-500 font-medium animate-fade-in">Purchased!</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{listing.seller}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold transition-all duration-300 ${
                      isAnimating ? 'text-green-500 scale-110' : 'text-primary'
                    }`}>
                      ${listing.price}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => handleBuy(listing.id, listing.price)}
                      disabled={money < listing.price || !hasSpace}
                      className="mt-1 h-7 text-xs"
                    >
                      Buy
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
