import React, { useCallback, memo } from 'react';
import { VirtuosoGrid } from 'react-virtuoso';
import { Cat } from '@/types/game';
import { CatRelationship } from '@/types/relationships';
import { CatReaction } from '@/contexts/CatReactionContext';
import { UnifiedCatCard } from './UnifiedCatCard';

interface VirtualizedCatGridProps {
  cats: Cat[];
  relationships: CatRelationship[];
  allCats: Cat[];
  catCostumes: Record<string, string>;
  variant?: 'card' | 'trading';
  getCatReaction?: (catId: string) => CatReaction | undefined;
  onSell?: (catId: string) => void;
  onHeal?: (catId: string) => void;
  onComfort?: (catId: string) => void;
  onRename?: (catId: string, newName: string) => void;
  onClick?: (cat: Cat) => void;
  showStats?: boolean;
  showRelationships?: boolean;
  showActions?: boolean;
  showFlip?: boolean;
  animated?: boolean;
  className?: string;
  /** Minimum number of cats to enable virtualization (default: 20) */
  virtualizationThreshold?: number;
}


// Custom list container for VirtuosoGrid - responsive columns via CSS class
const ListContainer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ style, children, ...props }, ref) => (
    <div
      ref={ref}
      {...props}
      className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
      style={style}
    >
      {children}
    </div>
  )
);
ListContainer.displayName = 'ListContainer';

// Memoized cat card wrapper
const CatCardItem = memo(function CatCardItem({
  cat,
  relationships,
  allCats,
  catCostumes,
  variant,
  reaction,
  onSell,
  onHeal,
  onComfort,
  onRename,
  onClick,
  showStats,
  showRelationships,
  showActions,
  showFlip,
  animated,
}: {
  cat: Cat;
  relationships: CatRelationship[];
  allCats: Cat[];
  catCostumes: Record<string, string>;
  variant: 'card' | 'trading';
  reaction?: CatReaction;
  onSell?: (catId: string) => void;
  onHeal?: (catId: string) => void;
  onComfort?: (catId: string) => void;
  onRename?: (catId: string, newName: string) => void;
  onClick?: (cat: Cat) => void;
  showStats?: boolean;
  showRelationships?: boolean;
  showActions?: boolean;
  showFlip?: boolean;
  animated?: boolean;
}) {
  return (
    <UnifiedCatCard
      cat={cat}
      variant={variant}
      equippedCostumeId={catCostumes[cat.id]}
      onSell={onSell}
      onHeal={onHeal}
      onComfort={onComfort}
      onRename={onRename}
      onClick={onClick ? () => onClick(cat) : undefined}
      relationships={relationships}
      allCats={allCats}
      reaction={reaction}
      showStats={showStats}
      showRelationships={showRelationships}
      showActions={showActions}
      showFlip={showFlip}
      animated={animated}
    />
  );
});

/**
 * VirtualizedCatGrid - Renders a virtualized grid of cat cards
 * 
 * Uses react-virtuoso's VirtuosoGrid for efficient rendering of large cat lists.
 * Falls back to a regular grid for small lists (<20 cats by default).
 */
export const VirtualizedCatGrid = memo(function VirtualizedCatGrid({
  cats,
  relationships,
  allCats,
  catCostumes,
  variant = 'card',
  getCatReaction,
  onSell,
  onHeal,
  onComfort,
  onRename,
  onClick,
  showStats,
  showRelationships,
  showActions,
  showFlip,
  animated,
  className,
  virtualizationThreshold = 20,
}: VirtualizedCatGridProps) {
  // Memoize the item content renderer
  const itemContent = useCallback(
    (index: number) => {
      const cat = cats[index];
      if (!cat) return null;

      return (
        <CatCardItem
          key={cat.id}
          cat={cat}
          relationships={relationships}
          allCats={allCats}
          catCostumes={catCostumes}
          variant={variant}
          reaction={getCatReaction?.(cat.id)}
          onSell={onSell}
          onHeal={onHeal}
          onComfort={onComfort}
          onRename={onRename}
          onClick={onClick}
          showStats={showStats}
          showRelationships={showRelationships}
          showActions={showActions}
          showFlip={showFlip}
          animated={animated}
        />
      );
    },
    [
      cats,
      relationships,
      allCats,
      catCostumes,
      variant,
      getCatReaction,
      onSell,
      onHeal,
      onComfort,
      onRename,
      onClick,
      showStats,
      showRelationships,
      showActions,
      showFlip,
      animated,
    ]
  );

  // For small lists, use regular grid (virtualization overhead not worth it)
  if (cats.length < virtualizationThreshold) {
    return (
      <div className={`grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 ${className || ''}`}>
        {cats.map((cat) => (
          <CatCardItem
            key={cat.id}
            cat={cat}
            relationships={relationships}
            allCats={allCats}
            catCostumes={catCostumes}
            variant={variant}
            reaction={getCatReaction?.(cat.id)}
            onSell={onSell}
            onHeal={onHeal}
            onComfort={onComfort}
            onRename={onRename}
            onClick={onClick}
            showStats={showStats}
            showRelationships={showRelationships}
            showActions={showActions}
            showFlip={showFlip}
            animated={animated}
          />
        ))}
      </div>
    );
  }

  // Use virtualized grid for large lists
  return (
    <VirtuosoGrid
      totalCount={cats.length}
      overscan={200}
      useWindowScroll
      components={{
        List: ListContainer,
      }}
      itemContent={itemContent}
      className={className}
    />
  );
});

export default VirtualizedCatGrid;
