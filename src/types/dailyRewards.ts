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

export function getRewardForDay(streakDay: number): DailyReward {
  // Rewards cycle every 7 days
  const dayIndex = ((streakDay - 1) % 7);
  return DAILY_REWARDS[dayIndex];
}
