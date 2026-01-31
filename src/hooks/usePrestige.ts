/**
 * @fileoverview usePrestige - Hook for cat prestige system
 *
 * Allows max-grade (Grade 20) cats to "prestige" - resetting to Grade 10
 * in exchange for permanent bonuses to show earnings and breeding success.
 *
 * @module hooks/usePrestige
 */

import { useCallback } from 'react';
import { Cat } from '@/types/game';
import {
  MAX_PRESTIGE_LEVEL,
  PRESTIGE_RESET_GRADE,
  PRESTIGE_LEVELS,
  calculatePrestigeBonuses,
  getPrestigeLevelInfo,
} from '@/types/prestige';

export interface UsePrestigeReturn {
  /** Check if a cat can prestige (Grade 20, not at max prestige) */
  canPrestige: (cat: Cat) => boolean;
  /** Prestige a cat - returns updated cat data or null if failed */
  prestigeCat: (cat: Cat) => Partial<Cat> | null;
  /** Get the cumulative bonuses for a cat's prestige level */
  getPrestigeBonuses: (cat: Cat) => {
    showEarningsBonus: number;
    breedingSuccessBonus: number;
  };
  /** Get info about the next prestige level */
  getNextPrestigeInfo: (cat: Cat) => ReturnType<typeof getPrestigeLevelInfo>;
  /** Get the costume reward for reaching a prestige level */
  getPrestigeCostumeReward: (prestigeLevel: number) => string | undefined;
}

/**
 * Hook for managing cat prestige mechanics
 *
 * @returns Object containing prestige check, action, and bonus functions
 *
 * @example
 * ```typescript
 * const { canPrestige, prestigeCat, getPrestigeBonuses } = usePrestige();
 *
 * // Check if cat can prestige
 * if (canPrestige(myCat)) {
 *   const updates = prestigeCat(myCat);
 *   if (updates) {
 *     // Apply updates to cat
 *     updateCat(myCat.id, updates);
 *   }
 * }
 *
 * // Get bonuses for show calculations
 * const { showEarningsBonus } = getPrestigeBonuses(myCat);
 * const finalReward = baseReward * (1 + showEarningsBonus);
 * ```
 */
export function usePrestige(): UsePrestigeReturn {
  const canPrestige = useCallback((cat: Cat): boolean => {
    const currentPrestige = cat.prestigeLevel || 0;
    return cat.grade >= 20 && currentPrestige < MAX_PRESTIGE_LEVEL;
  }, []);

  const prestigeCat = useCallback(
    (cat: Cat): Partial<Cat> | null => {
      if (!canPrestige(cat)) {
        return null;
      }

      const currentPrestige = cat.prestigeLevel || 0;
      const newPrestigeLevel = currentPrestige + 1;

      return {
        grade: PRESTIGE_RESET_GRADE,
        prestigeLevel: newPrestigeLevel,
        totalPrestiges: (cat.totalPrestiges || 0) + 1,
      };
    },
    [canPrestige]
  );

  const getPrestigeBonuses = useCallback(
    (cat: Cat): { showEarningsBonus: number; breedingSuccessBonus: number } => {
      const level = cat.prestigeLevel || 0;
      return calculatePrestigeBonuses(level);
    },
    []
  );

  const getNextPrestigeInfo = useCallback((cat: Cat) => {
    const currentPrestige = cat.prestigeLevel || 0;
    if (currentPrestige >= MAX_PRESTIGE_LEVEL) {
      return undefined;
    }
    return getPrestigeLevelInfo(currentPrestige + 1);
  }, []);

  const getPrestigeCostumeReward = useCallback((prestigeLevel: number): string | undefined => {
    const level = PRESTIGE_LEVELS.find((l) => l.stars === prestigeLevel);
    return level?.costumeReward;
  }, []);

  return {
    canPrestige,
    prestigeCat,
    getPrestigeBonuses,
    getNextPrestigeInfo,
    getPrestigeCostumeReward,
  };
}
