/**
 * @fileoverview Progressive tab unlocking configuration
 *
 * Defines unlock requirements for each game tab. Tabs start locked
 * and unlock as players reach milestones, creating meta-progression.
 *
 * @module config/tabUnlocks
 */

export interface TabUnlockRequirement {
  /** Minimum cats owned to unlock */
  minCats?: number;
  /** Minimum in-game day */
  minDay?: number;
  /** Minimum money earned */
  minMoney?: number;
  /** Minimum show wins */
  minShowWins?: number;
  /** Minimum kittens bred */
  minKittensBred?: number;
  /** Must be authenticated */
  requiresAuth?: boolean;
  /** Friendly description of unlock condition */
  unlockHint: string;
}

/**
 * Tab unlock requirements.
 * Tabs NOT listed here are always unlocked.
 */
export const TAB_UNLOCK_REQUIREMENTS: Record<string, TabUnlockRequirement> = {
  // Farm category - mostly unlocked from the start
  bulk: {
    minCats: 5,
    unlockHint: 'Own 5+ cats',
  },

  // Cats category
  breeding: {
    minCats: 2,
    unlockHint: 'Own 2+ cats',
  },
  training: {
    minCats: 1,
    minDay: 3,
    unlockHint: 'Reach Day 3',
  },
  costumes: {
    minMoney: 200,
    unlockHint: 'Earn $200+',
  },
  specializations: {
    minCats: 3,
    minDay: 15,
    unlockHint: 'Reach Day 15 with 3+ cats',
  },

  // Social category
  social: {
    minCats: 2,
    unlockHint: 'Own 2+ cats',
  },
  friends: {
    requiresAuth: true,
    minDay: 5,
    unlockHint: 'Sign in & reach Day 5',
  },
  gifts: {
    requiresAuth: true,
    minDay: 7,
    unlockHint: 'Sign in & reach Day 7',
  },
  trading: {
    requiresAuth: true,
    minDay: 10,
    unlockHint: 'Sign in & reach Day 10',
  },
  coop: {
    requiresAuth: true,
    minDay: 14,
    unlockHint: 'Sign in & reach Day 14',
  },

  // Progress category
  leaderboard: {
    minShowWins: 1,
    unlockHint: 'Win 1 cat show',
  },
  challenges: {
    minDay: 7,
    unlockHint: 'Reach Day 7',
  },
  objectives: {
    minDay: 3,
    unlockHint: 'Reach Day 3',
  },
  battlepass: {
    minDay: 10,
    unlockHint: 'Reach Day 10',
  },
  collection: {
    minCats: 3,
    unlockHint: 'Own 3+ cats',
  },
  legacy: {
    minShowWins: 5,
    minDay: 20,
    unlockHint: 'Win 5 shows & reach Day 20',
  },
  wheel: {
    minDay: 5,
    unlockHint: 'Reach Day 5',
  },
};

export interface PlayerProgressForUnlocks {
  catsOwned: number;
  day: number;
  totalMoneyEarned: number;
  totalShowWins: number;
  kittensBred: number;
  isAuthenticated: boolean;
}

/**
 * Check if a tab is unlocked given player progress
 */
export function isTabUnlocked(tabId: string, progress: PlayerProgressForUnlocks): boolean {
  const req = TAB_UNLOCK_REQUIREMENTS[tabId];
  if (!req) return true; // No requirements = always unlocked

  if (req.minCats && progress.catsOwned < req.minCats) return false;
  if (req.minDay && progress.day < req.minDay) return false;
  if (req.minMoney && progress.totalMoneyEarned < req.minMoney) return false;
  if (req.minShowWins && progress.totalShowWins < req.minShowWins) return false;
  if (req.minKittensBred && progress.kittensBred < req.minKittensBred) return false;
  if (req.requiresAuth && !progress.isAuthenticated) return false;

  return true;
}

/**
 * Get the unlock hint for a locked tab
 */
export function getTabUnlockHint(tabId: string): string | null {
  return TAB_UNLOCK_REQUIREMENTS[tabId]?.unlockHint ?? null;
}

/**
 * Get all unlocked tab IDs for current player progress
 */
export function getUnlockedTabs(progress: PlayerProgressForUnlocks): Set<string> {
  const unlocked = new Set<string>();
  // Always include tabs without requirements
  const allTabs = [
    'actions', 'chores', 'supplies', 'market', 'bulk',
    'breeding', 'training', 'costumes', 'specializations',
    'social', 'friends', 'gifts', 'trading', 'coop',
    'leaderboard', 'challenges', 'objectives', 'battlepass',
    'collection', 'legacy', 'wheel',
    'profile', 'more', 'prestige', 'clubs', 'ai',
  ];
  for (const tab of allTabs) {
    if (isTabUnlocked(tab, progress)) {
      unlocked.add(tab);
    }
  }
  return unlocked;
}
