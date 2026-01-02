export type CatBreed = 'stray' | 'tabby' | 'persian' | 'siamese' | 'maine-coon' | 'british-shorthair' | 'ragdoll' | 'bengal';
export type CatPersonality = 'lazy' | 'playful' | 'affectionate' | 'independent' | 'curious' | 'shy';

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
  marketListings: MarketListing[];
}

export const CAT_NAMES = [
  'Whiskers', 'Mittens', 'Shadow', 'Luna', 'Oliver', 'Mochi', 'Ginger',
  'Patches', 'Smokey', 'Tiger', 'Cleo', 'Felix', 'Bella', 'Max', 'Coco',
  'Simba', 'Nala', 'Oreo', 'Pumpkin', 'Biscuit', 'Waffle', 'Muffin',
  'Pepper', 'Gizmo', 'Tigger', 'Chester', 'Jasper', 'Oscar', 'Leo',
  'Charlie', 'Milo', 'Loki', 'Salem', 'Binx', 'Boots', 'Socks'
];

export const BREEDS: Record<CatBreed, { name: string; baseValue: number; rarity: number }> = {
  'stray': { name: 'Stray', baseValue: 30, rarity: 1 },
  'tabby': { name: 'Tabby', baseValue: 80, rarity: 2 },
  'persian': { name: 'Persian', baseValue: 200, rarity: 4 },
  'siamese': { name: 'Siamese', baseValue: 180, rarity: 4 },
  'maine-coon': { name: 'Maine Coon', baseValue: 250, rarity: 5 },
  'british-shorthair': { name: 'British Shorthair', baseValue: 220, rarity: 4 },
  'ragdoll': { name: 'Ragdoll', baseValue: 280, rarity: 5 },
  'bengal': { name: 'Bengal', baseValue: 350, rarity: 6 },
};

export const PERSONALITIES: CatPersonality[] = ['lazy', 'playful', 'affectionate', 'independent', 'curious', 'shy'];

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

export const ACHIEVEMENTS = [
  { id: 'first_cat', name: 'First Friend', description: 'Adopt your first cat', target: 1 },
  { id: 'cat_collector', name: 'Cat Collector', description: 'Own 10 cats', target: 10 },
  { id: 'cat_empire', name: 'Cat Empire', description: 'Own 50 cats', target: 50 },
  { id: 'show_winner', name: 'Show Winner', description: 'Win 5 cat shows', target: 5 },
  { id: 'champion', name: 'Champion Breeder', description: 'Win 25 cat shows', target: 25 },
  { id: 'millionaire', name: 'Cat Millionaire', description: 'Earn 10,000 cat money', target: 10000 },
];
