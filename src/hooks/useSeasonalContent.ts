/**
 * @fileoverview useSeasonalContent - Hook for seasonal limited-time content
 *
 * Manages seasonal costumes, badges, and time-limited items.
 *
 * @module hooks/useSeasonalContent
 */

import { useMemo } from 'react';
import {
  Season,
  SeasonalCostume,
  SEASONS,
  getCurrentSeason,
  getAvailableSeasonalCostumes,
  getDaysRemainingInSeason,
  isSeasonalCostumeAvailable,
} from '@/types/seasonalContent';

export interface UseSeasonalContentReturn {
  /** Currently active season (null if between seasons) */
  currentSeason: Season | null;
  /** All available seasonal costumes for purchase */
  availableCostumes: SeasonalCostume[];
  /** Days remaining in the current season */
  daysRemaining: number;
  /** Whether we're currently in an active season */
  isSeasonActive: boolean;
  /** Check if a specific costume is still available */
  isCostumeAvailable: (costume: SeasonalCostume) => boolean;
  /** All defined seasons (for calendar/preview) */
  allSeasons: Season[];
  /** Get the next upcoming season */
  nextSeason: Season | null;
}

/**
 * Hook for accessing seasonal limited-time content
 *
 * @returns Object containing seasonal content data and helpers
 *
 * @example
 * ```typescript
 * const { currentSeason, availableCostumes, daysRemaining } = useSeasonalContent();
 *
 * if (currentSeason) {
 *   console.log(`${currentSeason.emoji} ${currentSeason.name} - ${daysRemaining} days left!`);
 *   availableCostumes.forEach(costume => {
 *     console.log(`- ${costume.name}: $${costume.price}`);
 *   });
 * }
 * ```
 */
export function useSeasonalContent(): UseSeasonalContentReturn {
  const currentSeason = useMemo(() => getCurrentSeason(), []);

  const availableCostumes = useMemo(() => getAvailableSeasonalCostumes(), []);

  const daysRemaining = useMemo(() => {
    if (!currentSeason) return 0;
    return getDaysRemainingInSeason(currentSeason);
  }, [currentSeason]);

  const isSeasonActive = currentSeason !== null;

  const nextSeason = useMemo(() => {
    const now = new Date();
    return (
      SEASONS.find((season) => {
        const start = new Date(season.startsAt);
        return start > now;
      }) || null
    );
  }, []);

  return {
    currentSeason,
    availableCostumes,
    daysRemaining,
    isSeasonActive,
    isCostumeAvailable: isSeasonalCostumeAvailable,
    allSeasons: SEASONS,
    nextSeason,
  };
}
