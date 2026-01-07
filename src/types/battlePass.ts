export interface BattlePassReward {
  id: string;
  tier: number;
  type: 'coins' | 'treats' | 'toys' | 'costume' | 'badge' | 'title';
  value: number | string;
  name: string;
  emoji: string;
  isPremium: boolean;
}

export interface BattlePassSeason {
  id: string;
  name: string;
  theme: string;
  emoji: string;
  startsAt: string;
  endsAt: string;
  maxTier: number;
  xpPerTier: number;
}

export interface PlayerBattlePass {
  seasonId: string;
  currentXP: number;
  currentTier: number;
  isPremium: boolean;
  claimedRewards: string[]; // reward IDs
  purchasedAt?: string;
}

export const CURRENT_SEASON: BattlePassSeason = {
  id: 'season_winter_2026',
  name: 'Winter Wonderland',
  theme: 'winter',
  emoji: '❄️',
  startsAt: '2026-01-01',
  endsAt: '2026-02-28',
  maxTier: 30,
  xpPerTier: 100,
};

export const XP_SOURCES = {
  daily_login: 10,
  win_show: 25,
  breed_kitten: 20,
  train_trick: 15,
  socialize: 10,
  complete_challenge: 50,
  complete_chore: 5,
} as const;

export type XPSource = keyof typeof XP_SOURCES;

