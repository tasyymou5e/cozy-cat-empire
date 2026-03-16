import React, { useState, useRef, useEffect, memo } from 'react';
import { Cat, BREEDS, CatBreed, CatPersonality } from '@/types/game';
import { CatRelationship, getRelationshipLevel } from '@/types/relationships';
import {
  getGradeTier,
  getGradeStars,
  getGradeBorderClass,
  TRICKS,
  MAX_GRADE,
} from '@/types/grading';
import { GradeBadge } from './GradeBadge';
import { CatVisual } from './CatVisual';
import { CatAvatar } from './CatAvatar';
import { ComfortButton } from './ComfortButton';
import { CatCardReaction } from './CatCardReaction';
import { CatReaction } from '@/contexts/CatReactionContext';
import {
  getCatRelationships,
  getFriendRelationships,
  getEnemyRelationships,
  getBestFriend,
  needsSocialAttention,
} from '@/lib/relationshipUtils';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Pencil,
  Check,
  X,
  Shuffle,
  Star,
  Heart,
  HeartCrack,
  Trophy,
  RotateCcw,
} from 'lucide-react';
import { useSound } from '@/contexts/SoundContext';
import { cn } from '@/lib/utils';
import { GRAPHICS_CONFIG, getTierVisuals } from '@/config/graphics';

/**
 * Display variant for the UnifiedCatCard
 */
export type CatCardVariant = 'minimal' | 'compact' | 'card' | 'trading' | 'detail';

/**
 * Props for the UnifiedCatCard component
 */
export interface UnifiedCatCardProps {
  /** The cat data to display */
  cat: Cat;
  /** Display variant */
  variant?: CatCardVariant;
  /** ID of equipped costume */
  equippedCostumeId?: string;
  /** Show AI portrait if available (default: based on variant) */
  showPortrait?: boolean;
  /** Show stat bars (health, happiness, hunger) */
  showStats?: boolean;
  /** Show relationship badges */
  showRelationships?: boolean;
  /** Show action buttons (sell, heal, comfort) */
  showActions?: boolean;
  /** Enable flip animation (for trading variant) */
  showFlip?: boolean;
  /** Enable micro-animations */
  animated?: boolean;
  /** Array of relationships for displaying friend/enemy badges */
  relationships?: CatRelationship[];
  /** All cats for relationship calculations */
  allCats?: Cat[];
  /** Click handler */
  onClick?: () => void;
  /** Callback when user sells the cat */
  onSell?: (id: string) => void;
  /** Callback when user heals the cat */
  onHeal?: (id: string) => void;
  /** Callback when user comforts the cat */
  onComfort?: (id: string) => void;
  /** Callback when user renames the cat */
  onRename?: (catId: string, newName: string) => void;
  /** Current reaction animation state */
  reaction?: CatReaction;
  /** Additional CSS classes */
  className?: string;
}

import { generateRandomCatName } from '@/types/catNames';

const personalityEmojis: Record<string, string> = {
  lazy: '😴',
  playful: '🎮',
  affectionate: '💗',
  independent: '😎',
  curious: '🔍',
  shy: '🙈',
};

const personalityColors: Record<string, string> = {
  lazy: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
  playful: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  affectionate: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  independent: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
  curious: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  shy: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
};

const typeLabels: Record<string, { label: string; color: string }> = {
  stray: { label: 'Stray', color: 'bg-gray-500' },
  adopted: { label: 'Adopted', color: 'bg-blue-500' },
  pure: { label: 'Purebred', color: 'bg-purple-500' },
};

/**
 * UnifiedCatCard - The single source of truth for cat display
 *
 * This component provides consistent cat display across the entire application.
 * It supports multiple display variants while maintaining visual consistency.
 *
 * Variants:
 * - minimal: Just the avatar and name
 * - compact: Small card for lists
 * - card: Standard card with stats and actions
 * - trading: Trading card style with flip animation
 * - detail: Detailed view for modals
 *
 * @example
 * ```tsx
 * // Standard card
 * <UnifiedCatCard
 *   cat={myCat}
 *   variant="card"
 *   onSell={handleSell}
 *   onHeal={handleHeal}
 * />
 *
 * // Trading card with flip
 * <UnifiedCatCard
 *   cat={myCat}
 *   variant="trading"
 *   showFlip
 *   onClick={handleClick}
 * />
 * ```
 */
