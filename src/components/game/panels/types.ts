/**
 * Panel Props Types
 *
 * Grouped prop interfaces for panel components to reduce prop drilling.
 * Props are organized by domain to make passing data cleaner.
 */

import { Cat } from '@/types/game';
import { CatRelationship } from '@/types/relationships';
import type { DailyObjective } from '@/types/dailyObjectives';
import type { ChallengeWithProgress, ChallengeType } from '@/types/challenges';
import type { CollectionCategory } from '@/types/collections';
import type { WheelPrize } from '@/types/luckyWheel';

/**
 * Collection set progress tracking
 */
export interface CollectionSetProgress {
  collected: number;
  total: number;
  items: { id: string; name: string; emoji: string; collected: boolean }[];
}

/**
 * Challenge-related props grouped together
 */
export interface ChallengeProps {
  challenges: ChallengeWithProgress[];
  loading: boolean;
  timeRemaining: string | null;
  lastProgressUpdate: { type: ChallengeType; value: number } | null;
  totalCompleted: number;
  currentStreak: number;
  longestStreak: number;
  onClaimReward: (challengeId: string) => Promise<{ coins: number; badge: string | null } | false>;
  onProgressAnimationComplete: () => void;
}

/**
 * Daily objectives props grouped together
 */
export interface ObjectivesProps {
  objectives: DailyObjective[];
  allCompleted: boolean;
  bonusClaimed: boolean;
  onClaimBonus: () => void;
}

/**
 * Lucky wheel props grouped together
 */
export interface WheelProps {
  canSpin: boolean;
  spinsRemaining: number;
  isSpinning: boolean;
  lastPrize: WheelPrize | null;
  totalSpins: number;
  isVIP: boolean;
  onSpin: () => void;
  onClaimPrize: (prize: WheelPrize | null) => void;
  onClearPrize: () => void;
}

/**
 * Collection progress props grouped together
 */
export interface CollectionProps {
  breedProgress: CollectionSetProgress;
  personalityProgress: CollectionSetProgress;
  costumeProgress: CollectionSetProgress;
  trickProgress: CollectionSetProgress;
  overallProgress: number;
  completedSets: CollectionCategory[];
  getSetReward: (category: CollectionCategory) => {
    coins?: number;
    title?: string;
    bonus?: string;
  };
}

/**
 * Shared data props for panels that need cat/relationship data
 */
export interface SharedCatDataProps {
  cats: Cat[];
  relationships: CatRelationship[];
  catCostumes: Record<string, string>;
}

/**
 * Audio and visual feedback props
 */
export interface FeedbackProps {
  playSound: (sound: string) => void;
  fireConfetti: () => void;
}
