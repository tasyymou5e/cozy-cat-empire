export interface Cat {
  id: string;
  type: 'stray' | 'adopted' | 'pure';
  name: string;
  health: number;
  happiness: number;
  value: number;
}

export interface GameState {
  cats: Cat[];
  money: number;
  space: number;
  houseSize: 'apartment' | 'house' | 'farm';
  acres: number;
  day: number;
}

export const CAT_NAMES = [
  'Whiskers', 'Mittens', 'Shadow', 'Luna', 'Oliver', 'Mochi', 'Ginger',
  'Patches', 'Smokey', 'Tiger', 'Cleo', 'Felix', 'Bella', 'Max', 'Coco',
  'Simba', 'Nala', 'Oreo', 'Pumpkin', 'Biscuit', 'Waffle', 'Muffin'
];

export const CAT_COSTS = {
  stray: 0,
  adopted: 20,
  pure: 100,
};

export const HOUSE_UPGRADES = {
  apartment: { next: 'house' as const, cost: 200, space: 20 },
  house: { next: 'farm' as const, cost: 1000, space: 100 },
  farm: { next: null, baseCost: 500, spacePerAcre: 10 },
};
