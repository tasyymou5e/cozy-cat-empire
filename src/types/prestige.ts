/**
 * @fileoverview Cat Prestige System
 * Allows max-grade cats to reset for permanent bonuses
 * @module types/prestige
 */

/**
 * A prestige level with associated bonuses
 */
export interface PrestigeLevel {
  /** Number of stars (1-3) */
  stars: number;
  /** Display name */
  name: string;
  /** Cumulative show earnings bonus (e.g., 0.05 = +5%) */
  showEarningsBonus: number;
  /** Cumulative breeding success bonus */
  breedingSuccessBonus: number;
  /** Optional costume reward ID */
  costumeReward?: string;
  /** Required grade to prestige (always 20) */
  requiredGrade: 20;
}

/**
 * All available prestige levels
 * Each subsequent level is cumulative with previous
 */
export const PRESTIGE_LEVELS: PrestigeLevel[] = [
  {
    stars: 1,
    name: 'Rising Star',
    showEarningsBonus: 0.05,
    breedingSuccessBonus: 0,
    requiredGrade: 20,
  },
  {
    stars: 2,
    name: 'Shining Star',
    showEarningsBonus: 0.1,
    breedingSuccessBonus: 0.02,
    requiredGrade: 20,
  },
  {
    stars: 3,
    name: 'Legendary Star',
    showEarningsBonus: 0.15,
    breedingSuccessBonus: 0.05,
    costumeReward: 'prestige_crown',
    requiredGrade: 20,
  },
];

/** Maximum prestige level a cat can reach */
export const MAX_PRESTIGE_LEVEL = 3;

/** Grade cat resets to after prestiging */
export const PRESTIGE_RESET_GRADE = 10;

/**
 * Get display info for a prestige level
 */
export function getPrestigeLevelInfo(level: number): PrestigeLevel | undefined {
  return PRESTIGE_LEVELS.find((p) => p.stars === level);
}

/**
 * Calculate total bonuses for a given prestige level
 */
export function calculatePrestigeBonuses(prestigeLevel: number): {
  showEarningsBonus: number;
  breedingSuccessBonus: number;
} {
  const level = Math.min(Math.max(0, prestigeLevel), MAX_PRESTIGE_LEVEL);
  const applicableLevels = PRESTIGE_LEVELS.slice(0, level);

  return applicableLevels.reduce(
    (acc, l) => ({
      showEarningsBonus: acc.showEarningsBonus + l.showEarningsBonus,
      breedingSuccessBonus: acc.breedingSuccessBonus + l.breedingSuccessBonus,
    }),
    { showEarningsBonus: 0, breedingSuccessBonus: 0 }
  );
}

/**
 * Star display colors based on prestige level
 */
export const PRESTIGE_STAR_COLORS: Record<number, string> = {
  0: 'text-muted-foreground',
  1: 'text-yellow-500',
  2: 'text-amber-400',
  3: 'text-gradient-to-r from-yellow-400 via-orange-400 to-red-400',
};

/**
 * Background styles for prestige badges
 */
export const PRESTIGE_BADGE_STYLES: Record<number, string> = {
  0: '',
  1: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400',
  2: 'bg-amber-100 dark:bg-amber-900/30 border-amber-400',
  3: 'bg-gradient-to-r from-yellow-100 via-orange-100 to-red-100 dark:from-yellow-900/30 dark:via-orange-900/30 dark:to-red-900/30 border-orange-400',
};
