import React, { Suspense, lazy } from 'react';
import { Cat } from '@/types/game';
import { CatAvatar } from './CatAvatar';
import { getGradeTier, getGradeStars } from '@/types/grading';
import { Star, Crown, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GRAPHICS_CONFIG } from '@/config/graphics';
import { COSTUMES } from '@/types/costumes';

// Lazy load PaperCatAvatar for code splitting
const PaperCatAvatar = lazy(() => import('./PaperCatAvatar'));

/**
 * Size options for CatVisual component
 * Includes all avatar sizes plus 'portrait' for larger displays
 */
export type CatVisualSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'portrait';

/**
 * Props for the CatVisual component
 */
export interface CatVisualProps {
  /** The cat data to display */
  cat: Cat;
  /** Optional costume ID to display on the cat */
  equippedCostumeId?: string;
  /** Size variant for the visual */
  size?: CatVisualSize;
  /** Show AI-generated portrait if available (falls back to avatar) */
  preferPortrait?: boolean;
  /** Enable micro-animations */
  animated?: boolean;
  /** Show grade overlay on portrait */
  showGrade?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Callback when portrait fails to load */
  onPortraitError?: () => void;
}

/**
 * Size mappings for container dimensions
 */
const sizeClasses: Record<CatVisualSize, string> = {
  xs: 'w-8 h-8',
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
  xl: 'w-32 h-32',
  portrait: 'w-48 h-48',
};

/**
 * Avatar size mappings (portrait uses xl)
 */
const avatarSizeMap: Record<CatVisualSize, 'xs' | 'sm' | 'md' | 'lg' | 'xl'> = {
  xs: 'xs',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'xl',
  portrait: 'xl',
};

/**
 * Tier icon component for grade display
 */
function TierIcon({ tier, className }: { tier: string; className?: string }) {
  switch (tier) {
    case 'ultraRare':
      return <Crown className={cn(className, 'text-pink-400 animate-pulse')} />;
    case 'veryRare':
      return <Crown className={cn(className, 'text-yellow-400')} />;
    case 'rare':
      return <Trophy className={cn(className, 'text-purple-400')} />;
    case 'uncommon':
      return <Star className={cn(className, 'text-blue-400')} />;
    default:
      return <Star className={cn(className, 'text-muted-foreground')} />;
  }
}

/**
 * Tier-specific star colors
 */
const tierStarColors: Record<string, string> = {
  ultraRare: 'fill-pink-400 text-pink-400',
  veryRare: 'fill-yellow-400 text-yellow-400',
  rare: 'fill-purple-400 text-purple-400',
  uncommon: 'fill-blue-400 text-blue-400',
  common: 'fill-muted-foreground text-muted-foreground',
};

/**
 * Tier-specific grade text colors
 */
const tierGradeColors: Record<string, string> = {
  ultraRare: 'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent',
  veryRare: 'text-yellow-300',
  rare: 'text-purple-300',
  uncommon: 'text-blue-300',
  common: 'text-white',
};

/**
 * Tier-specific border colors
 */
const tierBorderColors: Record<string, string> = {
  ultraRare: 'border-pink-400',
  veryRare: 'border-yellow-400',
  rare: 'border-purple-400',
  uncommon: 'border-blue-400',
  common: 'border-primary/20',
};

/**
 * CatVisual - Unified visual representation of a cat
 * 
 * This is the single source of truth for how a cat looks throughout the app.
 * It displays either an AI-generated portrait (if available and preferPortrait=true)
 * or falls back to the CatAvatar component.
 * 
 * The visual always reflects:
 * - Cat's custom appearance (fur color, eye color, pattern, etc.)
 * - Equipped costume
 * - Tier-specific effects (animations, glows for rare cats)
 * 
 * @example
 * ```tsx
 * // Simple avatar
 * <CatVisual cat={myCat} size="md" />
 * 
 * // Portrait with grade overlay
 * <CatVisual 
 *   cat={myCat} 
 *   size="portrait" 
 *   preferPortrait 
 *   showGrade 
 *   equippedCostumeId="crown"
 * />
 * ```
 */
