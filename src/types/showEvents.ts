export type ShowTier = 'local' | 'regional' | 'national' | 'championship';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface ShowTierInfo {
  id: ShowTier;
  name: string;
  emoji: string;
  minGrade: number;
  minWins: number;
  rewardMultiplier: number;
  entryFee: number;
  description: string;
}

export interface SeasonalEvent {
  id: string;
  name: string;
  emoji: string;
  season: Season;
  bonusMultiplier: number;
  description: string;
}

export const SHOW_TIERS: ShowTierInfo[] = [
  {
    id: 'local',
    name: 'Local Show',
    emoji: '🏘️',
    minGrade: 8,
    minWins: 0,
    rewardMultiplier: 1,
    entryFee: 0,
    description: 'Neighborhood cat show. Great for beginners!',
  },
  {
    id: 'regional',
    name: 'Regional Show',
    emoji: '🏙️',
    minGrade: 12,
    minWins: 5,
    rewardMultiplier: 2,
    entryFee: 50,
    description: 'City-wide competition with tougher rivals.',
  },
  {
    id: 'national',
    name: 'National Show',
    emoji: '🗺️',
    minGrade: 16,
    minWins: 15,
    rewardMultiplier: 4,
    entryFee: 150,
    description: 'The best cats from across the nation compete!',
  },
  {
    id: 'championship',
    name: 'Grand Championship',
    emoji: '👑',
    minGrade: 18,
    minWins: 30,
    rewardMultiplier: 8,
    entryFee: 300,
    description: 'The ultimate cat show. Legends are made here!',
  },
];

export const SEASONS: Record<Season, { name: string; emoji: string; months: string }> = {
  spring: { name: 'Spring', emoji: '🌸', months: 'Days 1-25' },
  summer: { name: 'Summer', emoji: '☀️', months: 'Days 26-50' },
  autumn: { name: 'Autumn', emoji: '🍂', months: 'Days 51-75' },
  winter: { name: 'Winter', emoji: '❄️', months: 'Days 76-100' },
};

export const SEASONAL_EVENTS: SeasonalEvent[] = [
  {
    id: 'spring_blossom',
    name: 'Spring Blossom Festival',
    emoji: '🌷',
    season: 'spring',
    bonusMultiplier: 1.5,
    description: 'Celebrate new beginnings! 50% bonus rewards.',
  },
  {
    id: 'summer_spectacular',
    name: 'Summer Spectacular',
    emoji: '🎆',
    season: 'summer',
    bonusMultiplier: 1.5,
    description: 'Hot competition, hot rewards! 50% bonus.',
  },
  {
    id: 'autumn_harvest',
    name: 'Harvest Festival',
    emoji: '🎃',
    season: 'autumn',
    bonusMultiplier: 1.5,
    description: 'Reap what you sow! 50% bonus rewards.',
  },
  {
    id: 'winter_wonderland',
    name: 'Winter Wonderland',
    emoji: '🎄',
    season: 'winter',
    bonusMultiplier: 1.5,
    description: 'Magical winter show! 50% bonus rewards.',
  },
];

// Special events on milestone days
export const SPECIAL_EVENTS = [
  { day: 50, name: 'Golden Jubilee', emoji: '🥇', bonusMultiplier: 2, description: '50-day celebration! Double rewards!' },
  { day: 100, name: 'Centennial Championship', emoji: '💎', bonusMultiplier: 3, description: '100-day milestone! Triple rewards!' },
  { day: 200, name: 'Bicentennial Bash', emoji: '🌟', bonusMultiplier: 4, description: '200-day legend! 4x rewards!' },
  { day: 365, name: 'Anniversary Spectacular', emoji: '🎂', bonusMultiplier: 5, description: 'One year anniversary! 5x rewards!' },
];

export function getSeason(day: number): Season {
  const cycleDay = ((day - 1) % 100) + 1;
  if (cycleDay <= 25) return 'spring';
  if (cycleDay <= 50) return 'summer';
  if (cycleDay <= 75) return 'autumn';
  return 'winter';
}

export function getCurrentSeasonalEvent(day: number): SeasonalEvent | null {
  const season = getSeason(day);
  const cycleDay = ((day - 1) % 100) + 1;
  
  // Seasonal events happen on specific days within each season
  const isEventDay = cycleDay % 5 === 0; // Every 5th day is a seasonal event
  
  if (isEventDay) {
    return SEASONAL_EVENTS.find(e => e.season === season) || null;
  }
  return null;
}

export function getSpecialEvent(day: number) {
  return SPECIAL_EVENTS.find(e => e.day === day) || null;
}

export function getAvailableTiers(totalWins: number): ShowTierInfo[] {
  return SHOW_TIERS.filter(tier => totalWins >= tier.minWins);
}

export function canEnterTier(tier: ShowTierInfo, catGrade: number, totalWins: number): boolean {
  return catGrade >= tier.minGrade && totalWins >= tier.minWins;
}
