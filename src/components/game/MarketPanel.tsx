import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MarketListing, BREEDS } from '@/types/game';
import { Badge } from '@/components/ui/badge';
import { useConfetti } from '@/hooks/useConfetti';
import { CatVisual } from './CatVisual';

/**
 * Props for the MarketPanel component
 */
interface MarketPanelProps {
  /** Array of available market listings */
  listings: MarketListing[];
  /** Current money available */
  money: number;
  /** Whether there is space for a new cat */
  hasSpace: boolean;
  /** Callback when buying a cat from the market */
  onBuy: (listingId: string) => void;
}

/**
 * MarketPanel - Cat marketplace interface
 * 
 * Displays cats available for purchase from NPC sellers.
 * Shows cat details, prices, and handles purchase animations.
 * Market refreshes every 3 days.
 * 
 * @example
 * ```tsx
 * <MarketPanel
 *   listings={marketListings}
 *   money={150}
 *   hasSpace={true}
 *   onBuy={handleBuy}
 * />
 * ```
 */


export function MarketPanel({ listings, money, hasSpace, onBuy }: MarketPanelProps) {
  const [animatingListing, setAnimatingListing] = useState<string | null>(null);
  const { fireConfetti, fireStars } = useConfetti();

  const handleBuy = (listing: MarketListing) => {
    if (money >= listing.price && hasSpace) {
      setAnimatingListing(listing.id);
      setTimeout(() => setAnimatingListing(null), 600);
      
      // Trigger confetti for rare breeds (rarity >= 5) or expensive cats ($500+)
      const breed = BREEDS[listing.cat.breed];
      const isRare = breed.rarity >= 5;
      const isExpensive = listing.price >= 500;
      
      if (isRare) {
        fireStars(); // Star confetti for rare breeds
      } else if (isExpensive) {
        fireConfetti(); // Regular confetti for expensive purchases
      }
    }
    onBuy(listing.id);
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
                  <div className={`transition-transform duration-300 ${
                    isAnimating ? 'scale-110' : ''
                  }`}>
                    <CatVisual cat={listing.cat} size="sm" animated />
                  </div>
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
                      onClick={() => handleBuy(listing)}
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