export function UnifiedCatCard({
  cat,
  variant = 'card',
  equippedCostumeId,
  showPortrait,
  showStats,
  showRelationships,
  showActions,
  showFlip,
  animated,
  relationships = [],
  allCats = [],
  onClick,
  onSell,
  onHeal,
  onComfort,
  onRename,
  reaction,
  className,
}: UnifiedCatCardProps) {
  const { playSound } = useSound();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(cat.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const breedInfo = BREEDS[cat.breed];
  const tier = getGradeTier(cat.grade);
  const stars = getGradeStars(cat.grade);
  const tierVisuals = getTierVisuals(tier);
  const isHealthy = cat.health >= 70;
  const gradeBorder = getGradeBorderClass(cat.grade);

  // Derive default values based on variant
  const defaults = getVariantDefaults(variant);
  const shouldShowPortrait = showPortrait ?? defaults.showPortrait;
  const shouldShowStats = showStats ?? defaults.showStats;
  const shouldShowRelationships = showRelationships ?? defaults.showRelationships;
  const shouldShowActions = showActions ?? defaults.showActions;
  const shouldShowFlip = showFlip ?? defaults.showFlip;
  const shouldAnimate = animated ?? defaults.animated;

  // Calculate relationships using utility functions
  const friends = getFriendRelationships(cat.id, relationships);
  const enemies = getEnemyRelationships(cat.id, relationships);
  const bestFriend = getBestFriend(cat.id, relationships, allCats);

  // Check if cat needs comforting
  const needsComfort =
    cat.happiness < 50 || needsSocialAttention(cat.id, relationships) || cat.health < 50;
  const moodEmoji = cat.happiness < 30 ? '😿' : cat.happiness < 50 ? '😾' : null;

  // Focus input when editing
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditName(cat.name);
  }, [cat.name]);

  const handleFlip = (e: React.MouseEvent) => {
    if (!shouldShowFlip) return;
    e.stopPropagation();
    playSound('cardFlip');
    setIsFlipped(!isFlipped);
  };

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(cat.name);
    setIsEditing(true);
  };

  const handleConfirmRename = () => {
    if (onRename && editName.trim() && editName !== cat.name) {
      onRename(cat.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelRename = () => {
    setEditName(cat.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirmRename();
    else if (e.key === 'Escape') handleCancelRename();
  };

  const generateRandomName = () => {
    setEditName(generateRandomCatName(cat.breed, cat.personality));
  };

  const glowColor =
    reaction?.type === 'positive'
      ? 'rgba(236, 72, 153, 0.4)'
      : reaction?.type === 'negative'
        ? 'rgba(239, 68, 68, 0.4)'
        : undefined;

  // Render based on variant
  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-2', className)} onClick={onClick}>
        <CatVisual cat={cat} size="sm" equippedCostumeId={equippedCostumeId} />
        <span className="font-medium text-sm truncate">{cat.name}</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('cat-card-compact', className)} onClick={onClick}>
        <CatVisual cat={cat} size="sm" equippedCostumeId={equippedCostumeId} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{cat.name}</p>
          <p className="text-xs text-muted-foreground">{breedInfo.name}</p>
        </div>
        <GradeBadge grade={cat.grade} size="sm" />
      </div>
    );
  }

  if (variant === 'trading') {
    return (
      <TradingCardView
        cat={cat}
        tier={tier}
        stars={stars}
        tierVisuals={tierVisuals}
        equippedCostumeId={equippedCostumeId}
        friends={friends}
        enemies={enemies}
        bestFriend={bestFriend}
        isFlipped={isFlipped}
        onFlip={handleFlip}
        onClick={onClick}
        showFlip={shouldShowFlip}
        className={className}
      />
    );
  }

  // Compute stat bar color based on value
  const getStatColor = (value: number) => {
    if (value >= 70) return 'hsl(145 60% 45%)';
    if (value >= 40) return 'hsl(40 90% 50%)';
    return 'hsl(0 72% 50%)';
  };

  // Default 'card' variant
  return (
    <div
      className={cn(
        'cat-card relative overflow-visible transition-all duration-300',
        tierVisuals.cardClass,
        gradeBorder,
        !isHealthy && 'border-destructive/50',
        reaction && 'animate-card-glow',
        className
      )}
      style={{
        ...(glowColor ? { '--glow-color': glowColor } as React.CSSProperties : {}),
      }}
      onClick={onClick}
    >
      {/* Tier label badge for rare+ */}
      {tierVisuals.tierLabel && (
        <div className="absolute -top-2.5 right-2 z-20">
          <span
            className={cn(
              'px-2 py-0.5 text-[9px] font-extrabold tracking-widest rounded-full shadow-md uppercase',
              tier === 'rare' && 'bg-purple-500/90 text-white',
              tier === 'veryRare' && 'bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950',
              tier === 'ultraRare' && 'text-gradient-rainbow bg-white/90 dark:bg-black/80'
            )}
          >
            {tierVisuals.tierLabel}
          </span>
        </div>
      )}

      {/* Ultra rare sparkle overlay */}
      {tier === 'ultraRare' && GRAPHICS_CONFIG.enableSparkles && (
        <>
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl z-10">
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
              style={{ backgroundSize: '200% 100%' }}
            />
          </div>
          <div className="absolute -inset-2 pointer-events-none z-0">
            {[...Array(6)].map((_, i) => (
              <span
                key={i}
                className="absolute text-sm animate-sparkle"
                style={{
                  left: `${15 + i * 14}%`,
                  top: `${10 + (i % 3) * 35}%`,
                  animationDelay: `${i * 0.3}s`,
                }}
              >
                ✨
              </span>
            ))}
          </div>
        </>
      )}

      {reaction && <CatCardReaction reaction={reaction} />}

      {/* Header with avatar and grade */}
      <div className="flex items-start justify-between w-full mb-2">
        <div className="relative flex items-center gap-1">
          {/* Soft radial glow behind avatar for rare+ */}
          {(tier === 'rare' || tier === 'veryRare' || tier === 'ultraRare') && (
            <div
              className="absolute -inset-2 rounded-full opacity-20 blur-md pointer-events-none"
              style={{
                background: tier === 'rare'
                  ? 'radial-gradient(circle, hsl(270 70% 60%) 0%, transparent 70%)'
                  : tier === 'veryRare'
                    ? 'radial-gradient(circle, hsl(40 85% 55%) 0%, transparent 70%)'
                    : 'radial-gradient(circle, hsl(330 80% 60%) 0%, transparent 70%)',
              }}
            />
          )}
          <CatVisual
            cat={cat}
            size="md"
            equippedCostumeId={equippedCostumeId}
            animated={shouldAnimate}
            preferPortrait={shouldShowPortrait}
          />
          {moodEmoji && <span className="text-lg">{moodEmoji}</span>}
        </div>
        <GradeBadge grade={cat.grade} />
      </div>

      {/* Name with rename functionality */}
      <div className="flex items-center gap-1 w-full group">
        {isEditing ? (
          <div className="flex items-center gap-1 flex-1">
            <Input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={20}
              className="h-6 text-sm font-bold px-1 py-0 flex-1"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5 text-purple-600 hover:bg-purple-100"
              onClick={(e) => {
                e.stopPropagation();
                generateRandomName();
              }}
              title="Generate random name"
            >
              <Shuffle className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5 text-green-600 hover:bg-green-100"
              onClick={(e) => {
                e.stopPropagation();
                handleConfirmRename();
              }}
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5 text-red-600 hover:bg-red-100"
              onClick={(e) => {
                e.stopPropagation();
                handleCancelRename();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <>
            <h3 className="font-bold text-foreground truncate">{cat.name}</h3>
            {onRename && (
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleStartEdit}
                title="Rename cat"
              >
                <Pencil className="h-3 w-3" />
              </Button>
            )}
          </>
        )}
      </div>

      <p className="text-xs text-muted-foreground mb-1">{breedInfo.name}</p>
      <p className="text-xs text-muted-foreground mb-2">
        {personalityEmojis[cat.personality]} {cat.personality}
      </p>

      {/* Relationship Badges */}
      {shouldShowRelationships &&
        (friends.length > 0 || enemies.length > 0 || cat.tricksLearned.length > 0) && (
          <div className="flex gap-1 flex-wrap mb-2 w-full">
            {friends.length > 0 && (
              <Badge
                variant="outline"
                className="text-xs bg-green-50 text-green-600 border-green-200"
              >
                💚 {friends.length}
              </Badge>
            )}
            {enemies.length > 0 && (
              <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
                😾 {enemies.length}
              </Badge>
            )}
            {cat.tricksLearned.length > 0 && (
              <Badge
                variant="outline"
                className="text-xs bg-purple-50 text-purple-600 border-purple-200"
              >
                🎯 {cat.tricksLearned.length} tricks
              </Badge>
            )}
          </div>
        )}

      {/* Stats with gradient color bars */}
      {shouldShowStats && (
        <div className="w-full space-y-1.5 mb-3">
          <div className="stat-row">
            <span className="text-xs">❤️</span>
            <div className="relative h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${cat.health}%`,
                  background: `linear-gradient(90deg, ${getStatColor(cat.health)}, ${getStatColor(cat.health)}dd)`,
                }}
              />
            </div>
          </div>
          <div className="stat-row">
            <span className="text-xs">😊</span>
            <div className="relative h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${cat.happiness}%`,
                  background: `linear-gradient(90deg, ${getStatColor(cat.happiness)}, ${getStatColor(cat.happiness)}dd)`,
                }}
              />
            </div>
          </div>
          <div className="stat-row">
            <span className="text-xs">🍖</span>
            <div className="relative h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${cat.hunger}%`,
                  background: `linear-gradient(90deg, ${getStatColor(cat.hunger)}, ${getStatColor(cat.hunger)}dd)`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Value and wins */}
      <div className="flex items-center gap-2 w-full text-xs text-muted-foreground mb-2">
        {cat.showWins > 0 && <span>🏆 {cat.showWins}</span>}
        <span className="ml-auto font-medium text-primary">${cat.value}</span>
      </div>

      {/* Comfort button */}
      {shouldShowActions && needsComfort && onComfort && (
        <div className="w-full mb-2">
          <ComfortButton catId={cat.id} catName={cat.name} onComfort={onComfort} />
        </div>
      )}

      {/* Action buttons */}
      {shouldShowActions && (
        <div className="flex gap-1 w-full">
          {!isHealthy && onHeal && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onHeal(cat.id)}
              className="flex-1 text-xs"
            >
              💊 Heal
            </Button>
          )}
          {onSell && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSell(cat.id)}
              className="flex-1 text-xs hover:bg-destructive/10 hover:text-destructive"
            >
              Sell
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Get default display settings for each variant
 */