export function CatVisual({
  cat,
  equippedCostumeId,
  size = 'md',
  preferPortrait = GRAPHICS_CONFIG.enablePortraitPriority,
  animated = false,
  showGrade = false,
  className,
  onPortraitError,
}: CatVisualProps) {
  const [portraitFailed, setPortraitFailed] = React.useState(false);
  
  const tier = getGradeTier(cat.grade);
  const stars = getGradeStars(cat.grade);
  const hasPortrait = preferPortrait && cat.portraitUrl && !portraitFailed;
  
  // For portrait mode with showGrade, use larger size display
  const isPortraitMode = size === 'portrait' && hasPortrait;

  const handlePortraitError = () => {
    setPortraitFailed(true);
    onPortraitError?.();
  };

  // Reset portrait failed state if portraitUrl changes
  React.useEffect(() => {
    setPortraitFailed(false);
  }, [cat.portraitUrl]);

  return (
    <div 
      className={cn(
        'relative rounded-xl overflow-hidden',
        sizeClasses[size],
        isPortraitMode && [
          'border-4 shadow-lg',
          tierBorderColors[tier],
          tier === 'ultraRare' && 'animate-rainbow',
          tier === 'veryRare' && 'animate-grade-glow [--grade-color:hsl(45,90%,50%)]',
        ],
        className
      )}
    >
      {/* Portrait Image or Avatar */}
      {hasPortrait ? (
        <>
          <img
            src={cat.portraitUrl}
            alt={`Portrait of ${cat.name}`}
            className="w-full h-full object-cover"
            onError={handlePortraitError}
          />
          
          {/* Grade overlay for portrait mode */}
          {showGrade && (
            <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 via-black/40 to-transparent px-2 py-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <TierIcon tier={tier} className="h-4 w-4 drop-shadow-lg" />
                  <span className={cn(
                    "font-extrabold text-sm drop-shadow-lg",
                    tierGradeColors[tier]
                  )}>
                    {cat.grade}
                  </span>
                </div>
                
                {stars > 0 && (
                  <div className="flex gap-0.5">
                    {Array.from({ length: stars }).map((_, i) => (
                      <Star 
                        key={i} 
                        className={cn(
                          "h-3 w-3 drop-shadow-lg",
                          tierStarColors[tier],
                          tier === 'ultraRare' && "animate-star-spin"
                        )} 
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Costume badge on AI portraits */}
          {GRAPHICS_CONFIG.showCostumeOnPortrait && equippedCostumeId && (
            <div className="absolute bottom-1 right-1 z-10">
              <span className="text-lg drop-shadow-lg">
                {COSTUMES.find(c => c.id === equippedCostumeId)?.emoji || '👔'}
              </span>
            </div>
          )}
          
          {/* Ultra rare sparkle effect */}
          {tier === 'ultraRare' && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/30 animate-shimmer" />
            </div>
          )}
        </>
      ) : GRAPHICS_CONFIG.vectorEngine === 'paperjs' ? (
        /* Paper.js Vector Avatar */
        <Suspense fallback={<div className="w-full h-full bg-muted animate-pulse rounded-full" />}>
          <PaperCatAvatar
            cat={cat}
            equippedCostumeId={equippedCostumeId}
            size={avatarSizeMap[size]}
            showCostume
            animated={animated || tier === 'ultraRare' || tier === 'veryRare'}
          />
        </Suspense>
      ) : (
        /* Fallback to CatAvatar */
        <div className={cn(
          "w-full h-full flex items-center justify-center",
          isPortraitMode && "bg-gradient-to-br from-background to-muted"
        )}>
          <CatAvatar
            cat={cat}
            equippedCostumeId={equippedCostumeId}
            size={avatarSizeMap[size]}
            showCostume
            animated={animated || tier === 'ultraRare' || tier === 'veryRare'}
          />
        </div>
      )}
    </div>
  );
}

export default CatVisual;
