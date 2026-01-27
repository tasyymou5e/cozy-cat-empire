/**
 * @fileoverview Runtime type guards for validating game data structures.
 * Use these at runtime boundaries (loading saves, receiving API data, etc.)
 *
 * @module types/guards
 */

import type {
  Cat,
  CatBreed,
  CatPersonality,
  CatType,
  HouseSize,
  Resources,
  MarketListing,
  Achievement,
  GameState,
  CatSpecializationData,
} from './game';
import type { CatAppearance, FurColor, FurPattern, EyeColor, HairLength } from './catAppearance';
import type { TrickId } from './grading';
import type { CatRelationship, RelationshipEvent } from './relationships';

// ============================================================================
// Primitive Value Guards
// ============================================================================

/** Valid cat breeds */
const CAT_BREEDS: CatBreed[] = [
  'stray',
  'tabby',
  'persian',
  'siamese',
  'maine-coon',
  'british-shorthair',
  'ragdoll',
  'bengal',
];

/** Valid cat personalities */
const CAT_PERSONALITIES: CatPersonality[] = [
  'lazy',
  'playful',
  'affectionate',
  'independent',
  'curious',
  'shy',
];

/** Valid cat acquisition types */
const CAT_TYPES: CatType[] = ['stray', 'adopted', 'pure'];

/** Valid house sizes */
const HOUSE_SIZES: HouseSize[] = ['apartment', 'house', 'mansion', 'farm'];

/** Valid trick IDs */
const TRICK_IDS: TrickId[] = ['sit', 'paw', 'rollOver', 'jump', 'fetch'];

/** Valid fur colors */
const FUR_COLORS: FurColor[] = [
  'orange',
  'black',
  'white',
  'gray',
  'brown',
  'cream',
  'ginger',
  'calico',
];

/** Valid fur patterns */
const FUR_PATTERNS: FurPattern[] = ['solid', 'tabby', 'spotted', 'tuxedo', 'bicolor', 'calico'];

/** Valid eye colors */
const EYE_COLORS: EyeColor[] = ['green', 'blue', 'amber', 'gold', 'heterochromia', 'copper'];

/** Valid hair lengths */
const HAIR_LENGTHS: HairLength[] = ['short', 'medium', 'fluffy'];

// ============================================================================
// Type Guard Utilities
// ============================================================================

/** Check if value is a non-null object */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Check if value is a string */
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/** Check if value is a number */
function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

/** Check if value is a boolean */
function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/** Check if value is an array */
function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/** Check if value is a non-negative integer */
function isNonNegativeInt(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value) && value >= 0;
}

/** Check if value is a non-negative number (allows decimals) */
function isNonNegative(value: unknown): value is number {
  return isNumber(value) && value >= 0;
}

/** Check if value is a stat value (0-100) */
export function isStatValue(value: unknown): value is number {
  return isNumber(value) && value >= 0 && value <= 100;
}

/** Check if value is a grade value (1-20) */
export function isGradeValue(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value) && value >= 1 && value <= 20;
}

/** Check if value is a money value (non-negative number) */
export function isMoneyValue(value: unknown): value is number {
  return isNumber(value) && value >= 0;
}

// ============================================================================
// Enum Type Guards
// ============================================================================

/** Check if value is a valid cat breed */
export function isCatBreed(value: unknown): value is CatBreed {
  return isString(value) && CAT_BREEDS.includes(value as CatBreed);
}

/** Check if value is a valid cat personality */
export function isCatPersonality(value: unknown): value is CatPersonality {
  return isString(value) && CAT_PERSONALITIES.includes(value as CatPersonality);
}

/** Check if value is a valid cat type */
export function isCatType(value: unknown): value is CatType {
  return isString(value) && CAT_TYPES.includes(value as CatType);
}

/** Check if value is a valid house size */
export function isHouseSize(value: unknown): value is HouseSize {
  return isString(value) && HOUSE_SIZES.includes(value as HouseSize);
}

/** Check if value is a valid trick ID */
export function isTrickId(value: unknown): value is TrickId {
  return isString(value) && TRICK_IDS.includes(value as TrickId);
}

