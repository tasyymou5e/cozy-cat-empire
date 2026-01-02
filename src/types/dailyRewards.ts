import { Resources } from './game';

export interface DailyReward {
  day: number;
  coins: number;
  resources?: Partial<Resources>;
  isMilestone: boolean;
  emoji: string;
  label: string;
}

export interface LoginData {
  id: string;
  user_id: string;
  last_login_date: string;
  current_streak: number;
  longest_streak: number;
  total_logins: number;
  last_claimed_date: string | null;
}

export interface VIPTier {
  minStreak: number;
  name: string;
  emoji: string;
  coinMultiplier: number;
  resourceMultiplier: number;
  exclusiveRewards: string[];
  perks: string[];
}

// Rewards escalate over the 7-day cycle, then repeat
export const DAILY_REWARDS: DailyReward[] = [
  { day: 1, coins: 25, resources: { food: 5 }, isMilestone: false, emoji: '🌟', label: 'Day 1' },
  { day: 2, coins: 35, resources: { treats: 3 }, isMilestone: false, emoji: '🌟', label: 'Day 2' },
  { day: 3, coins: 50, resources: { toys: 2 }, isMilestone: false, emoji: '🌟', label: 'Day 3' },
  { day: 4, coins: 75, resources: { food: 10 }, isMilestone: false, emoji: '🌟', label: 'Day 4' },
  { day: 5, coins: 100, resources: { medicine: 2 }, isMilestone: false, emoji: '🌟', label: 'Day 5' },
  { day: 6, coins: 125, resources: { treats: 5, toys: 3 }, isMilestone: false, emoji: '🌟', label: 'Day 6' },
  { day: 7, coins: 200, resources: { food: 20, medicine: 3, toys: 5, treats: 10 }, isMilestone: true, emoji: '🎁', label: 'Week Bonus!' },
];

// Milestone bonuses at specific streak lengths
export const STREAK_MILESTONES: Record<number, { bonusCoins: number; label: string; emoji: string }> = {
  7: { bonusCoins: 100, label: '1 Week Streak!', emoji: '🔥' },
  14: { bonusCoins: 300, label: '2 Week Streak!', emoji: '🔥🔥' },
  30: { bonusCoins: 1000, label: 'Month Streak!', emoji: '👑' },
};

// VIP tiers for 30+ day streaks
export const VIP_TIERS: VIPTier[] = [
  {
    minStreak: 30,
    name: 'VIP Bronze',
    emoji: '🥉',
    coinMultiplier: 1.5,
    resourceMultiplier: 1.25,
    exclusiveRewards: ['vip_bronze_collar'],
    perks: ['50% bonus coins', '25% bonus resources', 'Bronze VIP Badge'],
  },
  {
    minStreak: 60,
    name: 'VIP Silver',
    emoji: '🥈',
    coinMultiplier: 2.0,
    resourceMultiplier: 1.5,
    exclusiveRewards: ['vip_silver_cape'],
    perks: ['100% bonus coins', '50% bonus resources', 'Silver VIP Badge', 'Exclusive Silver Cape'],
  },
  {
    minStreak: 90,
    name: 'VIP Gold',
    emoji: '🥇',
    coinMultiplier: 2.5,
    resourceMultiplier: 2.0,
    exclusiveRewards: ['vip_gold_crown'],
    perks: ['150% bonus coins', '100% bonus resources', 'Gold VIP Badge', 'Legendary Gold Crown'],
  },
];

export function getRewardForDay(streakDay: number): DailyReward {
  // Handle edge case where streak is 0 or negative
  if (streakDay <= 0) {
    return DAILY_REWARDS[0]; // Return Day 1 reward as fallback
  }
  // Rewards cycle every 7 days
  const dayIndex = ((streakDay - 1) % 7);
  return DAILY_REWARDS[dayIndex];
}

export function getVIPTier(streak: number): VIPTier | null {
  const qualifiedTiers = VIP_TIERS.filter(t => streak >= t.minStreak);
  return qualifiedTiers.length > 0 ? qualifiedTiers[qualifiedTiers.length - 1] : null;
}

export function getNextVIPTier(streak: number): VIPTier | null {
  return VIP_TIERS.find(t => t.minStreak > streak) || null;
}
