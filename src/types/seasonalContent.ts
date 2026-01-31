/**
 * @fileoverview Seasonal Content System
 * Time-limited exclusive costumes, badges, and themes
 * @module types/seasonalContent
 */

import { Costume, CostumeCategory, CostumeRarity } from './costumes';

/** Real-world seasons for theming */
export type RealSeason = 'spring' | 'summer' | 'autumn' | 'winter';

/**
 * A seasonal limited-time costume
 */
export interface SeasonalCostume extends Costume {
  /** Season this costume belongs to */
  seasonId: string;
  /** End date for availability (ISO string) */
  availableUntil: string;
  /** Mark as limited-time item */
  isLimited: true;
}

/**
 * A seasonal badge reward
 */
export interface SeasonalBadge {
  /** Unique badge ID */
  id: string;
  /** Display name */
  name: string;
  /** Emoji icon */
  emoji: string;
  /** Description */
  description: string;
}

/**
 * A game season with exclusive content
 */
export interface Season {
  /** Unique season identifier */
  id: string;
  /** Display name */
  name: string;
  /** Emoji icon */
  emoji: string;
  /** Real-world season for theming */
  theme: RealSeason;
  /** Start date (ISO string) */
  startsAt: string;
  /** End date (ISO string) */
  endsAt: string;
  /** Exclusive costumes for this season */
  costumes: SeasonalCostume[];
  /** Exclusive badge for this season */
  badge: SeasonalBadge;
  /** Background gradient class */
  bgGradient: string;
}

/**
 * Helper to create a seasonal costume
 */
function createSeasonalCostume(
  id: string,
  name: string,
  emoji: string,
  description: string,
  price: number,
  rarity: CostumeRarity,
  showBonus: number,
  happinessBonus: number,
  category: CostumeCategory,
  seasonId: string,
  availableUntil: string
): SeasonalCostume {
  return {
    id,
    name,
    emoji,
    description,
    price,
    rarity,
    showBonus,
    happinessBonus,
    category,
    seasonId,
    availableUntil,
    isLimited: true,
  };
}

/**
 * All defined seasons with their exclusive content
 */
