/**
 * @fileoverview Achievement Badges & Profile Showcase Types
 * Badge rarity tiers, profile frames, and display settings
 * @module types/badges
 */

/** Badge rarity tiers */
export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/** Badge categories */
export type BadgeCategory = 'achievement' | 'challenge' | 'seasonal' | 'social' | 'premium' | 'prestige';

/**
 * A player badge/achievement display
 */
export interface Badge {
  /** Unique badge identifier */
  id: string;
  /** Display name */
  name: string;
  /** Emoji icon */
  emoji: string;
  /** Description of how badge was earned */
  description: string;
  /** Rarity tier */
  rarity: BadgeRarity;
  /** Badge category */
  category: BadgeCategory;
  /** ISO timestamp when unlocked (undefined if locked) */
  unlockedAt?: string;
}

/**
 * Player badge record from database
 */
export interface PlayerBadge {
  /** Record ID */
  id: string;
  /** User ID */
  userId: string;
  /** Badge ID */
  badgeId: string;
  /** Unlock timestamp */
  unlockedAt: string;
  /** Whether this badge is displayed on profile */
  isDisplayed: boolean;
}

/**
 * A profile frame unlocked by badge count
 */
export interface ProfileFrame {
  /** Frame identifier */
  id: string;
  /** Display name */
  name: string;
  /** CSS class for styling */
  cssClass: string;
  /** Number of badges required to unlock */
  requiredBadgeCount: number;
  /** Optional emoji preview */
  emoji?: string;
}

/**
 * Badge rarity styling
 */
export const BADGE_RARITY_STYLES: Record<BadgeRarity, { border: string; bg: string; text: string }> = {
  common: {
    border: 'border-muted-foreground/50',
    bg: 'bg-muted',
    text: 'text-muted-foreground',
  },
  uncommon: {
    border: 'border-green-500',
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
  },
  rare: {
    border: 'border-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
  },
  epic: {
    border: 'border-purple-500',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
  },
  legendary: {
    border: 'border-yellow-500',
    bg: 'bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
  },
};

/**
 * Badge category info
 */
export const BADGE_CATEGORIES: Record<BadgeCategory, { name: string; emoji: string }> = {
  achievement: { name: 'Achievement', emoji: '🏆' },
  challenge: { name: 'Challenge', emoji: '🎯' },
  seasonal: { name: 'Seasonal', emoji: '🌟' },
  social: { name: 'Social', emoji: '👥' },
  premium: { name: 'Premium', emoji: '💎' },
  prestige: { name: 'Prestige', emoji: '⭐' },
};

/**
 * Profile frames unlocked by badge collection
 */
export const PROFILE_FRAMES: ProfileFrame[] = [
  {
    id: 'default',
    name: 'Basic',
    cssClass: 'ring-2 ring-muted-foreground/20',
    requiredBadgeCount: 0,
    emoji: '⚪',
  },
  {
    id: 'bronze',
    name: 'Bronze',
    cssClass: 'ring-2 ring-orange-700 bg-gradient-to-br from-orange-200/20 to-orange-400/20',
    requiredBadgeCount: 5,
    emoji: '🥉',
  },
  {
    id: 'silver',
    name: 'Silver',
    cssClass: 'ring-2 ring-gray-400 bg-gradient-to-br from-gray-200/30 to-gray-400/30',
    requiredBadgeCount: 10,
    emoji: '🥈',
  },
  {
    id: 'gold',
    name: 'Gold',
    cssClass: 'ring-2 ring-yellow-500 bg-gradient-to-br from-yellow-200/30 to-yellow-400/30',
    requiredBadgeCount: 20,
    emoji: '🥇',
  },
  {
    id: 'diamond',
    name: 'Diamond',
    cssClass: 'ring-2 ring-cyan-400 bg-gradient-to-br from-cyan-200/30 to-cyan-400/30 animate-pulse-slow',
    requiredBadgeCount: 35,
    emoji: '💎',
  },
  {
    id: 'legendary',
    name: 'Legendary',
    cssClass: 'ring-4 ring-purple-500 bg-gradient-to-br from-purple-200/30 via-pink-200/30 to-yellow-200/30 animate-gradient',
    requiredBadgeCount: 50,
    emoji: '👑',
  },
];

