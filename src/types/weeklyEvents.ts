/**
 * @fileoverview Weekly Event Calendar System
 * Rotating daily bonuses that drive player engagement
 * @module types/weeklyEvents
 */

/** Day of week (0 = Sunday, 6 = Saturday) */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Types of bonuses that weekly events can provide */
export type WeeklyBonusType =
  | 'show_prize'
  | 'wheel_rate'
  | 'relationship'
  | 'challenge_xp'
  | 'breeding'
  | 'training';

/**
 * A recurring weekly event with daily bonuses
 */
export interface WeeklyEvent {
  /** Unique event identifier */
  id: string;
  /** Display name of the event */
  name: string;
  /** Emoji icon for the event */
  emoji: string;
  /** Short description of the bonus */
  description: string;
  /** Day of week this event occurs (0-6) */
  dayOfWeek: DayOfWeek;
  /** Type of bonus provided */
  bonusType: WeeklyBonusType;
  /** Multiplier for the bonus (e.g., 2.0 = 2x) */
  multiplier: number;
  /** Background gradient class for UI */
  bgGradient: string;
}

/**
 * All weekly events - one for each day
 * Sunday (0) uses Weekend Warrior
 */
export const WEEKLY_EVENTS: WeeklyEvent[] = [
  {
    id: 'weekend_warrior_sun',
    name: 'Weekend Warrior',
    emoji: '⚡',
    description: '+50% challenge XP all day!',
    dayOfWeek: 0,
    bonusType: 'challenge_xp',
    multiplier: 1.5,
    bgGradient: 'from-orange-500/20 to-yellow-500/20',
  },
  {
    id: 'manic_monday',
    name: 'Manic Monday',
    emoji: '🏆',
    description: '2x show prizes!',
    dayOfWeek: 1,
    bonusType: 'show_prize',
    multiplier: 2.0,
    bgGradient: 'from-purple-500/20 to-pink-500/20',
  },
  {
    id: 'training_tuesday',
    name: 'Training Tuesday',
    emoji: '💪',
    description: '+50% training progress!',
    dayOfWeek: 2,
    bonusType: 'training',
    multiplier: 1.5,
    bgGradient: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    id: 'wild_wednesday',
    name: 'Wild Wednesday',
    emoji: '🎰',
    description: 'Better Lucky Wheel prizes!',
    dayOfWeek: 3,
    bonusType: 'wheel_rate',
    multiplier: 2.0,
    bgGradient: 'from-green-500/20 to-emerald-500/20',
  },
  {
    id: 'breeding_thursday',
    name: 'Breeding Thursday',
    emoji: '💕',
    description: '+25% breeding success!',
    dayOfWeek: 4,
    bonusType: 'breeding',
    multiplier: 1.25,
    bgGradient: 'from-pink-500/20 to-rose-500/20',
  },
  {
    id: 'friendship_friday',
    name: 'Friendship Friday',
    emoji: '❤️',
    description: '2x relationship gains!',
    dayOfWeek: 5,
    bonusType: 'relationship',
    multiplier: 2.0,
    bgGradient: 'from-red-500/20 to-pink-500/20',
  },
  {
    id: 'weekend_warrior_sat',
    name: 'Weekend Warrior',
    emoji: '⚡',
    description: '+50% challenge XP all day!',
    dayOfWeek: 6,
    bonusType: 'challenge_xp',
    multiplier: 1.5,
    bgGradient: 'from-orange-500/20 to-yellow-500/20',
  },
];

/**
 * Get the event for a specific day of week
 */
export function getEventForDay(dayOfWeek: DayOfWeek): WeeklyEvent {
  return WEEKLY_EVENTS.find((e) => e.dayOfWeek === dayOfWeek) || WEEKLY_EVENTS[0];
}
