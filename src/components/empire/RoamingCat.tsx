import { useMemo } from 'react';
import { Cat } from '@/types/game';
import { CatPosition, EmpireInteraction } from '@/types/empire';
import { CatVisual } from '@/components/game/CatVisual';
import { CatCardReaction } from '@/components/game/CatCardReaction';
import { useCatReactions } from '@/contexts/CatReactionContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EmpireInteractionMenu } from './EmpireInteractionMenu';
import { MOVEMENT_TIMING } from '@/config/empire';
import { cn } from '@/lib/utils';

interface RoamingCatProps {
  cat: Cat;
  position: CatPosition;
  equippedCostumeId?: string;
  onInteract: (catId: string, action: EmpireInteraction) => void;
  canFeed: boolean;
  canPlay: boolean;
}

/**
 * Get state-specific emoji indicator
 */
function getStateIndicator(state: CatPosition['state']): { emoji: string; animation: string } | null {
  switch (state) {
    case 'sleeping':
      return { emoji: '💤', animation: 'animate-pulse' };
    case 'playing':
      return { emoji: '🎾', animation: 'animate-bounce' };
    case 'perching':
      return { emoji: '👀', animation: '' };
    case 'sunbathing':
      return { emoji: '☀️', animation: 'animate-pulse' };
    case 'interacting':
      return { emoji: '💕', animation: 'animate-bounce' };
    default:
      return null;
  }
}

/**
 * A single roaming cat in the Empire scene
 * Handles positioning, animation, and click interactions
 */
export function RoamingCat({
  cat,
  position,
  equippedCostumeId,
  onInteract,
  canFeed,
  canPlay,
}: RoamingCatProps) {
  const { getCatReaction } = useCatReactions();
  const reaction = getCatReaction(cat.id);

  // Z-index based on Y position (lower = further back, higher = closer to viewer)
  const zIndex = useMemo(() => Math.floor(position.y), [position.y]);

  // Calculate scale based on Y position for depth effect
  const scale = useMemo(() => {
    const minScale = 0.7;
    const maxScale = 1.0;
    const normalizedY = (position.y - 35) / 50; // 35-85 range
    return minScale + normalizedY * (maxScale - minScale);
  }, [position.y]);

  const handleAction = (action: EmpireInteraction) => {
    onInteract(cat.id, action);
  };

  const stateIndicator = getStateIndicator(position.state);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className={cn(
            'absolute cursor-pointer group',
            'hover:scale-110 hover:z-50',
            'transition-all ease-in-out',
            position.state === 'walking' && 'animate-cat-walk',
            position.state === 'sleeping' && 'opacity-90'
          )}
          style={{
            left: `${position.x}%`,
            top: `${position.y}%`,
            transform: `translate(-50%, -50%) scaleX(${position.facing === 'left' ? -1 : 1}) scale(${scale})`,
            zIndex,
            transitionDuration: `${MOVEMENT_TIMING.transitionDuration}ms`,
            transitionProperty: 'left, top',
          }}
        >
          {/* Cat Visual */}
          <div className="relative">
            <CatVisual
              cat={cat}
              equippedCostumeId={equippedCostumeId}
              size="lg"
              animated
            />
            
            {/* Reaction overlay */}
            {reaction && <CatCardReaction reaction={reaction} />}
            
            {/* State indicator */}
            {stateIndicator && (
              <div className={cn(
                'absolute -top-2 left-1/2 -translate-x-1/2',
                stateIndicator.animation
              )}>
                <span className="text-xl">{stateIndicator.emoji}</span>
              </div>
            )}
          </div>
          
          {/* Name label on hover */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-5 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs font-medium bg-background/80 px-1.5 py-0.5 rounded whitespace-nowrap shadow-sm">
              {cat.name}
            </span>
          </div>
        </div>
      </PopoverTrigger>
      
      <PopoverContent 
        side="top" 
        className="p-0 w-auto"
        sideOffset={8}
      >
        <EmpireInteractionMenu
          cat={cat}
          onAction={handleAction}
          canFeed={canFeed}
          canPlay={canPlay}
        />
      </PopoverContent>
    </Popover>
  );
}
