// ============================================================================
// Costume Types
// ============================================================================

/** Costume rarity levels */
export type CostumeRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

/** Costume category for organization */
export type CostumeCategory = 'hat' | 'outfit' | 'accessory' | 'special';

/**
 * A purchasable costume for cats.
 * Provides show bonuses and happiness bonuses.
 */
export interface Costume {
  /** Unique costume ID */
  id: string;
  /** Display name */
  name: string;
  /** Emoji representation */
  emoji: string;
  /** Description text */
  description: string;
  /** Price in coins (0 for VIP exclusive) */
  price: number;
  /** Rarity tier */
  rarity: CostumeRarity;
  /** Percentage bonus in cat shows */
  showBonus: number;
  /** Daily happiness bonus when worn */
  happinessBonus: number;
  /** Category for shop organization */
  category: CostumeCategory;
  /** Whether costume is VIP exclusive */
  vipExclusive?: boolean;
  /** Minimum login streak required */
  minStreak?: number;
}

export const COSTUMES: Costume[] = [
  // Hats
  {
    id: 'party_hat',
    name: 'Party Hat',
    emoji: '🎉',
    description: 'A festive party hat for celebrations!',
    price: 50,
    rarity: 'common',
    showBonus: 5,
    happinessBonus: 2,
    category: 'hat',
  },
  {
    id: 'top_hat',
    name: 'Fancy Top Hat',
    emoji: '🎩',
    description: "A distinguished gentleman's hat.",
    price: 100,
    rarity: 'uncommon',
    showBonus: 10,
    happinessBonus: 3,
    category: 'hat',
  },
  {
    id: 'crown',
    name: 'Royal Crown',
    emoji: '👑',
    description: 'For the king or queen of cats!',
    price: 300,
    rarity: 'rare',
    showBonus: 20,
    happinessBonus: 5,
    category: 'hat',
  },
  {
    id: 'wizard_hat',
    name: 'Wizard Hat',
    emoji: '🧙',
    description: 'A mystical wizard hat with magical properties.',
    price: 250,
    rarity: 'rare',
    showBonus: 15,
    happinessBonus: 4,
    category: 'hat',
  },

  // Outfits
  {
    id: 'sweater',
    name: 'Cozy Sweater',
    emoji: '🧥',
    description: 'A warm and comfy sweater.',
    price: 75,
    rarity: 'common',
    showBonus: 5,
    happinessBonus: 5,
    category: 'outfit',
  },
  {
    id: 'tuxedo',
    name: 'Elegant Tuxedo',
    emoji: '🤵',
    description: 'Perfect for formal cat shows.',
    price: 200,
    rarity: 'uncommon',
    showBonus: 15,
    happinessBonus: 3,
    category: 'outfit',
  },
  {
    id: 'superhero',
    name: 'Superhero Cape',
    emoji: '🦸',
    description: 'Every cat needs a cape!',
    price: 150,
    rarity: 'uncommon',
    showBonus: 10,
    happinessBonus: 8,
    category: 'outfit',
  },
  {
    id: 'pirate',
    name: 'Pirate Costume',
    emoji: '🏴‍☠️',
    description: 'Arrr, a fierce pirate outfit!',
    price: 175,
    rarity: 'uncommon',
    showBonus: 12,
    happinessBonus: 6,
    category: 'outfit',
  },

  // Accessories
  {
    id: 'bow_tie',
    name: 'Bow Tie',
    emoji: '🎀',
    description: 'A cute little bow tie.',
    price: 30,
    rarity: 'common',
    showBonus: 3,
    happinessBonus: 2,
    category: 'accessory',
  },
  {
    id: 'sunglasses',
    name: 'Cool Sunglasses',
    emoji: '😎',
    description: 'Too cool for school.',
    price: 60,
    rarity: 'common',
    showBonus: 5,
    happinessBonus: 4,
    category: 'accessory',
  },
  {
    id: 'necklace',
    name: 'Pearl Necklace',
    emoji: '📿',
    description: 'An elegant pearl necklace.',
    price: 120,
    rarity: 'uncommon',
    showBonus: 10,
    happinessBonus: 3,
    category: 'accessory',
  },
  {
    id: 'scarf',
    name: 'Silk Scarf',
    emoji: '🧣',
    description: 'A luxurious silk scarf.',
    price: 80,
    rarity: 'common',
    showBonus: 5,
    happinessBonus: 4,
    category: 'accessory',
  },

  // Special
  {
    id: 'angel_wings',
    name: 'Angel Wings',
    emoji: '😇',
    description: 'Heavenly wings for the purest cats.',
    price: 500,
    rarity: 'legendary',
    showBonus: 25,
    happinessBonus: 10,
    category: 'special',
  },
  {
    id: 'dragon',
    name: 'Dragon Costume',
    emoji: '🐉',
    description: 'Transform into a fierce dragon!',
    price: 400,
    rarity: 'legendary',
    showBonus: 22,
    happinessBonus: 8,
    category: 'special',
  },
  {
    id: 'astronaut',
    name: 'Space Suit',
    emoji: '🚀',
    description: 'Ready for a trip to the moon!',
    price: 350,
    rarity: 'rare',
    showBonus: 18,
    happinessBonus: 7,
    category: 'special',
  },
  {
    id: 'unicorn',
    name: 'Unicorn Horn',
    emoji: '🦄',
    description: 'Magical unicorn transformation!',
    price: 450,
    rarity: 'legendary',
    showBonus: 23,
    happinessBonus: 9,
    category: 'special',
  },

  // VIP Exclusive Costumes
  {
    id: 'vip_bronze_collar',
    name: 'VIP Bronze Collar',
    emoji: '🏅',
    description: 'A distinguished bronze collar for VIP members.',
    price: 0,
    rarity: 'legendary',
    showBonus: 15,
    happinessBonus: 5,
    category: 'accessory',
    vipExclusive: true,
    minStreak: 30,
  },
  {
    id: 'vip_silver_cape',
    name: 'VIP Silver Cape',
    emoji: '🌟',
    description: 'An elegant silver cape for elite VIP members.',
    price: 0,
    rarity: 'legendary',
    showBonus: 25,
    happinessBonus: 8,
    category: 'outfit',
    vipExclusive: true,
    minStreak: 60,
  },
  {
    id: 'vip_gold_crown',
    name: 'VIP Gold Crown',
    emoji: '👑',
    description: 'The ultimate crown for legendary VIP players!',
    price: 0,
    rarity: 'legendary',
    showBonus: 35,
    happinessBonus: 12,
    category: 'hat',
    vipExclusive: true,
    minStreak: 90,
  },
];

export const COSTUME_RARITY_COLORS: Record<Costume['rarity'], string> = {
  common: 'bg-secondary text-secondary-foreground',
  uncommon: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  rare: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  legendary:
    'bg-gradient-to-r from-yellow-200 to-orange-200 text-orange-700 dark:from-yellow-900/50 dark:to-orange-900/50 dark:text-orange-300',
};

/**
 * Lookup a costume by ID from the standard COSTUMES array only.
 * For a unified lookup that includes seasonal costumes, use
 * `getCostumeById` from `@/lib/costumeRegistry`.
 *
 * @deprecated Use `getCostumeById` from `@/lib/costumeRegistry` instead
 */
export function getCostumeById(id: string): Costume | undefined {
  return COSTUMES.find((c) => c.id === id);
}
