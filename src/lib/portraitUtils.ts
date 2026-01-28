import { Cat } from '@/types/game';

/**
 * Compute a hash representing the visual state of a cat.
 * Used for portrait caching - if hash matches, portrait is still valid.
 *
 * Includes:
 * - Breed (affects face shape, body type)
 * - Appearance (fur color, pattern, eye color, hair length, facial features)
 * - Costume ID (if equipped, must be in portrait)
 * - Personality (affects expression in portrait)
 */
export function computeAppearanceHash(cat: Cat, costumeId?: string): string {
  const data = {
    breed: cat.breed,
    appearance: cat.appearance || null,
    costumeId: costumeId || null,
    personality: cat.personality, // Include personality for expression matching
  };

  // Create a simple hash from the JSON representation
  const jsonStr = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Convert to base36 for shorter string
  return Math.abs(hash).toString(36);
}

/**
 * Check if a cat's portrait is outdated based on appearance hash.
 */
export function isPortraitOutdated(cat: Cat, costumeId?: string): boolean {
  if (!cat.portraitUrl) return false;
  if (!cat.appearanceHash) return false; // Legacy portrait, can't determine

  const currentHash = computeAppearanceHash(cat, costumeId);
  return cat.appearanceHash !== currentHash;
}

/**
 * Estimate credit cost for portrait generation.
 */
export const PORTRAIT_CREDIT_COST = 1;

/**
 * Default portrait package cost in game currency.
 */
export const PORTRAIT_PACKAGE_COST = 5000;

/**
 * Default number of portraits per package.
 */
export const PORTRAIT_PACKAGE_SIZE = 3;

/**
 * Check if user has enough credits for portrait generation.
 */
export function hasEnoughCredits(creditsRemaining: number, count: number = 1): boolean {
  return creditsRemaining >= count * PORTRAIT_CREDIT_COST;
}

/**
 * Calculate how many portraits can be generated with available credits.
 */
export function maxPortraitsWithCredits(creditsRemaining: number): number {
  return Math.floor(creditsRemaining / PORTRAIT_CREDIT_COST);
}
