/**
 * usePortraitStatus Hook
 *
 * Tracks which cats have outdated portraits based on appearance hash comparison.
 * Provides utilities for detecting portrait drift and batch regeneration lists.
 */

import { useMemo, useCallback } from 'react';
import { Cat } from '@/types/game';
import { isPortraitOutdated, computeAppearanceHash } from '@/lib/portraitUtils';

import { createLogger } from '@/lib/logger';

const logger = createLogger('usePortraitStatus');

export interface UsePortraitStatusReturn {
  /** Cats with outdated portraits (appearance changed since portrait generation) */
  outdatedCats: Cat[];
  /** Cats without any portrait */
  catsWithoutPortrait: Cat[];
  /** All cats needing portrait generation (no portrait OR outdated) */
  catsNeedingPortrait: Cat[];
  /** Check if a specific cat's portrait is outdated */
  checkIfOutdated: (cat: Cat, costumeId?: string) => boolean;
  /** Get the current appearance hash for a cat */
  getAppearanceHash: (cat: Cat, costumeId?: string) => string;
  /** Count of cats with up-to-date portraits */
  upToDateCount: number;
  /** Count of cats with outdated portraits */
  outdatedCount: number;
  /** Count of cats without portraits */
  noPortraitCount: number;
}

/**
 * Hook to track portrait status across all cats
 *
 * @param cats - Array of all cats
 * @param catCostumes - Map of cat ID to equipped costume ID
 * @returns Portrait status utilities and lists
 *
 * @example
 * ```tsx
 * const { outdatedCats, catsNeedingPortrait } = usePortraitStatus(cats, catCostumes);
 *
 * if (outdatedCats.length > 0) {
 *   logger.info(`${outdatedCats.length} cats have outdated portraits`);
 * }
 * ```
 */
export function usePortraitStatus(
  cats: Cat[],
  catCostumes: Record<string, string> = {}
): UsePortraitStatusReturn {
  // Memoize the outdated check function
  const checkIfOutdated = useCallback(
    (cat: Cat, costumeId?: string): boolean => {
      return isPortraitOutdated(cat, costumeId);
    },
    []
  );

  // Memoize hash computation
  const getAppearanceHash = useCallback((cat: Cat, costumeId?: string): string => {
    return computeAppearanceHash(cat, costumeId);
  }, []);

  // Compute categorized lists
  const { outdatedCats, catsWithoutPortrait, catsNeedingPortrait } = useMemo(() => {
    const outdated: Cat[] = [];
    const noPortrait: Cat[] = [];
    const needsPortrait: Cat[] = [];

    for (const cat of cats) {
      const costumeId = catCostumes[cat.id];
      const hasPortrait = !!cat.portraitUrl;
      const isOutdated = hasPortrait && isPortraitOutdated(cat, costumeId);

      if (!hasPortrait) {
        noPortrait.push(cat);
        needsPortrait.push(cat);
      } else if (isOutdated) {
        outdated.push(cat);
        needsPortrait.push(cat);
      }
    }

    return {
      outdatedCats: outdated,
      catsWithoutPortrait: noPortrait,
      catsNeedingPortrait: needsPortrait,
    };
  }, [cats, catCostumes]);

  // Compute counts
  const counts = useMemo(() => {
    const total = cats.length;
    const outdated = outdatedCats.length;
    const noPortrait = catsWithoutPortrait.length;
    const upToDate = total - outdated - noPortrait;

    return {
      upToDateCount: upToDate,
      outdatedCount: outdated,
      noPortraitCount: noPortrait,
    };
  }, [cats.length, outdatedCats.length, catsWithoutPortrait.length]);

  return {
    outdatedCats,
    catsWithoutPortrait,
    catsNeedingPortrait,
    checkIfOutdated,
    getAppearanceHash,
    ...counts,
  };
}

export default usePortraitStatus;
