/**
 * Panel Props Types
 *
 * Grouped prop interfaces for panel components to reduce prop drilling.
 * Props are organized by domain to make passing data cleaner.
 */

import type { Cat, Resources, ResourceType } from '@/types/game';
import type { CatRelationship } from '@/types/relationships';
import type { DailyObjective } from '@/types/dailyObjectives';
import type { ChallengeWithProgress, ChallengeType } from '@/types/challenges';
import type { CollectionCategory } from '@/types/collections';
import type { WheelPrize } from '@/types/luckyWheel';
import type { SoundType } from '@/contexts/SoundContext';

// ============================================================================
// Collection Types
// ============================================================================

/**
 * Progress tracking for a collection set.
 * Used to display collection completion status.
 */
export interface CollectionSetProgress {
  /** Number of items collected */
  collected: number;
  /** Total items in the set */
  total: number;
  /** Individual item details */
  items: CollectionSetItem[];
}

/** A single item within a collection set */
export interface CollectionSetItem {
  /** Unique item identifier */
  id: string;
  /** Display name */
  name: string;
  /** Emoji representation */
  emoji: string;
  /** Whether this item has been collected */
  collected: boolean;
}

// ============================================================================
// Panel Props Interfaces
// ============================================================================

/**
 * Challenge-related props grouped together.
 * Used by WeeklyChallengesPanel component.
 */
export interface ChallengeProps {
  /** Array of challenges with progress data */
  challenges: ChallengeWithProgress[];
  /** Whether challenges are loading */
  loading: boolean;
  /** Time remaining display string */
  timeRemaining: string | null;
  /** Latest progress update for animation */
  lastProgressUpdate: ChallengeProgressUpdate | null;
  /** Total challenges completed all time */
  totalCompleted: number;
  /** Current week streak */
  currentStreak: number;
  /** Longest streak achieved */
  longestStreak: number;
  /** Claim reward for a completed challenge */
  onClaimReward: (challengeId: string) => Promise<ChallengeRewardResult | false>;
  /** Called when progress animation completes */
  onProgressAnimationComplete: () => void;
}

/** Challenge progress update for animations */
export interface ChallengeProgressUpdate {
  /** Challenge type that progressed */
  type: ChallengeType;
  /** Progress value */
  value: number;
}

/** Result of claiming a challenge reward */
export interface ChallengeRewardResult {
  /** Coins awarded */
  coins: number;
  /** Badge awarded (if any) */
  badge: string | null;
}

/**
 * Daily objectives props grouped together.
 * Used by DailyObjectivesPanel component.
 */
export interface ObjectivesProps {
  /** Array of today's objectives */
  objectives: DailyObjective[];
  /** Whether all objectives are completed */
  allCompleted: boolean;
  /** Whether bonus has been claimed */
  bonusClaimed: boolean;
  /** Claim the completion bonus */
  onClaimBonus: () => void;
}

/**
 * Lucky wheel props grouped together.
 * Used by LuckyWheelPanel component.
 */
export interface WheelProps {
  /** Whether player can spin */
  canSpin: boolean;
  /** Remaining spins today */
  spinsRemaining: number;
  /** Whether wheel is currently spinning */
  isSpinning: boolean;
  /** Last prize won (for display) */
  lastPrize: WheelPrize | null;
  /** Total spins all time */
  totalSpins: number;
  /** Whether player has VIP status */
  isVIP: boolean;
  /** Start a spin */
  onSpin: () => void;
  /** Claim the prize after spin */
  onClaimPrize: (prize: WheelPrize | null) => void;
  /** Clear the last prize display */
  onClearPrize: () => void;
}

/**
 * Collection progress props grouped together.
 * Used by CollectionProgressPanel component.
 */
export interface CollectionProps {
  /** Breed collection progress */
  breedProgress: CollectionSetProgress;
  /** Personality collection progress */
  personalityProgress: CollectionSetProgress;
  /** Costume collection progress */
  costumeProgress: CollectionSetProgress;
  /** Trick collection progress */
  trickProgress: CollectionSetProgress;
  /** Overall completion percentage (0-100) */
  overallProgress: number;
  /** List of completed set categories */
  completedSets: CollectionCategory[];
  /** Get reward for completing a set */
  getSetReward: (category: CollectionCategory) => CollectionReward;
}

/** Reward for completing a collection set */
export interface CollectionReward {
  /** Coins awarded */
  coins?: number;
  /** Title awarded */
  title?: string;
  /** Description of bonus */
  bonus?: string;
}

/**
 * Shared data props for panels that need cat/relationship data.
 * Used by panels that display cat information.
 */
export interface SharedCatDataProps {
  /** All player's cats */
  cats: Cat[];
  /** All cat relationships */
  relationships: CatRelationship[];
  /** Cat ID to costume ID mapping */
  catCostumes: Record<string, string>;
}

/**
 * Audio and visual feedback props.
 * Used by panels that trigger sounds or effects.
 */
export interface FeedbackProps {
  /** Play a sound effect */
  playSound: (sound: SoundType) => void;
  /** Fire confetti animation */
  fireConfetti: () => void;
}

/**
 * Resource management props.
 * Used by panels that modify resources.
 */
export interface ResourceProps {
  /** Current resources */
  resources: Resources;
  /** Current money */
  money: number;
  /** Buy a resource */
  onBuyResource: (resource: ResourceType, cost: number) => void;
  /** Use a resource on a cat */
  onUseResource: (resource: ResourceType, catId?: string) => void;
}

/**
 * Cat action props.
 * Used by panels that perform actions on cats.
 */
export interface CatActionProps {
  /** Sell a cat */
  onSellCat: (catId: string) => void;
  /** Heal a cat */
  onHealCat: (catId: string) => void;
  /** Comfort a cat */
  onComfortCat: (catId: string) => void;
  /** Rest a cat */
  onRestCat: (catId: string) => void;
  /** Rename a cat */
  onRenameCat: (catId: string, newName: string) => boolean;
}