/** Check if value is a valid fur color */
export function isFurColor(value: unknown): value is FurColor {
  return isString(value) && FUR_COLORS.includes(value as FurColor);
}

/** Check if value is a valid fur pattern */
export function isFurPattern(value: unknown): value is FurPattern {
  return isString(value) && FUR_PATTERNS.includes(value as FurPattern);
}

/** Check if value is a valid eye color */
export function isEyeColor(value: unknown): value is EyeColor {
  return isString(value) && EYE_COLORS.includes(value as EyeColor);
}

/** Check if value is a valid hair length */
export function isHairLength(value: unknown): value is HairLength {
  return isString(value) && HAIR_LENGTHS.includes(value as HairLength);
}

// ============================================================================
// Complex Type Guards
// ============================================================================

/** Check if value is a valid CatAppearance */
export function isCatAppearance(value: unknown): value is CatAppearance {
  if (!isObject(value)) return false;

  return (
    isFurColor(value.furColor) &&
    isFurPattern(value.pattern) &&
    isEyeColor(value.eyeColor) &&
    isHairLength(value.hairLength) &&
    (value.patternColor === undefined || isString(value.patternColor)) &&
    (value.facialFeatures === undefined ||
      (isArray(value.facialFeatures) && value.facialFeatures.every(isString)))
  );
}

/** Check if value is a valid CatSpecializationData */
export function isCatSpecializationData(value: unknown): value is CatSpecializationData {
  if (!isObject(value)) return false;

  return (
    isString(value.type) &&
    isNumber(value.level) &&
    value.level >= 1 &&
    value.level <= 3 &&
    isNonNegativeInt(value.xp) &&
    isString(value.specializedAt)
  );
}

/** Check if value is a valid Cat object */
export function isCat(value: unknown): value is Cat {
  if (!isObject(value)) return false;

  // Required fields
  const hasRequiredFields =
    isString(value.id) &&
    isCatType(value.type) &&
    isCatBreed(value.breed) &&
    isString(value.name) &&
    value.name.length >= 1 &&
    value.name.length <= 20 &&
    isStatValue(value.health) &&
    isStatValue(value.happiness) &&
    isStatValue(value.hunger) &&
    isMoneyValue(value.value) &&
    isNonNegative(value.age) &&
    isCatPersonality(value.personality) &&
    isNonNegativeInt(value.showWins) &&
    isBoolean(value.isForSale) &&
    isGradeValue(value.grade) &&
    isArray(value.tricksLearned) &&
    value.tricksLearned.every(isTrickId) &&
    isObject(value.trickProgress) &&
    isStatValue(value.restLevel) &&
    isNonNegativeInt(value.feedingScore) &&
    isNonNegativeInt(value.lastTrainingDay);

  if (!hasRequiredFields) return false;

  // Optional fields
  if (value.appearance !== undefined && !isCatAppearance(value.appearance)) {
    return false;
  }
  if (value.portraitUrl !== undefined && !isString(value.portraitUrl)) {
    return false;
  }
  if (value.portraitGeneratedAt !== undefined && !isNumber(value.portraitGeneratedAt)) {
    return false;
  }
  if (value.appearanceHash !== undefined && !isString(value.appearanceHash)) {
    return false;
  }
  if (value.specialization !== undefined && !isCatSpecializationData(value.specialization)) {
    return false;
  }

  return true;
}

/** Check if value is a valid Resources object */
export function isResources(value: unknown): value is Resources {
  if (!isObject(value)) return false;

  return (
    isNonNegativeInt(value.food) &&
    isNonNegativeInt(value.medicine) &&
    isNonNegativeInt(value.toys) &&
    isNonNegativeInt(value.treats)
  );
}

/** Check if value is a valid MarketListing */
export function isMarketListing(value: unknown): value is MarketListing {
  if (!isObject(value)) return false;

  return isString(value.id) && isCat(value.cat) && isMoneyValue(value.price) && isString(value.seller);
}

