/**
 * Cooperative Friend Challenges Types
 *
 * System for two friends to work together toward shared weekly goals
 * with bonus rewards for completing challenges cooperatively.
 */

export type CoopChallengeType =
  | 'combined_show_wins'
  | 'combined_breeding'
  | 'combined_training'
  | 'combined_socializing'
  | 'combined_earning';

export type CoopChallengeStatus = 'pending' | 'active' | 'completed' | 'expired' | 'declined';

export interface CoopChallenge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  challengeType: CoopChallengeType;
  targetValue: number;
  rewardCoins: number;
  bonusMultiplier: number; // Extra reward for coop (e.g., 1.5x)
  durationDays: number;
  createdAt: string;
}

export interface ActiveCoopChallenge {
  id: string;
  challenge: CoopChallenge;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string;
  initiatorId: string;
  myProgress: number;
  partnerProgress: number;
  status: CoopChallengeStatus;
  startedAt: string;
  expiresAt: string;
  rewardClaimed: boolean;
}

export interface CoopChallengeInvite {
  id: string;
  challenge: CoopChallenge;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  sentAt: string;
  expiresAt: string;
}

// Predefined cooperative challenge templates
export const COOP_CHALLENGE_TEMPLATES: CoopChallenge[] = [
  {
    id: 'coop_show_duo',
    name: 'Dynamic Duo',
    description: 'Win cat shows together with your friend',
    emoji: '🏆',
    challengeType: 'combined_show_wins',
    targetValue: 10,
    rewardCoins: 1500,
    bonusMultiplier: 1.5,
    durationDays: 7,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'coop_breed_together',
    name: 'Kitten Collaboration',
    description: 'Breed kittens together to grow both farms',
    emoji: '🐱',
    challengeType: 'combined_breeding',
    targetValue: 6,
    rewardCoins: 1200,
    bonusMultiplier: 1.5,
    durationDays: 7,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'coop_train_team',
    name: 'Training Partners',
    description: 'Train tricks together across both farms',
    emoji: '💪',
    challengeType: 'combined_training',
    targetValue: 15,
    rewardCoins: 1000,
    bonusMultiplier: 1.5,
    durationDays: 7,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'coop_social_network',
    name: 'Social Network',
    description: 'Socialize cats together for friendship points',
    emoji: '🤝',
    challengeType: 'combined_socializing',
    targetValue: 20,
    rewardCoins: 1100,
    bonusMultiplier: 1.5,
    durationDays: 7,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'coop_money_makers',
    name: 'Money Makers',
    description: 'Earn coins together through chores and shows',
    emoji: '💰',
    challengeType: 'combined_earning',
    targetValue: 5000,
    rewardCoins: 2000,
    bonusMultiplier: 1.5,
    durationDays: 7,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'coop_show_masters',
    name: 'Show Masters',
    description: 'Dominate the cat show circuit together',
    emoji: '👑',
    challengeType: 'combined_show_wins',
    targetValue: 20,
    rewardCoins: 3000,
    bonusMultiplier: 2.0,
    durationDays: 7,
    createdAt: new Date().toISOString(),
  },
];

/**
 * Maps game actions to coop challenge types
 */
export function getCoopChallengeTypeFromAction(action: string): CoopChallengeType | null {
  switch (action) {
    case 'show_win':
      return 'combined_show_wins';
    case 'breed':
      return 'combined_breeding';
    case 'train':
      return 'combined_training';
    case 'socialize':
      return 'combined_socializing';
    case 'earn':
      return 'combined_earning';
    default:
      return null;
  }
}

/**
 * Calculate total progress (my + partner's)
 */
export function getCombinedProgress(challenge: ActiveCoopChallenge): number {
  return challenge.myProgress + challenge.partnerProgress;
}

/**
 * Check if a coop challenge is completed
 */
export function isCoopChallengeCompleted(challenge: ActiveCoopChallenge): boolean {
  return getCombinedProgress(challenge) >= challenge.challenge.targetValue;
}

/**
 * Get the contribution percentage for a player
 */
export function getContributionPercent(progress: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((progress / total) * 100);
}
