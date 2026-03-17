import React, { useCallback, memo } from 'react';
import { VirtuosoGrid } from 'react-virtuoso';
import { Cat } from '@/types/game';
import { CatRelationship } from '@/types/relationships';
import { CatReaction } from '@/contexts/CatReactionContext';
import { UnifiedCatCard } from './UnifiedCatCard';
import { PokemonCard } from './PokemonCard';

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

// Custom list container for VirtuosoGrid
const ListContainer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ style, children, ...props }, ref) => (
    <div
      ref={ref}
      {...props}
      className="grid gap-6 justify-items-center"
      style={{ ...style, gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}
    >
      {children}
    </div>
  )
);
ListContainer.displayName = 'ListContainer';

// Legacy list container for non-trading variants
const LegacyListContainer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
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
LegacyListContainer.displayName = 'LegacyListContainer';

// Memoized PokemonCard wrapper for trading variant
const PokemonCardItem = memo(function PokemonCardItem({
  cat,
  onClick,
  showFlip,
}: {
  cat: Cat;
  onClick?: (cat: Cat) => void;
  showFlip?: boolean;
}) {
  return (
    <PokemonCard
      cat={cat}
      showFlip={showFlip}
      onClick={onClick ? () => onClick(cat) : undefined}
      isOwned
    />
  );
});

// Memoized cat card wrapper for non-trading variants
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
 * VirtualizedCatGrid - Renders a grid of cat cards
 * 
 * When variant is "trading", uses PokemonCard (Cat Empire Cards style).
 * Otherwise uses UnifiedCatCard.
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
  const isTrading = variant === 'trading';

  // For trading variant, render PokemonCards
  if (isTrading) {
    if (cats.length < virtualizationThreshold) {
      return (
        <div
          className={`grid gap-6 justify-items-center ${className || ''}`}
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}
        >
          {cats.map((cat) => (
            <PokemonCardItem
              key={cat.id}
              cat={cat}
              onClick={onClick}
              showFlip={showFlip}
            />
          ))}
        </div>
      );
    }

    return (
      <VirtuosoGrid
        totalCount={cats.length}
        overscan={200}
        useWindowScroll
        components={{ List: ListContainer }}
        itemContent={(index) => {
          const cat = cats[index];
          if (!cat) return null;
          return (
            <PokemonCardItem
              key={cat.id}
              cat={cat}
              onClick={onClick}
              showFlip={showFlip}
            />
          );
        }}
        className={className}
      />
    );
  }

  // Non-trading variant: use UnifiedCatCard
  const renderItem = (cat: Cat) => (
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

  if (cats.length < virtualizationThreshold) {
    return (
      <div className={`grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 ${className || ''}`}>
        {cats.map(renderItem)}
      </div>
    );
  }

  return (
    <VirtuosoGrid
      totalCount={cats.length}
      overscan={200}
      useWindowScroll
      components={{ List: LegacyListContainer }}
      itemContent={(index) => {
        const cat = cats[index];
        if (!cat) return null;
        return renderItem(cat);
      }}
      className={className}
    />
  );
});

export default VirtualizedCatGrid;