/** Check if value is a valid Achievement */
export function isAchievement(value: unknown): value is Achievement {
  if (!isObject(value)) return false;

  const hasRequiredFields =
    isString(value.id) &&
    isString(value.name) &&
    isString(value.description) &&
    isNonNegativeInt(value.target) &&
    isBoolean(value.unlocked);

  if (!hasRequiredFields) return false;

  // Optional field
  if (value.unlockedAt !== undefined && !isNumber(value.unlockedAt)) {
    return false;
  }

  return true;
}

/** Check if value is a valid GameState object */
export function isValidGameState(value: unknown): value is GameState {
  if (!isObject(value)) return false;

  return (
    isArray(value.cats) &&
    value.cats.every(isCat) &&
    isMoneyValue(value.money) &&
    isNonNegativeInt(value.space) &&
    isHouseSize(value.houseSize) &&
    isNonNegativeInt(value.acres) &&
    isNonNegativeInt(value.day) &&
    isResources(value.resources) &&
    isNumber(value.reputation) &&
    isNonNegativeInt(value.totalShowWins) &&
    isNonNegativeInt(value.catsAdopted) &&
    isNumber(value.totalMoneyEarned) &&
    isArray(value.marketListings) &&
    value.marketListings.every(isMarketListing) &&
    isArray(value.achievements) &&
    value.achievements.every(isAchievement) &&
    isNonNegativeInt(value.breedingCooldown) &&
    isNonNegativeInt(value.showCooldown) &&
    isArray(value.ownedCostumes) &&
    value.ownedCostumes.every(isString) &&
    isObject(value.catCostumes)
  );
}

// ============================================================================
// Relationship Type Guards
// ============================================================================

/** Check if value is a valid CatRelationship */
export function isCatRelationship(value: unknown): value is CatRelationship {
  if (!isObject(value)) return false;

  const hasRequiredFields =
    isString(value.cat1Id) &&
    isString(value.cat2Id) &&
    isNumber(value.score) &&
    value.score >= -100 &&
    value.score <= 100 &&
    isNonNegativeInt(value.lastInteractionDay);

  if (!hasRequiredFields) return false;

  // Optional field
  if (value.lastDecayNotification !== undefined && !isNumber(value.lastDecayNotification)) {
    return false;
  }

  return true;
}

/** Check if value is a valid RelationshipEvent */
export function isRelationshipEvent(value: unknown): value is RelationshipEvent {
  if (!isObject(value)) return false;

  return (
    isString(value.type) &&
    isString(value.cat1Id) &&
    isString(value.cat2Id) &&
    isNumber(value.day) &&
    isNumber(value.scoreChange)
  );
}

// ============================================================================
// Validation Result Types
// ============================================================================

export interface ValidationResult<T> {
  valid: true;
  data: T;
}

export interface ValidationError {
  valid: false;
  error: string;
}

export type ValidationOutcome<T> = ValidationResult<T> | ValidationError;

/** Validate and return typed result or error message */
export function validateCat(value: unknown): ValidationOutcome<Cat> {
  if (isCat(value)) {
    return { valid: true, data: value };
  }
  return { valid: false, error: 'Invalid cat data structure' };
}

/** Validate and return typed GameState or error message */
export function validateGameState(value: unknown): ValidationOutcome<GameState> {
  if (isValidGameState(value)) {
    return { valid: true, data: value };
  }
  return { valid: false, error: 'Invalid game state data structure' };
}

// ============================================================================
// Safe Parsing Utilities
// ============================================================================

/** Safely parse JSON and validate as Cat */
export function parseCat(json: string): ValidationOutcome<Cat> {
  try {
    const parsed = JSON.parse(json) as unknown;
    return validateCat(parsed);
  } catch {
    return { valid: false, error: 'Invalid JSON' };
  }
}

/** Safely parse JSON and validate as GameState */
export function parseGameState(json: string): ValidationOutcome<GameState> {
  try {
    const parsed = JSON.parse(json) as unknown;
    return validateGameState(parsed);
  } catch {
    return { valid: false, error: 'Invalid JSON' };
  }
}
