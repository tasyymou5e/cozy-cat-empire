import { CatPersonality } from './game';

export type RelationshipLevel = 'enemy' | 'rival' | 'neutral' | 'friend' | 'bestFriend';

export interface CatRelationship {
  catId1: string;
  catId2: string;
  level: RelationshipLevel;
  score: number; // -100 to 100
  lastInteraction: number; // day number
}

export interface RelationshipEvent {
  id: string;
  catId1: string;
  catId2: string;
  catName1: string;
  catName2: string;
  type: 'positive' | 'negative' | 'neutral';
  message: string;
  scoreChange: number;
  day: number;
}

export interface CatGroup {
  id: string;
  name: string;
  memberIds: string[];
  leaderCatId: string;
  type: 'friendly' | 'outcasts' | 'rivals';
}

// Personality compatibility matrix: how well personalities get along
export const PERSONALITY_COMPATIBILITY: Record<CatPersonality, Record<CatPersonality, number>> = {
  lazy: { lazy: 10, playful: -5, affectionate: 15, independent: 5, curious: 0, shy: 10 },
  playful: { lazy: -5, playful: 10, affectionate: 15, independent: -10, curious: 20, shy: -5 },
  affectionate: { lazy: 15, playful: 15, affectionate: 20, independent: -15, curious: 10, shy: 5 },
  independent: { lazy: 5, playful: -10, affectionate: -15, independent: 5, curious: 0, shy: 10 },
  curious: { lazy: 0, playful: 20, affectionate: 10, independent: 0, curious: 15, shy: 5 },
  shy: { lazy: 10, playful: -5, affectionate: 5, independent: 10, curious: 5, shy: 15 },
};

export const RELATIONSHIP_THRESHOLDS = {
  enemy: -60,
  rival: -20,
  neutral: 19,
  friend: 59,
  bestFriend: 100,
};

// Relationship decay constants
export const RELATIONSHIP_DECAY = {
  GRACE_PERIOD_DAYS: 3, // Days before decay starts
  MODERATE_THRESHOLD_DAYS: 5, // Days for moderate decay
  SEVERE_THRESHOLD_DAYS: 7, // Days for severe decay
  LIGHT_DECAY: 1, // Points lost per day (3-4 days)
  MODERATE_DECAY: 2, // Points lost per day (5-6 days)
  SEVERE_DECAY: 3, // Points lost per day (7+ days)
  MIN_DECAY_SCORE: -20, // Don't decay below rival level
};

export function getRelationshipLevel(score: number): RelationshipLevel {
  if (score <= RELATIONSHIP_THRESHOLDS.enemy) return 'enemy';
  if (score <= RELATIONSHIP_THRESHOLDS.rival) return 'rival';
  if (score <= RELATIONSHIP_THRESHOLDS.neutral) return 'neutral';
  if (score <= RELATIONSHIP_THRESHOLDS.friend) return 'friend';
  return 'bestFriend';
}

export function getRelationshipEmoji(level: RelationshipLevel): string {
  switch (level) {
    case 'enemy':
      return '💔';
    case 'rival':
      return '😾';
    case 'neutral':
      return '😐';
    case 'friend':
      return '💚';
    case 'bestFriend':
      return '💕';
  }
}

export function getRelationshipColor(level: RelationshipLevel): string {
  switch (level) {
    case 'enemy':
      return 'text-red-500';
    case 'rival':
      return 'text-orange-500';
    case 'neutral':
      return 'text-muted-foreground';
    case 'friend':
      return 'text-green-500';
    case 'bestFriend':
      return 'text-pink-500';
  }
}

// === Phase 1: Decay Warning Helpers ===

export interface RelationshipDecayInfo {
  daysSinceInteraction: number;
  isInGracePeriod: boolean;
  isDecaying: boolean;
  decayLevel: 'none' | 'light' | 'moderate' | 'severe';
  daysUntilDecay: number;
}

export function getDecayInfo(
  relationship: CatRelationship,
  currentDay: number
): RelationshipDecayInfo {
  const daysSinceInteraction = currentDay - relationship.lastInteraction;
  const isInGracePeriod = daysSinceInteraction < RELATIONSHIP_DECAY.GRACE_PERIOD_DAYS;
  const daysUntilDecay = Math.max(0, RELATIONSHIP_DECAY.GRACE_PERIOD_DAYS - daysSinceInteraction);

  let decayLevel: 'none' | 'light' | 'moderate' | 'severe' = 'none';
  if (daysSinceInteraction >= RELATIONSHIP_DECAY.SEVERE_THRESHOLD_DAYS) {
    decayLevel = 'severe';
  } else if (daysSinceInteraction >= RELATIONSHIP_DECAY.MODERATE_THRESHOLD_DAYS) {
    decayLevel = 'moderate';
  } else if (daysSinceInteraction >= RELATIONSHIP_DECAY.GRACE_PERIOD_DAYS) {
    decayLevel = 'light';
  }

  return {
    daysSinceInteraction,
    isInGracePeriod,
    isDecaying: decayLevel !== 'none',
    decayLevel,
    daysUntilDecay,
  };
}

export function getDecayWarningColor(decayLevel: 'none' | 'light' | 'moderate' | 'severe'): string {
  switch (decayLevel) {
    case 'severe':
      return 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400';
    case 'moderate':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400';
    case 'light':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400';
    default:
      return '';
  }
}

export function getDecayWarningText(decayLevel: 'none' | 'light' | 'moderate' | 'severe'): string {
  switch (decayLevel) {
    case 'severe':
      return 'Losing 3 points/day';
    case 'moderate':
      return 'Losing 2 points/day';
    case 'light':
      return 'Losing 1 point/day';
    default:
      return '';
  }
}
