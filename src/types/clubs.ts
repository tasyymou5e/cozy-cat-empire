/**
 * @fileoverview Guild/Club System Types
 * Social clubs with shared goals and cooperative challenges
 * @module types/clubs
 */

/** Club member roles */
export type ClubRole = 'owner' | 'officer' | 'member';

/**
 * A player club/guild
 */
export interface Club {
  /** Unique club identifier */
  id: string;
  /** Club display name (unique) */
  name: string;
  /** Club emoji icon */
  emoji: string;
  /** Optional description */
  description?: string;
  /** Owner's user ID */
  ownerId: string;
  /** Maximum allowed members */
  maxMembers: number;
  /** Current member count (computed) */
  memberCount?: number;
  /** Club creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Total club experience/level */
  totalXp?: number;
  /** Club level (computed from XP) */
  level?: number;
}

/**
 * A club membership record
 */
export interface ClubMember {
  /** Record ID */
  id: string;
  /** Club ID */
  clubId: string;
  /** User ID */
  userId: string;
  /** Member's role in the club */
  role: ClubRole;
  /** Join timestamp */
  joinedAt: string;
  /** Member's display name (joined from profiles) */
  displayName?: string;
  /** Member's avatar emoji (joined from profiles) */
  avatarEmoji?: string;
  /** Member's contribution to club challenges */
  weeklyContribution?: number;
}

/**
 * A club invitation
 */
export interface ClubInvite {
  /** Invite record ID */
  id: string;
  /** Club ID */
  clubId: string;
  /** Club name (for display) */
  clubName?: string;
  /** Club emoji (for display) */
  clubEmoji?: string;
  /** Inviting user ID */
  inviterId: string;
  /** Inviter name (for display) */
  inviterName?: string;
  /** Invited user ID */
  inviteeId: string;
  /** Invite status */
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  /** Creation timestamp */
  createdAt: string;
  /** Expiration timestamp */
  expiresAt: string;
}

/**
 * A cooperative club challenge
 */
export interface ClubChallenge {
  /** Challenge ID */
  id: string;
  /** Club ID */
  clubId: string;
  /** Challenge type identifier */
  challengeType: ClubChallengeType;
  /** Challenge name */
  name: string;
  /** Challenge description */
  description: string;
  /** Emoji icon */
  emoji: string;
  /** Target value to complete */
  targetValue: number;
  /** Current combined progress */
  currentProgress: number;
  /** Reward coins per member on completion */
  rewardCoins: number;
  /** Optional badge reward ID */
  rewardBadge?: string;
  /** Start timestamp */
  startsAt: string;
  /** End timestamp */
  endsAt: string;
  /** Whether challenge is completed */
  completed: boolean;
  /** Completion timestamp */
  completedAt?: string;
}

/**
 * Types of club challenges
 */
export type ClubChallengeType =
  | 'combined_show_wins'
  | 'combined_breeding'
  | 'combined_training'
  | 'combined_coins_earned'
  | 'combined_cats_owned';

/**
 * Club challenge template for generation
 */
export interface ClubChallengeTemplate {
  type: ClubChallengeType;
  name: string;
  description: string;
  emoji: string;
  baseTarget: number;
  baseReward: number;
  targetPerMember: number;
  rewardPerMember: number;
}

/**
 * Available club challenge templates
 */
export const CLUB_CHALLENGE_TEMPLATES: ClubChallengeTemplate[] = [
  {
    type: 'combined_show_wins',
    name: 'Show Team',
    description: 'Win cat shows together as a club!',
    emoji: '🏆',
    baseTarget: 10,
    baseReward: 500,
    targetPerMember: 5,
    rewardPerMember: 50,
  },
  {
    type: 'combined_breeding',
    name: 'Breeding Bonanza',
    description: 'Breed kittens as a team!',
    emoji: '💕',
    baseTarget: 5,
    baseReward: 400,
    targetPerMember: 2,
    rewardPerMember: 40,
  },
  {
    type: 'combined_training',
    name: 'Training Camp',
    description: 'Train tricks across all club cats!',
    emoji: '💪',
    baseTarget: 20,
    baseReward: 300,
    targetPerMember: 5,
    rewardPerMember: 30,
  },
  {
    type: 'combined_coins_earned',
    name: 'Coin Rush',
    description: 'Earn coins together as a club!',
    emoji: '💰',
    baseTarget: 5000,
    baseReward: 750,
    targetPerMember: 500,
    rewardPerMember: 75,
  },
];

/**
 * Club level thresholds and perks
 */
export const CLUB_LEVELS = [
  { level: 1, xpRequired: 0, maxMembers: 5, name: 'New Club' },
  { level: 2, xpRequired: 1000, maxMembers: 10, name: 'Growing Club' },
  { level: 3, xpRequired: 3000, maxMembers: 15, name: 'Established Club' },
  { level: 4, xpRequired: 6000, maxMembers: 20, name: 'Popular Club' },
  { level: 5, xpRequired: 10000, maxMembers: 25, name: 'Elite Club' },
];

/**
 * Calculate club level from XP
 */
export function getClubLevel(xp: number): { level: number; name: string; maxMembers: number } {
  const levelInfo = [...CLUB_LEVELS].reverse().find((l) => xp >= l.xpRequired);
  return levelInfo || CLUB_LEVELS[0];
}

/**
 * Get XP needed for next level
 */
export function getXpToNextLevel(currentXp: number): number {
  const currentLevel = getClubLevel(currentXp);
  const nextLevel = CLUB_LEVELS.find((l) => l.level === currentLevel.level + 1);
  if (!nextLevel) return 0;
  return nextLevel.xpRequired - currentXp;
}
