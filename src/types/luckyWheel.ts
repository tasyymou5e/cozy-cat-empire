export type PrizeRarity = 'common' | 'uncommon' | 'rare' | 'ultra_rare' | 'legendary';

export interface WheelPrize {
  id: string;
  name: string;
  emoji: string;
  rarity: PrizeRarity;
  probability: number; // 0-100
  reward: {
    coins?: number;
    food?: number;
    medicine?: number;
    toys?: number;
    treats?: number;
    costumeId?: string;
  };
}

export const WHEEL_PRIZES: WheelPrize[] = [
  // Common (60%)
  {
    id: 'coins_25',
    name: '25 Coins',
    emoji: '🪙',
    rarity: 'common',
    probability: 20,
    reward: { coins: 25 },
  },
  {
    id: 'coins_50',
    name: '50 Coins',
    emoji: '💰',
    rarity: 'common',
    probability: 20,
    reward: { coins: 50 },
  },
  {
    id: 'coins_75',
    name: '75 Coins',
    emoji: '💵',
    rarity: 'common',
    probability: 20,
    reward: { coins: 75 },
  },

  // Uncommon (25%)
  {
    id: 'food_5',
    name: '5 Food',
    emoji: '🍖',
    rarity: 'uncommon',
    probability: 8,
    reward: { food: 5 },
  },
  {
    id: 'treats_5',
    name: '5 Treats',
    emoji: '🍬',
    rarity: 'uncommon',
    probability: 8,
    reward: { treats: 5 },
  },
  {
    id: 'toys_3',
    name: '3 Toys',
    emoji: '🎾',
    rarity: 'uncommon',
    probability: 5,
    reward: { toys: 3 },
  },
  {
    id: 'medicine_2',
    name: '2 Medicine',
    emoji: '💊',
    rarity: 'uncommon',
    probability: 4,
    reward: { medicine: 2 },
  },

  // Rare (10%)
  {
    id: 'coins_150',
    name: '150 Coins',
    emoji: '💎',
    rarity: 'rare',
    probability: 5,
    reward: { coins: 150 },
  },
  {
    id: 'resource_bundle',
    name: 'Resource Bundle',
    emoji: '📦',
    rarity: 'rare',
    probability: 3,
    reward: { food: 10, treats: 5, toys: 3 },
  },
  {
    id: 'coins_200',
    name: '200 Coins',
    emoji: '🏆',
    rarity: 'rare',
    probability: 2,
    reward: { coins: 200 },
  },

  // Ultra Rare (4%)
  {
    id: 'coins_350',
    name: '350 Coins',
    emoji: '👑',
    rarity: 'ultra_rare',
    probability: 2,
    reward: { coins: 350 },
  },
  {
    id: 'mega_bundle',
    name: 'Mega Bundle',
    emoji: '🎁',
    rarity: 'ultra_rare',
    probability: 2,
    reward: { food: 20, medicine: 5, toys: 5, treats: 10 },
  },

  // Legendary (1%)
  {
    id: 'jackpot',
    name: 'Jackpot!',
    emoji: '🌟',
    rarity: 'legendary',
    probability: 1,
    reward: { coins: 500 },
  },
];

export const RARITY_COLORS: Record<PrizeRarity, string> = {
  common: 'bg-gray-100 text-gray-700 border-gray-300',
  uncommon: 'bg-green-100 text-green-700 border-green-300',
  rare: 'bg-blue-100 text-blue-700 border-blue-300',
  ultra_rare: 'bg-purple-100 text-purple-700 border-purple-300',
  legendary: 'bg-amber-100 text-amber-700 border-amber-300',
};

export const RARITY_GLOW: Record<PrizeRarity, string> = {
  common: '',
  uncommon: 'ring-2 ring-green-400/50',
  rare: 'ring-2 ring-blue-400/50 animate-pulse',
  ultra_rare: 'ring-2 ring-purple-400/50 animate-pulse',
  legendary: 'ring-4 ring-amber-400 animate-bounce',
};

export interface WheelState {
  lastSpinDate: string | null;
  spinsToday: number;
  totalSpins: number;
  bestPrize: PrizeRarity | null;
}

export function selectRandomPrize(): WheelPrize {
  const random = Math.random() * 100;
  let cumulative = 0;

  for (const prize of WHEEL_PRIZES) {
    cumulative += prize.probability;
    if (random <= cumulative) {
      return prize;
    }
  }

  return WHEEL_PRIZES[0]; // Fallback to first prize
}

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}