/**
 * All available badges in the game
 */
export const ALL_BADGES: Badge[] = [
  // Achievement badges
  { id: 'first_cat', name: 'First Friend', emoji: '🐱', description: 'Adopt your first cat', rarity: 'common', category: 'achievement' },
  { id: 'cat_collector', name: 'Cat Collector', emoji: '😺', description: 'Own 10 cats at once', rarity: 'uncommon', category: 'achievement' },
  { id: 'cat_empire', name: 'Cat Empire', emoji: '👑', description: 'Own 50 cats at once', rarity: 'epic', category: 'achievement' },
  { id: 'show_winner', name: 'Show Winner', emoji: '🏆', description: 'Win 5 cat shows', rarity: 'common', category: 'achievement' },
  { id: 'champion', name: 'Champion', emoji: '🏅', description: 'Win 25 cat shows', rarity: 'rare', category: 'achievement' },
  { id: 'millionaire', name: 'Millionaire', emoji: '💰', description: 'Earn $10,000 total', rarity: 'rare', category: 'achievement' },
  { id: 'master_breeder', name: 'Master Breeder', emoji: '💕', description: 'Breed 10 kittens', rarity: 'uncommon', category: 'achievement' },
  { id: 'land_baron', name: 'Land Baron', emoji: '🏰', description: 'Own 100 acres', rarity: 'epic', category: 'achievement' },

  // Challenge badges
  { id: 'challenge_starter', name: 'Challenge Starter', emoji: '🎯', description: 'Complete 5 challenges', rarity: 'common', category: 'challenge' },
  { id: 'challenge_master', name: 'Challenge Master', emoji: '⭐', description: 'Complete 10 challenges', rarity: 'uncommon', category: 'challenge' },
  { id: 'challenge_legend', name: 'Challenge Legend', emoji: '🌟', description: 'Complete 25 challenges', rarity: 'rare', category: 'challenge' },

  // Social badges
  { id: 'social_butterfly', name: 'Social Butterfly', emoji: '🦋', description: 'Have 5+ cat friendships', rarity: 'uncommon', category: 'social' },
  { id: 'peacemaker', name: 'Peacemaker', emoji: '🕊️', description: 'Improve a rivalry to friendship', rarity: 'rare', category: 'social' },
  { id: 'clique_leader', name: 'Clique Leader', emoji: '👥', description: 'Form a 4+ member cat group', rarity: 'rare', category: 'social' },

  // Login streak badges
  { id: 'login_7_days', name: 'Weekly Regular', emoji: '📅', description: 'Log in 7 days in a row', rarity: 'common', category: 'achievement' },
  { id: 'login_30_days', name: 'Cat Farm Legend', emoji: '🗓️', description: 'Log in 30 days in a row', rarity: 'epic', category: 'achievement' },

  // Prestige badges
  { id: 'first_prestige', name: 'Rising Star', emoji: '⭐', description: 'Prestige your first cat', rarity: 'rare', category: 'prestige' },
  { id: 'max_prestige', name: 'Legendary Star', emoji: '🌟', description: 'Reach max prestige on a cat', rarity: 'legendary', category: 'prestige' },
];

/**
 * Get available frames based on badge count
 */
export function getAvailableFrames(badgeCount: number): ProfileFrame[] {
  return PROFILE_FRAMES.filter((f) => f.requiredBadgeCount <= badgeCount);
}

/**
 * Get the best frame available for a badge count
 */
export function getBestFrame(badgeCount: number): ProfileFrame {
  const available = getAvailableFrames(badgeCount);
  return available[available.length - 1] || PROFILE_FRAMES[0];
}

/**
 * Get badge by ID
 */
export function getBadgeById(id: string): Badge | undefined {
  return ALL_BADGES.find((b) => b.id === id);
}

/** Maximum badges that can be displayed on profile */
export const MAX_DISPLAYED_BADGES = 3;
