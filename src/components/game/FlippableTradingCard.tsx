/**
 * FlippableTradingCard - Trading card with flip animation
 * 
 * This component is now a wrapper around UnifiedCatCard for backward compatibility.
 * New code should use UnifiedCatCard directly with variant="trading".
 * 
 * @deprecated Use UnifiedCatCard with variant="trading" and showFlip={true} instead
 */

import { UnifiedCatCard } from './UnifiedCatCard';
import { Cat } from '@/types/game';
import { CatRelationship } from '@/types/relationships';

interface FlippableTradingCardProps {
  cat: Cat;
  relationships: CatRelationship[];
  allCats: Cat[];
  onClick: () => void;
  equippedCostumeId?: string;
}

/**
 * FlippableTradingCard - Trading card style display with flip animation
 * 
 * @deprecated Use UnifiedCatCard with variant="trading" instead
 */
export function FlippableTradingCard({
  cat,
  relationships,
  allCats,
  onClick,
  equippedCostumeId,
}: FlippableTradingCardProps) {
  return (
    <UnifiedCatCard
      cat={cat}
      variant="trading"
      equippedCostumeId={equippedCostumeId}
      relationships={relationships}
      allCats={allCats}
      onClick={onClick}
      showFlip
      animated
    />
  );
}

export default FlippableTradingCard;
