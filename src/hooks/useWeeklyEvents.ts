/**
 * @fileoverview useWeeklyEvents - Hook for weekly event calendar system
 *
 * Provides access to the rotating daily bonuses that drive player engagement.
 * Events are client-side only - no database required.
 *
 * @module hooks/useWeeklyEvents
 */

import { useCallback, useMemo } from 'react';
import {
  DayOfWeek,
  WeeklyBonusType,
  WeeklyEvent,
  WEEKLY_EVENTS,
  getEventForDay,
} from '@/types/weeklyEvents';

export interface UseWeeklyEventsReturn {
  /** Get today's active event */
  getTodayEvent: () => WeeklyEvent;
  /** Get the multiplier for a specific bonus type (returns 1.0 if no active bonus) */
  getEventMultiplier: (bonusType: WeeklyBonusType) => number;
  /** Check if a specific bonus type is active today */
  isBonusActive: (bonusType: WeeklyBonusType) => boolean;
  /** All weekly events for calendar display */
  allEvents: WeeklyEvent[];
  /** Today's event (memoized) */
  todayEvent: WeeklyEvent;
  /** Current day of week */
  currentDay: DayOfWeek;
}

/**
 * Hook for accessing weekly event bonuses
 *
 * @returns Object containing event getters and multiplier functions
 *
 * @example
 * ```typescript
 * const { getTodayEvent, getEventMultiplier, isBonusActive } = useWeeklyEvents();
 *
 * // Display today's event
 * const event = getTodayEvent();
 * console.log(`${event.emoji} ${event.name}: ${event.description}`);
 *
 * // Apply show prize multiplier
 * const baseReward = 100;
 * const multiplier = getEventMultiplier('show_prize');
 * const finalReward = baseReward * multiplier; // 200 on Manic Monday
 *
 * // Check if breeding bonus is active
 * if (isBonusActive('breeding')) {
 *   console.log('Breeding Thursday bonus active!');
 * }
 * ```
 */
export function useWeeklyEvents(): UseWeeklyEventsReturn {
  const currentDay = useMemo(() => new Date().getDay() as DayOfWeek, []);

  const todayEvent = useMemo(() => getEventForDay(currentDay), [currentDay]);

  const getTodayEvent = useCallback(() => {
    const dayOfWeek = new Date().getDay() as DayOfWeek;
    return getEventForDay(dayOfWeek);
  }, []);

  const getEventMultiplier = useCallback(
    (bonusType: WeeklyBonusType): number => {
      const event = getTodayEvent();
      return event.bonusType === bonusType ? event.multiplier : 1.0;
    },
    [getTodayEvent]
  );

  const isBonusActive = useCallback(
    (bonusType: WeeklyBonusType): boolean => {
      const event = getTodayEvent();
      return event.bonusType === bonusType;
    },
    [getTodayEvent]
  );

  return {
    getTodayEvent,
    getEventMultiplier,
    isBonusActive,
    allEvents: WEEKLY_EVENTS,
    todayEvent,
    currentDay,
  };
}
