/**
 * Avatar Cache System
 * 
 * Caches generated Paper.js avatars to avoid regenerating them.
 * Uses localStorage with LRU eviction policy.
 */

import { Cat } from '@/types/game';
import { CatAppearance } from '@/types/catAppearance';

const CACHE_PREFIX = 'cat-avatar-cache-';
const CACHE_INDEX_KEY = 'cat-avatar-cache-index';
const MAX_CACHE_ENTRIES = 100;
const CACHE_VERSION = 1;

/**
 * Cache entry structure
 */
interface CacheEntry {
  /** Generated SVG data */
  svgData: string;
  /** Timestamp when cached */
  timestamp: number;
  /** Cache version for invalidation */
  version: number;
}

/**
 * Cache index tracking all entries
 */
interface CacheIndex {
  entries: Array<{ hash: string; timestamp: number }>;
  version: number;
}

/**
 * Generate a unique hash from cat appearance data
 * Used as cache key to identify identical appearances
 */
export function generateAppearanceHash(cat: Cat): string {
  const appearance = (cat.appearance || {}) as CatAppearance;
  
  // Create a deterministic string from appearance properties
  const hashData = [
    cat.breed,
    appearance.furColor || 'default',
    appearance.pattern || 'solid',
    appearance.patternColor || '',
    appearance.eyeColor || 'default',
    appearance.hairLength || 'short',
    Array.isArray(appearance.facialFeature) ? appearance.facialFeature.sort().join(',') : (appearance.facialFeature || ''),
    cat.grade, // Include grade for tier-specific effects
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < hashData.length; i++) {
    const char = hashData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return `v${CACHE_VERSION}_${Math.abs(hash).toString(36)}`;
}

/**
 * Generate hash including costume for cache key
 */
export function generateFullAvatarHash(cat: Cat, costumeId?: string, size?: string): string {
  const baseHash = generateAppearanceHash(cat);
  const costumeHash = costumeId || 'none';
  const sizeHash = size || 'md';
  return `${baseHash}_${costumeHash}_${sizeHash}`;
}

/**
 * Get cache index from localStorage
 */
function getCacheIndex(): CacheIndex {
  try {
    const stored = localStorage.getItem(CACHE_INDEX_KEY);
    if (stored) {
      const index = JSON.parse(stored);
      if (index.version === CACHE_VERSION) {
        return index;
      }
    }
  } catch (e) {
    console.warn('[AvatarCache] Failed to load index:', e);
  }
  return { entries: [], version: CACHE_VERSION };
}

/**
 * Save cache index to localStorage
 */
function saveCacheIndex(index: CacheIndex): void {
  try {
    localStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(index));
  } catch (e) {
    console.warn('[AvatarCache] Failed to save index:', e);
  }
}

/**
 * Get cached avatar by hash
 */
export function getCachedAvatar(hash: string): string | null {
  try {
    const key = CACHE_PREFIX + hash;
    const stored = localStorage.getItem(key);
    if (stored) {
      const entry: CacheEntry = JSON.parse(stored);
      if (entry.version === CACHE_VERSION) {
        // Update access time in index
        const index = getCacheIndex();
        const entryIndex = index.entries.findIndex(e => e.hash === hash);
        if (entryIndex !== -1) {
          index.entries[entryIndex].timestamp = Date.now();
          saveCacheIndex(index);
        }
        return entry.svgData;
      }
    }
  } catch (e) {
    console.warn('[AvatarCache] Failed to get cached avatar:', e);
  }
  return null;
}

/**
 * Store avatar in cache
 */
export function setCachedAvatar(hash: string, svgData: string): void {
  try {
    const index = getCacheIndex();
    
    // Check if we need to evict old entries
    while (index.entries.length >= MAX_CACHE_ENTRIES) {
      // Find oldest entry
      index.entries.sort((a, b) => a.timestamp - b.timestamp);
      const oldest = index.entries.shift();
      if (oldest) {
        localStorage.removeItem(CACHE_PREFIX + oldest.hash);
      }
    }
    
    // Store the new entry
    const key = CACHE_PREFIX + hash;
    const entry: CacheEntry = {
      svgData,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };
    localStorage.setItem(key, JSON.stringify(entry));
    
    // Update index
    const existingIndex = index.entries.findIndex(e => e.hash === hash);
    if (existingIndex !== -1) {
      index.entries[existingIndex].timestamp = Date.now();
    } else {
      index.entries.push({ hash, timestamp: Date.now() });
    }
    saveCacheIndex(index);
  } catch (e) {
    console.warn('[AvatarCache] Failed to cache avatar:', e);
  }
}

/**
 * Clear all cached avatars
 */
export function clearAvatarCache(): void {
  try {
    const index = getCacheIndex();
    for (const entry of index.entries) {
      localStorage.removeItem(CACHE_PREFIX + entry.hash);
    }
    localStorage.removeItem(CACHE_INDEX_KEY);
  } catch (e) {
    console.warn('[AvatarCache] Failed to clear cache:', e);
  }
}

/**
 * Prune cache to specified max entries
 */
export function pruneAvatarCache(maxEntries: number = MAX_CACHE_ENTRIES): number {
  try {
    const index = getCacheIndex();
    let pruned = 0;
    
    while (index.entries.length > maxEntries) {
      index.entries.sort((a, b) => a.timestamp - b.timestamp);
      const oldest = index.entries.shift();
      if (oldest) {
        localStorage.removeItem(CACHE_PREFIX + oldest.hash);
        pruned++;
      }
    }
    
    saveCacheIndex(index);
    return pruned;
  } catch (e) {
    console.warn('[AvatarCache] Failed to prune cache:', e);
    return 0;
  }
}

/**
 * Get cache statistics
 */
export function getAvatarCacheStats(): { entries: number; maxEntries: number } {
  const index = getCacheIndex();
  return {
    entries: index.entries.length,
    maxEntries: MAX_CACHE_ENTRIES,
  };
}

/**
 * Check if avatar is cached
 */
export function isAvatarCached(hash: string): boolean {
  const index = getCacheIndex();
  return index.entries.some(e => e.hash === hash);
}
