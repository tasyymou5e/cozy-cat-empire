import { TrickId } from './grading';
import { CatAppearance } from './catAppearance';
import { SpecializationType } from './specializations';

export type CatBreed =
  | 'stray'
  | 'tabby'
  | 'persian'
  | 'siamese'
  | 'maine-coon'
  | 'british-shorthair'
  | 'ragdoll'
  | 'bengal';
export type CatPersonality =
  | 'lazy'
  | 'playful'
  | 'affectionate'
  | 'independent'
  | 'curious'
  | 'shy';

/** Extended specialization data stored on cat */
export interface CatSpecializationData {
  type: SpecializationType;
  level: number; // 1-3 mastery
  xp: number;
  specializedAt: string; // ISO date
}

export interface Cat {
  id: string;
  type: 'stray' | 'adopted' | 'pure';
  breed: CatBreed;
  name: string;
  health: number;
  happiness: number;
  hunger: number;
  value: number;
  age: number;
  personality: CatPersonality;
  showWins: number;
  isForSale: boolean;
  // Grading system
  grade: number; // 1-20
  tricksLearned: TrickId[];
  trickProgress: Record<TrickId, number>; // 0-100 for each trick
  restLevel: number; // 0-100
  feedingScore: number; // Cumulative feeding contribution
  lastTrainingDay: number;
  appearance?: CatAppearance; // Visual customization
  portraitUrl?: string; // AI-generated portrait URL
  portraitGeneratedAt?: number; // Timestamp of generation
  appearanceHash?: string; // Hash of appearance/costume when portrait was generated (for caching)
  // Specialization system - now stores full data
  specialization?: CatSpecializationData;
}

export interface Resources {
  food: number;
  medicine: number;
  toys: number;
  treats: number;
}