export const BATTLE_PASS_REWARDS: BattlePassReward[] = [
  // Tier 1-5 (Early rewards)
  {
    id: 'bp_1_free',
    tier: 1,
    type: 'coins',
    value: 50,
    name: '50 Coins',
    emoji: '💰',
    isPremium: false,
  },
  {
    id: 'bp_1_premium',
    tier: 1,
    type: 'treats',
    value: 10,
    name: '10 Treats',
    emoji: '🍬',
    isPremium: true,
  },
  {
    id: 'bp_2_free',
    tier: 2,
    type: 'treats',
    value: 5,
    name: '5 Treats',
    emoji: '🍬',
    isPremium: false,
  },
  {
    id: 'bp_2_premium',
    tier: 2,
    type: 'coins',
    value: 100,
    name: '100 Coins',
    emoji: '💰',
    isPremium: true,
  },
  {
    id: 'bp_3_free',
    tier: 3,
    type: 'toys',
    value: 5,
    name: '5 Toys',
    emoji: '🧸',
    isPremium: false,
  },
  {
    id: 'bp_3_premium',
    tier: 3,
    type: 'badge',
    value: 'snowflake',
    name: 'Snowflake Badge',
    emoji: '❄️',
    isPremium: true,
  },
  {
    id: 'bp_4_free',
    tier: 4,
    type: 'coins',
    value: 75,
    name: '75 Coins',
    emoji: '💰',
    isPremium: false,
  },
  {
    id: 'bp_4_premium',
    tier: 4,
    type: 'treats',
    value: 15,
    name: '15 Treats',
    emoji: '🍬',
    isPremium: true,
  },
  {
    id: 'bp_5_free',
    tier: 5,
    type: 'badge',
    value: 'beginner',
    name: 'Beginner Badge',
    emoji: '⭐',
    isPremium: false,
  },
  {
    id: 'bp_5_premium',
    tier: 5,
    type: 'costume',
    value: 'winter_scarf',
    name: 'Winter Scarf',
    emoji: '🧣',
    isPremium: true,
  },

  // Tier 6-10
  {
    id: 'bp_6_free',
    tier: 6,
    type: 'coins',
    value: 100,
    name: '100 Coins',
    emoji: '💰',
    isPremium: false,
  },
  {
    id: 'bp_6_premium',
    tier: 6,
    type: 'toys',
    value: 10,
    name: '10 Toys',
    emoji: '🧸',
    isPremium: true,
  },
  {
    id: 'bp_7_free',
    tier: 7,
    type: 'treats',
    value: 10,
    name: '10 Treats',
    emoji: '🍬',
    isPremium: false,
  },
  {
    id: 'bp_7_premium',
    tier: 7,
    type: 'coins',
    value: 150,
    name: '150 Coins',
    emoji: '💰',
    isPremium: true,
  },
  {
    id: 'bp_8_free',
    tier: 8,
    type: 'toys',
    value: 8,
    name: '8 Toys',
    emoji: '🧸',
    isPremium: false,
  },
  {
    id: 'bp_8_premium',
    tier: 8,
    type: 'title',
    value: 'Frost Walker',
    name: 'Frost Walker Title',
    emoji: '🏔️',
    isPremium: true,
  },
  {
    id: 'bp_9_free',
    tier: 9,
    type: 'coins',
    value: 125,
    name: '125 Coins',
    emoji: '💰',
    isPremium: false,
  },
  {
    id: 'bp_9_premium',
    tier: 9,
    type: 'treats',
    value: 20,
    name: '20 Treats',
    emoji: '🍬',
    isPremium: true,
  },
  {
    id: 'bp_10_free',
    tier: 10,
    type: 'badge',
    value: 'dedicated',
    name: 'Dedicated Badge',
    emoji: '🎖️',
    isPremium: false,
  },
  {
    id: 'bp_10_premium',
    tier: 10,
    type: 'costume',
    value: 'snowman_hat',
    name: 'Snowman Hat',
    emoji: '⛄',
    isPremium: true,
  },

  // Tier 11-15
  {
    id: 'bp_11_free',
    tier: 11,
    type: 'coins',
    value: 150,
    name: '150 Coins',
    emoji: '💰',
    isPremium: false,
  },
  {
    id: 'bp_11_premium',
    tier: 11,
    type: 'toys',
    value: 15,
    name: '15 Toys',
    emoji: '🧸',
    isPremium: true,
  },
  {
    id: 'bp_12_free',
    tier: 12,
    type: 'treats',
    value: 15,
    name: '15 Treats',
    emoji: '🍬',
    isPremium: false,
  },
  {
    id: 'bp_12_premium',
    tier: 12,
    type: 'coins',
    value: 200,
    name: '200 Coins',
    emoji: '💰',
    isPremium: true,
  },
  {
    id: 'bp_13_free',
    tier: 13,
    type: 'toys',
    value: 10,
    name: '10 Toys',
    emoji: '🧸',
    isPremium: false,
  },
  {
    id: 'bp_13_premium',
    tier: 13,
    type: 'badge',
    value: 'ice_crystal',
    name: 'Ice Crystal Badge',
    emoji: '💎',
    isPremium: true,
  },
  {
    id: 'bp_14_free',
    tier: 14,
    type: 'coins',
    value: 175,
    name: '175 Coins',
    emoji: '💰',
    isPremium: false,
  },
  {
    id: 'bp_14_premium',
    tier: 14,
    type: 'treats',
    value: 25,
    name: '25 Treats',
    emoji: '🍬',
    isPremium: true,
  },
  {
    id: 'bp_15_free',
    tier: 15,
    type: 'badge',
    value: 'halfway',
    name: 'Halfway Badge',
    emoji: '🌟',
    isPremium: false,
  },
  {
    id: 'bp_15_premium',
    tier: 15,
    type: 'costume',
    value: 'ice_crown',
    name: 'Ice Crown',
    emoji: '👑',
    isPremium: true,
  },

  // Tier 16-20
  {
    id: 'bp_16_free',
    tier: 16,
    type: 'coins',
    value: 200,
    name: '200 Coins',
    emoji: '💰',
    isPremium: false,
  },
  {
    id: 'bp_16_premium',
    tier: 16,
    type: 'toys',
    value: 20,
    name: '20 Toys',
    emoji: '🧸',
    isPremium: true,
  },
  {
    id: 'bp_17_free',
    tier: 17,
    type: 'treats',
    value: 20,
    name: '20 Treats',
    emoji: '🍬',
    isPremium: false,
  },
  {
    id: 'bp_17_premium',
    tier: 17,
    type: 'coins',
    value: 250,
    name: '250 Coins',
    emoji: '💰',
    isPremium: true,
  },
  {
    id: 'bp_18_free',
    tier: 18,
    type: 'toys',
    value: 15,
    name: '15 Toys',
    emoji: '🧸',
    isPremium: false,
  },
  {
    id: 'bp_18_premium',
    tier: 18,
    type: 'title',
    value: 'Blizzard Master',
    name: 'Blizzard Master Title',
    emoji: '🌨️',
    isPremium: true,
  },
  {
    id: 'bp_19_free',
    tier: 19,
    type: 'coins',
    value: 225,
    name: '225 Coins',
    emoji: '💰',
    isPremium: false,
  },
  {
    id: 'bp_19_premium',
    tier: 19,
    type: 'treats',
    value: 30,
    name: '30 Treats',
    emoji: '🍬',
    isPremium: true,
  },
  {
    id: 'bp_20_free',
    tier: 20,
    type: 'badge',
    value: 'veteran',
    name: 'Veteran Badge',
    emoji: '🎗️',
    isPremium: false,
  },
  {
    id: 'bp_20_premium',
    tier: 20,
    type: 'costume',
    value: 'aurora_cape',
    name: 'Aurora Cape',
    emoji: '🌌',
    isPremium: true,
  },

  // Tier 21-25
  {
    id: 'bp_21_free',
    tier: 21,
    type: 'coins',
    value: 250,
    name: '250 Coins',
    emoji: '💰',
    isPremium: false,
  },
  {
    id: 'bp_21_premium',
    tier: 21,
    type: 'toys',
    value: 25,
    name: '25 Toys',
    emoji: '🧸',
    isPremium: true,
  },
  {
    id: 'bp_22_free',
    tier: 22,
    type: 'treats',
    value: 25,
    name: '25 Treats',
    emoji: '🍬',
    isPremium: false,
  },
  {
    id: 'bp_22_premium',
    tier: 22,
    type: 'coins',
    value: 300,
    name: '300 Coins',
    emoji: '💰',
    isPremium: true,
  },
  {
    id: 'bp_23_free',
    tier: 23,
    type: 'toys',
    value: 20,
    name: '20 Toys',
    emoji: '🧸',
    isPremium: false,
  },
  {
    id: 'bp_23_premium',
    tier: 23,
    type: 'badge',
    value: 'polar_star',
    name: 'Polar Star Badge',
    emoji: '⭐',
    isPremium: true,
  },
  {
    id: 'bp_24_free',
    tier: 24,
    type: 'coins',
    value: 275,
    name: '275 Coins',
    emoji: '💰',
    isPremium: false,
  },
  {
    id: 'bp_24_premium',
    tier: 24,
    type: 'treats',
    value: 35,
    name: '35 Treats',
    emoji: '🍬',
    isPremium: true,
  },
  {
    id: 'bp_25_free',
    tier: 25,
    type: 'badge',
    value: 'elite',
    name: 'Elite Badge',
    emoji: '💫',
    isPremium: false,
  },
  {
    id: 'bp_25_premium',
    tier: 25,
    type: 'costume',
    value: 'frost_armor',
    name: 'Frost Armor',
    emoji: '🛡️',
    isPremium: true,
  },

  // Tier 26-30 (Final rewards)
  {
    id: 'bp_26_free',
    tier: 26,
    type: 'coins',
    value: 300,
    name: '300 Coins',
    emoji: '💰',
    isPremium: false,
  },
  {
    id: 'bp_26_premium',
    tier: 26,
    type: 'toys',
    value: 30,
    name: '30 Toys',
    emoji: '🧸',
    isPremium: true,
  },
  {
    id: 'bp_27_free',
    tier: 27,
    type: 'treats',
    value: 30,
    name: '30 Treats',
    emoji: '🍬',
    isPremium: false,
  },
  {
    id: 'bp_27_premium',
    tier: 27,
    type: 'coins',
    value: 400,
    name: '400 Coins',
    emoji: '💰',
    isPremium: true,
  },
  {
    id: 'bp_28_free',
    tier: 28,
    type: 'toys',
    value: 25,
    name: '25 Toys',
    emoji: '🧸',
    isPremium: false,
  },
  {
    id: 'bp_28_premium',
    tier: 28,
    type: 'title',
    value: 'Winter Legend',
    name: 'Winter Legend Title',
    emoji: '🏆',
    isPremium: true,
  },
  {
    id: 'bp_29_free',
    tier: 29,
    type: 'coins',
    value: 350,
    name: '350 Coins',
    emoji: '💰',
    isPremium: false,
  },
  {
    id: 'bp_29_premium',
    tier: 29,
    type: 'treats',
    value: 50,
    name: '50 Treats',
    emoji: '🍬',
    isPremium: true,
  },
  {
    id: 'bp_30_free',
    tier: 30,
    type: 'badge',
    value: 'season_master',
    name: 'Season Master Badge',
    emoji: '🏅',
    isPremium: false,
  },
  {
    id: 'bp_30_premium',
    tier: 30,
    type: 'costume',
    value: 'legendary_winter',
    name: 'Legendary Winter Set',
    emoji: '❄️👑',
    isPremium: true,
  },
];

export function getTierRewards(tier: number): BattlePassReward[] {
  return BATTLE_PASS_REWARDS.filter((r) => r.tier === tier);
}

export function calculateTier(xp: number, xpPerTier: number): number {
  return Math.min(Math.floor(xp / xpPerTier) + 1, CURRENT_SEASON.maxTier);
}

export function getXPProgress(
  xp: number,
  xpPerTier: number
): { current: number; required: number; percentage: number } {
  const tierXP = xp % xpPerTier;
  return {
    current: tierXP,
    required: xpPerTier,
    percentage: (tierXP / xpPerTier) * 100,
  };
}

export function getSeasonTimeRemaining(endsAt: string): {
  days: number;
  hours: number;
  isExpired: boolean;
} {
  const now = new Date();
  const end = new Date(endsAt);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, isExpired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return { days, hours, isExpired: false };
}