function getVariantDefaults(variant: CatCardVariant) {
  switch (variant) {
    case 'minimal':
      return {
        showPortrait: false,
        showStats: false,
        showRelationships: false,
        showActions: false,
        showFlip: false,
        animated: false,
      };
    case 'compact':
      return {
        showPortrait: false,
        showStats: false,
        showRelationships: false,
        showActions: false,
        showFlip: false,
        animated: false,
      };
    case 'trading':
      return {
        showPortrait: false,
        showStats: true,
        showRelationships: true,
        showActions: false,
        showFlip: true,
        animated: true,
      };
    case 'detail':
      return {
        showPortrait: true,
        showStats: true,
        showRelationships: true,
        showActions: true,
        showFlip: false,
        animated: true,
      };
    case 'card':
    default:
      return {
        showPortrait: true,
        showStats: true,
        showRelationships: true,
        showActions: true,
        showFlip: false,
        animated: true,
      };
  }
}

/**
 * Trading card variant with flip animation
 */
function TradingCardView({
  cat,
  tier,
  stars,
  tierVisuals,
  equippedCostumeId,
  friends,
  enemies,
  bestFriend,
  isFlipped,
  onFlip,
  onClick,
  showFlip,
  className,
}: {
  cat: Cat;
  tier: string;
  stars: number;
  tierVisuals: ReturnType<typeof getTierVisuals>;
  equippedCostumeId?: string;
  friends: CatRelationship[];
  enemies: CatRelationship[];
  bestFriend: Cat | null | undefined;
  isFlipped: boolean;
  onFlip: (e: React.MouseEvent) => void;
  onClick?: () => void;
  showFlip: boolean;
  className?: string;
}) {
  const cardBorders: Record<string, string> = {
    common: 'border-2 border-border',
    uncommon:
      'border-2 border-blue-400 shadow-[0_0_12px_2px_rgba(59,130,246,0.35)] hover:shadow-[0_0_18px_4px_rgba(59,130,246,0.5)]',
    rare: 'border-2 border-purple-400 animate-purple-glow',
    veryRare: 'border-2 border-yellow-400 animate-golden-glow',
    ultraRare: 'border-2 animate-rainbow-glow',
  };

  const CardFront = (
    <div
      className={cn(tierVisuals.bgGradient, tierVisuals.cardClass, 'rounded-lg p-3 h-full flex flex-col backface-hidden relative overflow-hidden')}
    >
      {/* Crystalline overlay for rare */}
      {tier === 'rare' && (
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(135deg, transparent 30%, hsl(270 70% 80% / 0.06) 50%, transparent 70%)',
          animation: 'crystal-shimmer 4s ease-in-out infinite',
        }} />
      )}
      {/* Metallic sheen for veryRare */}
      {tier === 'veryRare' && (
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(105deg, transparent 20%, hsl(40 80% 70% / 0.1) 40%, hsl(45 90% 80% / 0.12) 50%, transparent 80%)',
          animation: 'metallic-sheen 3s ease-in-out infinite',
        }} />
      )}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">{personalityEmojis[cat.personality]}</span>
          <span className="font-bold text-sm truncate max-w-[100px]">{cat.name}</span>
        </div>
        <GradeBadge grade={cat.grade} size="sm" />
      </div>

      <div className="relative flex-shrink-0 h-24 flex items-center justify-center mb-2 rounded-md bg-gradient-to-b from-background/50 to-transparent">
        <CatVisual
          cat={cat}
          size="lg"
          equippedCostumeId={equippedCostumeId}
          preferPortrait={true}
          animated={tier === 'ultraRare' || tier === 'veryRare'}
        />
        {tier === 'ultraRare' && (
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/30 animate-shimmer rounded-md" />
        )}
        {stars > 0 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            {Array.from({ length: stars }).map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium capitalize">{cat.breed.replace('-', ' ')}</span>
        <Badge className={cn(typeLabels[cat.type].color, 'text-white text-[10px] px-1.5 py-0')}>
          {typeLabels[cat.type].label}
        </Badge>
      </div>

      <div className="space-y-1.5 mb-2 flex-grow">
        <div className="flex items-center gap-2">
          <span className="text-xs w-12">❤️ HP</span>
          <Progress value={cat.health} className="h-2 flex-1" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs w-12">😊 Joy</span>
          <Progress value={cat.happiness} className="h-2 flex-1" />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-2 mt-auto">
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-0.5">
            <Trophy className="h-3 w-3 text-yellow-500" /> {cat.showWins}
          </span>
        </div>
        <span className="font-bold text-sm text-green-600 dark:text-green-400">${cat.value}</span>
      </div>

      {showFlip && (
        <button
          onClick={onFlip}
          className="absolute bottom-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
          title="Flip card"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
      )}
    </div>
  );

  const CardBack = (
    <div
      className={cn(
        tierVisuals.bgGradient,
        'rounded-lg p-3 h-full flex flex-col backface-hidden rotate-y-180'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-sm">{cat.name}</span>
        <Badge variant="outline" className="text-[10px]">
          Stats
        </Badge>
      </div>

      <div className="space-y-2 text-xs flex-grow">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded bg-accent/30">
            <div className="text-muted-foreground">Age</div>
            <div className="font-bold">{cat.age} days</div>
          </div>
          <div className="p-2 rounded bg-accent/30">
            <div className="text-muted-foreground">Grade</div>
            <div className="font-bold">
              {cat.grade}/{MAX_GRADE}
            </div>
          </div>
        </div>

        <div className="p-2 rounded bg-accent/30">
          <div className="text-muted-foreground mb-1">Stats</div>
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            <span>🍖 Hunger: {cat.hunger}%</span>
            <span>💤 Rest: {cat.restLevel}%</span>
            <span>🍽️ Feed: {cat.feedingScore}</span>
            <span>🏆 Wins: {cat.showWins}</span>
          </div>
        </div>

        <div className="p-2 rounded bg-accent/30">
          <div className="text-muted-foreground mb-1">
            Tricks ({cat.tricksLearned.length}/{TRICKS.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {cat.tricksLearned.length > 0 ? (
              cat.tricksLearned.map((trickId) => {
                const trick = TRICKS.find((t) => t.id === trickId);
                return (
                  trick && (
                    <span key={trickId} title={trick.name}>
                      {trick.emoji}
                    </span>
                  )
                );
              })
            ) : (
              <span className="text-muted-foreground">None yet</span>
            )}
          </div>
        </div>

        <div className="p-2 rounded bg-accent/30">
          <div className="text-muted-foreground mb-1">Social</div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-green-500">
              <Heart className="h-3 w-3" /> {friends.length}
            </span>
            <span className="flex items-center gap-1 text-red-500">
              <HeartCrack className="h-3 w-3" /> {enemies.length}
            </span>
          </div>
          {bestFriend && <div className="mt-1 text-pink-500">💕 BFF: {bestFriend.name}</div>}
        </div>
      </div>

      {showFlip && (
        <button
          onClick={onFlip}
          className="absolute bottom-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
          title="Flip card"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
      )}
    </div>
  );

  return (
    <div
      onClick={onClick}
      className={cn(
        'cursor-pointer transition-all duration-300 hover:scale-105 hover:-translate-y-1 rounded-lg overflow-hidden perspective-1000',
        cardBorders[tier],
        className
      )}
      style={{ perspective: '1000px' }}
    >
      <div
        className="relative w-full h-[320px] transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
          {tier === 'ultraRare' ? (
            <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 p-[2px] rounded-lg h-full">
              {CardFront}
            </div>
          ) : (
            CardFront
          )}
        </div>
        <div
          className="absolute inset-0"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {tier === 'ultraRare' ? (
            <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 p-[2px] rounded-lg h-full">
              {CardBack}
            </div>
          ) : (
            CardBack
          )}
        </div>
      </div>
    </div>
  );
}

// Memoize TradingCardView to prevent unnecessary re-renders
const MemoizedTradingCardView = React.memo(TradingCardView);

// Custom comparison function for UnifiedCatCard
function arePropsEqual(
  prevProps: UnifiedCatCardProps,
  nextProps: UnifiedCatCardProps
): boolean {
  // Quick reference equality check for most props
  if (prevProps.cat !== nextProps.cat) return false;
  if (prevProps.variant !== nextProps.variant) return false;
  if (prevProps.equippedCostumeId !== nextProps.equippedCostumeId) return false;
  if (prevProps.className !== nextProps.className) return false;
  if (prevProps.showPortrait !== nextProps.showPortrait) return false;
  if (prevProps.showStats !== nextProps.showStats) return false;
  if (prevProps.showRelationships !== nextProps.showRelationships) return false;
  if (prevProps.showActions !== nextProps.showActions) return false;
  if (prevProps.showFlip !== nextProps.showFlip) return false;
  if (prevProps.animated !== nextProps.animated) return false;

  // Reaction changes should trigger re-render
  if (prevProps.reaction?.type !== nextProps.reaction?.type) return false;
  if (prevProps.reaction?.emoji !== nextProps.reaction?.emoji) return false;

  // Check relationships array length (shallow comparison)
  if (prevProps.relationships?.length !== nextProps.relationships?.length) return false;
  if (prevProps.allCats?.length !== nextProps.allCats?.length) return false;

  // Functions - only check if they changed from defined to undefined or vice versa
  if (!!prevProps.onClick !== !!nextProps.onClick) return false;
  if (!!prevProps.onSell !== !!nextProps.onSell) return false;
  if (!!prevProps.onHeal !== !!nextProps.onHeal) return false;
  if (!!prevProps.onComfort !== !!nextProps.onComfort) return false;
  if (!!prevProps.onRename !== !!nextProps.onRename) return false;

  return true;
}

export default React.memo(UnifiedCatCard, arePropsEqual);