export interface MarketListing {
  id: string;
  cat: Cat;
  price: number;
  seller: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  target: number;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface GameState {
  cats: Cat[];
  money: number;
  space: number;
  houseSize: 'apartment' | 'house' | 'mansion' | 'farm';
  acres: number;
  day: number;
  resources: Resources;
  reputation: number;
  totalShowWins: number;
  catsAdopted: number;
  totalMoneyEarned: number;
  marketListings: MarketListing[];
  achievements: Achievement[];
  breedingCooldown: number;
  showCooldown: number; // Days until next show allowed
  ownedCostumes: string[]; // Costume IDs
  catCostumes: Record<string, string>; // catId -> costumeId
}

// Re-export from canonical source for backward compatibility
export { UNIVERSAL_NAMES as CAT_NAMES } from './catNames';

export const BREEDS: Record<CatBreed, { name: string; baseValue: number; rarity: number }> = {
  stray: { name: 'Stray', baseValue: 30, rarity: 1 },
  tabby: { name: 'Tabby', baseValue: 80, rarity: 2 },
  persian: { name: 'Persian', baseValue: 200, rarity: 4 },
  siamese: { name: 'Siamese', baseValue: 180, rarity: 4 },
  'maine-coon': { name: 'Maine Coon', baseValue: 250, rarity: 5 },
  'british-shorthair': { name: 'British Shorthair', baseValue: 220, rarity: 4 },
  ragdoll: { name: 'Ragdoll', baseValue: 280, rarity: 5 },
  bengal: { name: 'Bengal', baseValue: 350, rarity: 6 },
};

export const PERSONALITIES: CatPersonality[] = [
  'lazy',
  'playful',
  'affectionate',
  'independent',
  'curious',
  'shy',
];

export const CAT_COSTS = {
  stray: 0,
  adopted: 50,
  pure: 200,
};

export const RESOURCE_COSTS = {
  food: 10,
  medicine: 25,
  toys: 15,
  treats: 8,
};

export const HOUSE_UPGRADES = {
  apartment: { next: 'house' as const, cost: 500, space: 10 },
  house: { next: 'mansion' as const, cost: 2000, space: 25 },
  mansion: { next: 'farm' as const, cost: 10000, space: 50 },
  farm: { next: null, baseCost: 5000, spacePerAcre: 20 },
};

export const CHORE_TYPES = [
  { id: 'clean', name: 'Clean Litter', emoji: '🧹', baseReward: 15, time: 1 },
  { id: 'groom', name: 'Groom Cats', emoji: '✂️', baseReward: 25, time: 2 },
  { id: 'play', name: 'Play Session', emoji: '🎾', baseReward: 20, time: 1 },
  { id: 'vet', name: 'Vet Checkup', emoji: '💉', baseReward: 40, time: 3 },
  { id: 'socialize', name: 'Socialize', emoji: '🤝', baseReward: 30, time: 2 },
];

export const ACHIEVEMENT_DEFS = [
  {
    id: 'first_cat',
    name: 'First Friend',
    description: 'Adopt your first cat',
    target: 1,
    type: 'cats',
  },
  {
    id: 'cat_collector',
    name: 'Cat Collector',
    description: 'Own 10 cats at once',
    target: 10,
    type: 'cats',
  },
  {
    id: 'cat_empire',
    name: 'Cat Empire',
    description: 'Own 50 cats at once',
    target: 50,
    type: 'cats',
  },
  {
    id: 'show_winner',
    name: 'Show Winner',
    description: 'Win 5 cat shows',
    target: 5,
    type: 'showWins',
  },
  {
    id: 'champion',
    name: 'Champion Breeder',
    description: 'Win 25 cat shows',
    target: 25,
    type: 'showWins',
  },
  {
    id: 'millionaire',
    name: 'Cat Millionaire',
    description: 'Earn $10,000 total',
    target: 10000,
    type: 'money',
  },
  {
    id: 'breeder',
    name: 'First Litter',
    description: 'Breed your first kitten',
    target: 1,
    type: 'breeding',
  },
  {
    id: 'master_breeder',
    name: 'Master Breeder',
    description: 'Breed 10 kittens',
    target: 10,
    type: 'breeding',
  },
  {
    id: 'homeowner',
    name: 'Homeowner',
    description: 'Upgrade to a house',
    target: 1,
    type: 'house',
  },
  { id: 'farmer', name: 'Farmer', description: 'Own a farm', target: 1, type: 'farm' },
  {
    id: 'land_baron',
    name: 'Land Baron',
    description: 'Own 100 acres',
    target: 100,
    type: 'acres',
  },
  // Relationship achievements
  {
    id: 'first_friendship',
    name: 'New Friendship',
    description: 'Two cats become friends',
    target: 1,
    type: 'friendship',
  },
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Have 5+ cat friendships',
    target: 5,
    type: 'friendship',
  },
  {
    id: 'peacemaker',
    name: 'Peacemaker',
    description: 'Improve a rivalry to friendship',
    target: 1,
    type: 'peacemaker',
  },
  {
    id: 'perfect_match',
    name: 'Perfect Match',
    description: 'Breed best friend cats',
    target: 1,
    type: 'bestFriendBreed',
  },
  {
    id: 'drama_queen',
    name: 'Drama Queen',
    description: 'Have 3+ rivalries',
    target: 3,
    type: 'rivalry',
  },
  {
    id: 'clique_leader',
    name: 'Clique Leader',
    description: 'Form a cat group with 4+ members',
    target: 4,
    type: 'groupSize',
  },
  // Challenge achievements
  {
    id: 'challenge_starter',
    name: 'Challenge Starter',
    description: 'Complete 5 weekly challenges',
    target: 5,
    type: 'challengesCompleted',
  },
  {
    id: 'challenge_master',
    name: 'Challenge Master',
    description: 'Complete 10 weekly challenges',
    target: 10,
    type: 'challengesCompleted',
  },
  {
    id: 'challenge_legend',
    name: 'Challenge Legend',
    description: 'Complete 25 weekly challenges',
    target: 25,
    type: 'challengesCompleted',
  },
  // Streak achievements
  {
    id: 'streak_warrior',
    name: 'Streak Warrior',
    description: 'Maintain a 3-week challenge streak',
    target: 3,
    type: 'streak',
  },
  {
    id: 'streak_champion',
    name: 'Streak Champion',
    description: 'Maintain a 5-week challenge streak',
    target: 5,
    type: 'streak',
  },
  {
    id: 'streak_legend',
    name: 'Streak Legend',
    description: 'Maintain a 10-week challenge streak',
    target: 10,
    type: 'streak',
  },
  // Daily login achievements
  {
    id: 'login_3_days',
    name: 'Regular Visitor',
    description: 'Log in 3 days in a row',
    target: 3,
    type: 'loginStreak',
  },
  {
    id: 'login_7_days',
    name: 'Weekly Regular',
    description: 'Log in 7 days in a row',
    target: 7,
    type: 'loginStreak',
  },
  {
    id: 'login_14_days',
    name: 'Dedicated Player',
    description: 'Log in 14 days in a row',
    target: 14,
    type: 'loginStreak',
  },
  {
    id: 'login_30_days',
    name: 'Cat Farm Legend',
    description: 'Log in 30 days in a row',
    target: 30,
    type: 'loginStreak',
  },
  // VIP achievements
  {
    id: 'vip_bronze',
    name: 'VIP Status',
    description: 'Reach VIP Bronze with a 30-day streak',
    target: 30,
    type: 'loginStreak',
  },
  {
    id: 'vip_silver',
    name: 'VIP Elite',
    description: 'Reach VIP Silver with a 60-day streak',
    target: 60,
    type: 'loginStreak',
  },
  {
    id: 'vip_gold',
    name: 'VIP Legend',
    description: 'Reach VIP Gold with a 90-day streak',
    target: 90,
    type: 'loginStreak',
  },
] as const;

export type AchievementType = (typeof ACHIEVEMENT_DEFS)[number]['type'];
