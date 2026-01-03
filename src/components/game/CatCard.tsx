/**
 * CatCard - Individual cat display component
 * 
 * This component is now a wrapper around UnifiedCatCard for backward compatibility.
 * New code should use UnifiedCatCard directly with the appropriate variant.
 * 
 * @deprecated Use UnifiedCatCard with variant="card" instead
 */

import { UnifiedCatCard, UnifiedCatCardProps } from './UnifiedCatCard';
import { Cat } from '@/types/game';
import { CatRelationship } from '@/types/relationships';
import { CatReaction } from '@/contexts/CatReactionContext';

/**
 * Props for the CatCard component (backward compatible)
 */
interface CatCardProps {
  cat: Cat;
  onSell: (id: string) => void;
  onHeal: (id: string) => void;
  onComfort?: (id: string) => void;
  onRename?: (catId: string, newName: string) => void;
  compact?: boolean;
  relationships?: CatRelationship[];
  allCats?: Cat[];
  equippedCostumeId?: string;
  reaction?: CatReaction;
}

/**
 * CatCard - Displays an individual cat with stats, actions, and customization
 * 
 * @deprecated Use UnifiedCatCard with variant="card" or variant="compact"
 */
export function CatCard({
  cat,
  onSell,
  onHeal,
  onComfort,
  onRename,
  compact = false,
  relationships = [],
  allCats = [],
  equippedCostumeId,
  reaction,
}: CatCardProps) {
  return (
    <UnifiedCatCard
      cat={cat}
      variant={compact ? 'compact' : 'card'}
      equippedCostumeId={equippedCostumeId}
      relationships={relationships}
      allCats={allCats}
      onSell={onSell}
      onHeal={onHeal}
      onComfort={onComfort}
      onRename={onRename}
      reaction={reaction}
      showStats={!compact}
      showRelationships={!compact}
      showActions={!compact}
    />
  );
}

export default CatCard;
