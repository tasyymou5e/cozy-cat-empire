export type CelebrationType = 'confetti' | 'fireworks' | 'rainbow' | 'goldRain';
export type MilestoneCategory = 'cats' | 'money' | 'shows' | 'days' | 'breeding' | 'collection';

export interface MilestoneReward {
  coins?: number;
  costume?: string;
  title?: string;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: MilestoneCategory;
  threshold: number;
  reward: MilestoneReward;
  celebrationType: CelebrationType;
}

export const MILESTONES: Milestone[] = [
  // Money milestones
  {
    id: 'first_thousand',
    name: 'Rising Star',
    description: 'Earn your first $1,000',
    emoji: '⭐',
    category: 'money',
    threshold: 1000,
    reward: { coins: 100, title: 'Rising Star' },
    celebrationType: 'confetti',
  },
  {
    id: 'five_thousand',
    name: 'Money Maker',
    description: 'Earn $5,000 total',
    emoji: '💰',
    category: 'money',
    threshold: 5000,
    reward: { coins: 250, title: 'Money Maker' },
    celebrationType: 'goldRain',
  },
  {
    id: 'ten_thousand',
    name: 'Wealthy Mogul',
    description: 'Earn $10,000 total',
    emoji: '💎',
    category: 'money',
    threshold: 10000,
    reward: { coins: 500, title: 'Wealthy Mogul' },
    celebrationType: 'fireworks',
  },

  // Show milestones
  {
    id: 'first_win',
    name: 'Show Debut',
    description: 'Win your first cat show',
    emoji: '🏆',
    category: 'shows',
    threshold: 1,
    reward: { coins: 50 },
    celebrationType: 'confetti',
  },
  {
    id: 'ten_wins',
    name: 'Show Champion',
    description: 'Win 10 cat shows',
    emoji: '🥇',
    category: 'shows',
    threshold: 10,
    reward: { coins: 200, title: 'Show Champion' },
    celebrationType: 'fireworks',
  },
  {
    id: 'fifty_wins',
    name: 'Legendary Showman',
    description: 'Win 50 cat shows',
    emoji: '👑',
    category: 'shows',
    threshold: 50,
    reward: { coins: 1000, title: 'Legendary Showman' },
    celebrationType: 'rainbow',
  },

  // Cat collection milestones
  {
    id: 'five_cats',
    name: 'Cat Lover',
    description: 'Own 5 cats at once',
    emoji: '🐱',
    category: 'cats',
    threshold: 5,
    reward: { coins: 75 },
    celebrationType: 'confetti',
  },
  {
    id: 'twenty_cats',
    name: 'Cat Collector',
    description: 'Own 20 cats at once',
    emoji: '😻',
    category: 'cats',
    threshold: 20,
    reward: { coins: 300, title: 'Cat Collector' },
    celebrationType: 'fireworks',
  },
  {
    id: 'fifty_cats',
    name: 'Cat Empire',
    description: 'Own 50 cats at once',
    emoji: '🏰',
    category: 'cats',
    threshold: 50,
    reward: { coins: 750, title: 'Cat Emperor' },
    celebrationType: 'rainbow',
  },

  // Days played milestones
  {
    id: 'week_one',
    name: 'Week One',
    description: 'Play for 7 days',
    emoji: '📅',
    category: 'days',
    threshold: 7,
    reward: { coins: 100 },
    celebrationType: 'confetti',
  },
  {
    id: 'month_one',
    name: 'Dedicated Farmer',
    description: 'Play for 30 days',
    emoji: '🌟',
    category: 'days',
    threshold: 30,
    reward: { coins: 300, title: 'Dedicated Farmer' },
    celebrationType: 'fireworks',
  },
  {
    id: 'day_hundred',
    name: 'Centurion',
    description: 'Play for 100 days',
    emoji: '💯',
    category: 'days',
    threshold: 100,
    reward: { coins: 500, title: 'Centurion' },
    celebrationType: 'rainbow',
  },

  // Breeding milestones
  {
    id: 'first_kitten',
    name: 'First Litter',
    description: 'Breed your first kitten',
    emoji: '🍼',
    category: 'breeding',
    threshold: 1,
    reward: { coins: 50 },
    celebrationType: 'confetti',
  },
  {
    id: 'ten_kittens',
    name: 'Breeder',
    description: 'Breed 10 kittens',
    emoji: '👶',
    category: 'breeding',
    threshold: 10,
    reward: { coins: 200, title: 'Breeder' },
    celebrationType: 'fireworks',
  },
  {
    id: 'fifty_kittens',
    name: 'Dynasty Builder',
    description: 'Breed 50 kittens',
    emoji: '👪',
    category: 'breeding',
    threshold: 50,
    reward: { coins: 1000, title: 'Dynasty Builder' },
    celebrationType: 'goldRain',
  },
];

export function getMilestoneProgress(
  milestone: Milestone,
  stats: {
    totalMoneyEarned: number;
    totalShowWins: number;
    catsOwned: number;
    day: number;
    kittensBred: number;
  }
): number {
  switch (milestone.category) {
    case 'money':
      return stats.totalMoneyEarned;
    case 'shows':
      return stats.totalShowWins;
    case 'cats':
      return stats.catsOwned;
    case 'days':
      return stats.day;
    case 'breeding':
      return stats.kittensBred;
    default:
      return 0;
  }
}