export const SEASONS: Season[] = [
  {
    id: 'winter_2026',
    name: 'Winter Wonderland',
    emoji: '❄️',
    theme: 'winter',
    startsAt: '2026-01-01T00:00:00Z',
    endsAt: '2026-02-28T23:59:59Z',
    bgGradient: 'from-blue-200/30 via-cyan-100/20 to-white/30',
    costumes: [
      createSeasonalCostume(
        'snowflake_collar',
        'Snowflake Collar',
        '❄️',
        'A delicate collar adorned with crystalline snowflakes',
        150,
        'rare',
        12,
        5,
        'accessory',
        'winter_2026',
        '2026-02-28T23:59:59Z'
      ),
      createSeasonalCostume(
        'ice_queen_crown',
        'Ice Queen Crown',
        '👑',
        'A majestic crown of frozen ice crystals',
        350,
        'legendary',
        25,
        8,
        'hat',
        'winter_2026',
        '2026-02-28T23:59:59Z'
      ),
      createSeasonalCostume(
        'aurora_wings',
        'Aurora Wings',
        '🌌',
        'Ethereal wings that shimmer like the northern lights',
        500,
        'legendary',
        30,
        12,
        'special',
        'winter_2026',
        '2026-02-28T23:59:59Z'
      ),
    ],
    badge: {
      id: 'winter_2026_champion',
      name: 'Winter Champion 2026',
      emoji: '❄️',
      description: 'Participated in the Winter Wonderland 2026 season',
    },
  },
  {
    id: 'spring_2026',
    name: 'Spring Bloom',
    emoji: '🌸',
    theme: 'spring',
    startsAt: '2026-03-01T00:00:00Z',
    endsAt: '2026-05-31T23:59:59Z',
    bgGradient: 'from-pink-200/30 via-green-100/20 to-yellow-100/30',
    costumes: [
      createSeasonalCostume(
        'cherry_blossom_bow',
        'Cherry Blossom Bow',
        '🌸',
        'A beautiful bow decorated with cherry blossom petals',
        120,
        'uncommon',
        10,
        6,
        'accessory',
        'spring_2026',
        '2026-05-31T23:59:59Z'
      ),
      createSeasonalCostume(
        'butterfly_wings',
        'Butterfly Wings',
        '🦋',
        'Delicate butterfly wings in spring colors',
        400,
        'legendary',
        28,
        10,
        'special',
        'spring_2026',
        '2026-05-31T23:59:59Z'
      ),
      createSeasonalCostume(
        'flower_crown',
        'Flower Crown',
        '💐',
        'A crown woven from fresh spring flowers',
        200,
        'rare',
        15,
        7,
        'hat',
        'spring_2026',
        '2026-05-31T23:59:59Z'
      ),
    ],
    badge: {
      id: 'spring_2026_champion',
      name: 'Spring Champion 2026',
      emoji: '🌸',
      description: 'Participated in the Spring Bloom 2026 season',
    },
  },
  {
    id: 'summer_2026',
    name: 'Summer Splash',
    emoji: '☀️',
    theme: 'summer',
    startsAt: '2026-06-01T00:00:00Z',
    endsAt: '2026-08-31T23:59:59Z',
    bgGradient: 'from-yellow-200/30 via-orange-100/20 to-red-100/30',
    costumes: [
      createSeasonalCostume(
        'beach_hat',
        'Beach Sun Hat',
        '👒',
        'A stylish sun hat perfect for beach days',
        100,
        'uncommon',
        8,
        5,
        'hat',
        'summer_2026',
        '2026-08-31T23:59:59Z'
      ),
      createSeasonalCostume(
        'surfboard',
        'Surfboard',
        '🏄',
        'A tiny surfboard accessory for the adventurous cat',
        250,
        'rare',
        18,
        8,
        'accessory',
        'summer_2026',
        '2026-08-31T23:59:59Z'
      ),
      createSeasonalCostume(
        'tropical_outfit',
        'Tropical Outfit',
        '🌺',
        'A vibrant Hawaiian-style outfit',
        300,
        'rare',
        20,
        9,
        'outfit',
        'summer_2026',
        '2026-08-31T23:59:59Z'
      ),
    ],
    badge: {
      id: 'summer_2026_champion',
      name: 'Summer Champion 2026',
      emoji: '☀️',
      description: 'Participated in the Summer Splash 2026 season',
    },
  },
  {
    id: 'autumn_2026',
    name: 'Autumn Harvest',
    emoji: '🍂',
    theme: 'autumn',
    startsAt: '2026-09-01T00:00:00Z',
    endsAt: '2026-11-30T23:59:59Z',
    bgGradient: 'from-orange-200/30 via-red-100/20 to-yellow-100/30',
    costumes: [
      createSeasonalCostume(
        'leaf_scarf',
        'Autumn Leaf Scarf',
        '🍁',
        'A cozy scarf decorated with colorful autumn leaves',
        130,
        'uncommon',
        10,
        6,
        'accessory',
        'autumn_2026',
        '2026-11-30T23:59:59Z'
      ),
      createSeasonalCostume(
        'pumpkin_hat',
        'Pumpkin Hat',
        '🎃',
        'A festive pumpkin-themed hat',
        180,
        'rare',
        14,
        6,
        'hat',
        'autumn_2026',
        '2026-11-30T23:59:59Z'
      ),
      createSeasonalCostume(
        'harvest_outfit',
        'Harvest Festival Outfit',
        '🌾',
        'Traditional harvest festival attire',
        280,
        'rare',
        18,
        8,
        'outfit',
        'autumn_2026',
        '2026-11-30T23:59:59Z'
      ),
    ],
    badge: {
      id: 'autumn_2026_champion',
      name: 'Autumn Champion 2026',
      emoji: '🍂',
      description: 'Participated in the Autumn Harvest 2026 season',
    },
  },
];

/**
 * Get the currently active season based on current date
 */
export function getCurrentSeason(): Season | null {
  const now = new Date();
  return (
    SEASONS.find((season) => {
      const start = new Date(season.startsAt);
      const end = new Date(season.endsAt);
      return now >= start && now <= end;
    }) || null
  );
}

/**
 * Check if a costume is currently available
 */
export function isSeasonalCostumeAvailable(costume: SeasonalCostume): boolean {
  const now = new Date();
  const endDate = new Date(costume.availableUntil);
  return now <= endDate;
}

/**
 * Get all currently available seasonal costumes
 */
export function getAvailableSeasonalCostumes(): SeasonalCostume[] {
  const currentSeason = getCurrentSeason();
  if (!currentSeason) return [];
  return currentSeason.costumes.filter(isSeasonalCostumeAvailable);
}

/**
 * Get days remaining in the current season
 */
export function getDaysRemainingInSeason(season: Season): number {
  const now = new Date();
  const end = new Date(season.endsAt);
  const diffMs = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}
