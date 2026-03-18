/**
 * @fileoverview Game Event Sound Mapping Configuration
 *
 * Central mapping of game events to their corresponding sounds.
 * Complements src/config/sounds.ts (SoundType → AudioSource) by providing
 * the reverse mapping (GameEvent → SoundType).
 *
 * @module config/gameEventSounds
 */

import type { SoundType } from '@/contexts/SoundContext';
import type { GameAction } from '@/types/gameEvents';

// ========== GAME ACTION SOUNDS ==========
/**
 * Maps GameAction events to their corresponding sounds.
 * Used by useGameEvents dispatcher for automatic sound triggering.
 */
export const GAME_ACTION_SOUNDS: Partial<Record<GameAction, SoundType>> = {
  FEED_CATS: 'catEating',
  FEED_SINGLE_CAT: 'catEating',
  DO_CHORE: 'coin',
  BUY_RESOURCE: 'coin',
  USE_MEDICINE: 'success',
  USE_TOYS: 'catPlaying',
  COMFORT_CAT: 'purr',
  SELL_CAT: 'coin',
  TRAIN_CAT: 'catTraining',
  REST_CAT: 'catSleeping',
  BREED_CATS: 'success',
  SOCIALIZE_CATS: 'friendship',
  GROUP_ACTIVITY: 'catPlaying',
  CAT_SHOW: 'achievement',
};

// ========== CAT ACTIVITY SOUNDS ==========
/**
 * Maps activity popup keys to sound types.
 * Uses new sound variety for more distinct audio feedback.
 */
export const ACTIVITY_SOUNDS: Record<string, SoundType> = {
  eating: 'catEating',
  playing: 'catPlaying',
  sleeping: 'catSleeping',
  grooming: 'catGrooming',
  exploring: 'catExploring',
  hunting: 'catHunting',
  stretching: 'catStretching',
  cuddling: 'catCuddling',
  training: 'catTraining',
  mischief: 'catMischief',
  zoomies: 'catZoomies',
  sunbathing: 'catSunbathing',
  birdwatching: 'catChattering',
  chirping: 'catChirp',
  yawning: 'catYawn',
  startled: 'catStartled',
};

// ========== RELATIONSHIP EVENT SOUNDS ==========
/**
 * Sounds for cat relationship changes.
 */
export const RELATIONSHIP_SOUNDS = {
  friendshipFormed: 'friendship',
  friendshipStrengthened: 'heartBurst',
  rivalryStarted: 'catGrowl',
  rivalryWorsened: 'sparkClash',
  reconciliation: 'catTrill',
} as const satisfies Record<string, SoundType>;

// ========== NOTIFICATION SOUNDS ==========
/**
 * Sounds for player notifications.
 */
export const NOTIFICATION_SOUNDS = {
  giftReceived: 'giftReceived',
  tradeReceived: 'tradeReceived',
  friendRequest: 'meow',
  dailyEvent: 'dailyEvent',
  announcement: 'meow',
} as const satisfies Record<string, SoundType>;

// ========== ACHIEVEMENT SOUNDS ==========
/**
 * Sounds for achievements and rewards.
 */
export const ACHIEVEMENT_SOUNDS = {
  unlock: 'achievement',
  milestone: 'levelUp',
  challengeProgress: 'challengeProgress',
  challengeComplete: 'challengeComplete',
  dailyReward: 'coin',
  weeklyReward: 'coin',
} as const satisfies Record<string, SoundType>;

// ========== UI INTERACTION SOUNDS ==========
/**
 * Sounds for UI interactions.
 */
export const UI_SOUNDS = {
  buttonClick: 'click',
  tabSwitch: 'click',
  modalOpen: 'click',
  modalClose: 'click',
  cardFlip: 'cardFlip',
  save: 'success',
  error: 'error',
  purchase: 'coin',
  nextDay: 'nextDay',
} as const satisfies Record<string, SoundType>;

// ========== MOOD CHANGE SOUNDS ==========
/**
 * Sounds for cat mood changes.
 */
export const MOOD_SOUNDS = {
  becameHappy: 'catChirp',
  becameSad: 'moodSad',
  becameAngry: 'catGrowl',
  becameContent: 'catContentPurr',
} as const satisfies Record<string, SoundType>;

// ========== EMPIRE VIEW SOUNDS ==========
/**
 * Sounds for Empire view interactions.
 */
export const EMPIRE_SOUNDS = {
  petCat: 'catContentPurr',
  feedCat: 'catEating',
  playWithCat: 'catChirp',
  catMeow: 'meow',
  propInteraction: 'catTrill',
} as const satisfies Record<string, SoundType>;

// ========== HELPER FUNCTIONS ==========

/**
 * Get sound for a game action
 * @param action - The game action type
 * @returns The corresponding SoundType or undefined if not mapped
 */
export function getSoundForAction(action: GameAction): SoundType | undefined {
  return GAME_ACTION_SOUNDS[action];
}

/**
 * Get sound for an activity
 * @param activity - The activity key (e.g., 'eating', 'playing')
 * @returns The corresponding SoundType or undefined if not mapped
 */
export function getSoundForActivity(activity: string): SoundType | undefined {
  return ACTIVITY_SOUNDS[activity];
}
