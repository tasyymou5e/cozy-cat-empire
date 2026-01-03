import { Cat } from '@/types/game';

/**
 * Compute a hash representing the visual state of a cat.
 * Used for portrait caching - if hash matches, portrait is still valid.
 */
export function computeAppearanceHash(cat: Cat, costumeId?: string): string {
  const data = {
    breed: cat.breed,
    appearance: cat.appearance || null,
    costumeId: costumeId || null,
  };
  
  // Create a simple hash from the JSON representation
  const jsonStr = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
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
