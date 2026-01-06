/**
 * @fileoverview Barrel export for all type definitions
 * 
 * Usage: import { Cat, GameState, CatBreed } from '@/types';
 * 
 * @module types
 */

// Core game types
export type {
  Cat,
  CatBreed,
  CatPersonality,
  CatSpecializationData,
  Resources,
  MarketListing,
  Achievement,
  GameState,
  AchievementType,
} from './game';

export {
  CAT_NAMES,
  BREEDS,
  PERSONALITIES,
  CAT_COSTS,
  RESOURCE_COSTS,
  HOUSE_UPGRADES,
  CHORE_TYPES,
  ACHIEVEMENT_DEFS,
} from './game';

// Cat appearance types
export type {
  CatAppearance,
  FurColor,
  FurPattern,
  EyeColor,
  HairLength,
  FacialFeature,
} from './catAppearance';

// Cat names
export {
  BREED_NAMES,
  PERSONALITY_NAMES,
  UNIVERSAL_NAMES,
  generateRandomCatName,
  getAllPossibleNames,
} from './catNames';

// Grading types
export type { TrickId } from './grading';
export { TRICKS, getGradeTier, getGradeStars } from './grading';

// Relationship types
export type {
  CatRelationship,
  RelationshipEvent,
  RelationshipLevel,
  CatGroup,
} from './relationships';

export {
  RELATIONSHIP_THRESHOLDS,
  RELATIONSHIP_DECAY,
  PERSONALITY_COMPATIBILITY,
  getRelationshipLevel,
  getDecayInfo,
} from './relationships';

// Costume types
export type { Costume } from './costumes';
export { COSTUMES, getCostumeById } from './costumes';

// Battle pass types
export type { BattlePassReward, BattlePassSeason } from './battlePass';

// Challenge types
export type { ChallengeType, ChallengeDifficulty } from './challenges';

// Coop challenge types
export type { CoopChallenge, CoopChallengeInvite } from './coopChallenges';
export { COOP_CHALLENGE_TEMPLATES } from './coopChallenges';

// Daily types
export type { DailyEvent } from './dailyEvents';
export { DAILY_EVENTS } from './dailyEvents';

export type { DailyObjective, ObjectiveType } from './dailyObjectives';

export type { DailyReward, VIPTier } from './dailyRewards';
export { VIP_TIERS, DAILY_REWARDS } from './dailyRewards';

// Gallery types
export type { GalleryPhoto } from './gallery';

// Photo booth types
export type { CatPose, PhotoFrame, PlacedSticker } from './photoBooth';
export { PHOTO_BACKGROUNDS, CAT_POSES, PHOTO_FRAMES } from './photoBooth';

// Show event types
export type { ShowTier, SeasonalEvent } from './showEvents';
export { SHOW_TIERS, SEASONAL_EVENTS } from './showEvents';

// Collection types
export type { CollectionSet, CollectionItem } from './collections';

// Milestone types
export type { Milestone, MilestoneCategory } from './milestones';
export { MILESTONES } from './milestones';

// Lucky wheel types
export type { WheelPrize } from './luckyWheel';
export { WHEEL_PRIZES } from './luckyWheel';

// Specialization types
export type { SpecializationType, Specialization } from './specializations';
export { SPECIALIZATIONS } from './specializations';

// Legacy types
export type { LegacyTrait } from './legacy';

// Game events types
export type { GameAction, GameActionPayloads, ActionSideEffects } from './gameEvents';
export { GameActions, ACTION_SIDE_EFFECTS } from './gameEvents';

// Changelog types
export type { ChangelogEntry } from './changelog';
export { CHANGELOG, CURRENT_VERSION } from './changelog';

// Admin types
export type { AdminUserProfile, AdminChallenge } from './admin';
