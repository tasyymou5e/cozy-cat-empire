import { useMemo } from 'react';
import { GameState } from '@/types/game';
import { CatRelationship } from '@/types/relationships';
import { DailyObjective } from '@/types/dailyObjectives';
import { ChallengeWithProgress } from '@/types/challenges';

interface UseBadgeCountsParams {
  state: GameState;
  objectives: DailyObjective[] | null;
  allObjectivesCompleted: boolean;
  canSpin: boolean;
  spinsRemaining: number;
  retiredCatsCount: number;
  specializationsCount: number;
  getUnclaimedRewards: () => unknown[];
  getCoopActiveCount: () => number;
  getCoopPendingCount: () => number;
  relationshipNeedsAttention: number;
  relationships: CatRelationship[];
  receivedGifts: { status: string }[] | null;
  incomingTrades: { status: string }[] | null;
  pendingRequests: unknown[] | null;
  challenges: ChallengeWithProgress[] | null;
}

interface TabBadges {
  [key: string]: number;
}

type CategoryBadges = Record<string, number>;

/**
 * Hook to calculate badge counts for tabs and categories
 * Extracts badge calculation logic from CatFarm for better maintainability
 */
export function useBadgeCounts({
  state,
  objectives,
  allObjectivesCompleted,
  canSpin,
  spinsRemaining,
  retiredCatsCount,
  specializationsCount,
  getUnclaimedRewards,
  getCoopActiveCount,
  getCoopPendingCount,
  relationshipNeedsAttention,
  relationships,
  receivedGifts,
  incomingTrades,
  pendingRequests,
  challenges,
}: UseBadgeCountsParams) {
  // Calculate badge counts for tabs
  const tabBadges = useMemo<TabBadges>(() => {
    const badges: TabBadges = {};
    
    // Objectives - incomplete count
    if (objectives && !allObjectivesCompleted) {
      badges['objectives'] = objectives.filter(o => !o.completed).length;
    }
    
    // Lucky Wheel - spins available
    if (canSpin && spinsRemaining > 0) {
      badges['wheel'] = spinsRemaining;
    }
    
    // Hall of Fame / Legacy
    if (retiredCatsCount > 0) {
      badges['legacy'] = retiredCatsCount;
    }
    
    // Specializations
    if (specializationsCount > 0) {
      badges['specializations'] = specializationsCount;
    }
    
    // Battle Pass unclaimed rewards
    const unclaimedBP = getUnclaimedRewards().length;
    if (unclaimedBP > 0) {
      badges['battlepass'] = unclaimedBP;
    }
    
    // Coop challenges
    const coopCount = getCoopActiveCount() + getCoopPendingCount();
    if (coopCount > 0) {
      badges['coop'] = coopCount;
    }
    
    // Social - relationships needing attention
    if (relationshipNeedsAttention > 0) {
      badges['social'] = relationshipNeedsAttention;
    }

    // Bulk Actions - cats/relationships needing attention
    const sickCats = state.cats.filter(c => c.health < 70).length;
    const tiredCats = state.cats.filter(c => c.restLevel < 50).length;
    const unhappyCats = state.cats.filter(c => c.happiness < 50).length;
    const neglectedBonds = relationships.filter(rel => {
      const daysSince = state.day - rel.lastInteraction;
      const cat1Exists = state.cats.some(c => c.id === rel.catId1);
      const cat2Exists = state.cats.some(c => c.id === rel.catId2);
      return daysSince >= 2 && cat1Exists && cat2Exists;
    }).length;
    const bulkActionsNeeded = sickCats + tiredCats + unhappyCats + neglectedBonds;
    if (bulkActionsNeeded > 0) {
      badges['bulk'] = bulkActionsNeeded;
    }

    // Gifts - pending gifts count (received gifts with pending status)
    const pendingGiftsCount = receivedGifts?.filter(g => g.status === 'pending').length || 0;
    if (pendingGiftsCount > 0) {
      badges['gifts'] = pendingGiftsCount;
    }

    // Trading - pending trades count (incoming trades with pending status)
    const pendingTradesCount = incomingTrades?.filter(t => t.status === 'pending').length || 0;
    if (pendingTradesCount > 0) {
      badges['trading'] = pendingTradesCount;
    }

    // Friends - friend requests count
    if (pendingRequests && pendingRequests.length > 0) {
      badges['friends'] = pendingRequests.length;
    }

    // Challenges - claimable rewards (completed but not claimed)
    const claimableChallenges = challenges?.filter(c => c.progress?.completed && !c.progress?.reward_claimed).length || 0;
    if (claimableChallenges > 0) {
      badges['challenges'] = claimableChallenges;
    }

    // Breeding - cooldown ready indicator
    if (state.breedingCooldown === 0 && state.cats.length >= 2) {
      badges['breeding'] = 1;
    }

    return badges;
  }, [
    objectives,
    allObjectivesCompleted,
    canSpin,
    spinsRemaining,
    retiredCatsCount,
    specializationsCount,
    getUnclaimedRewards,
    getCoopActiveCount,
    getCoopPendingCount,
    relationshipNeedsAttention,
    state.cats,
    state.day,
    state.breedingCooldown,
    relationships,
    receivedGifts,
    incomingTrades,
    pendingRequests,
    challenges,
  ]);

  // Calculate category-level badges
  const categoryBadges = useMemo<CategoryBadges>(() => {
    const farmBadges = (tabBadges['actions'] || 0) + (tabBadges['chores'] || 0) + (tabBadges['supplies'] || 0) + (tabBadges['market'] || 0) + (tabBadges['bulk'] || 0);
    const catsBadges = (tabBadges['breeding'] || 0) + (tabBadges['training'] || 0) + (tabBadges['costumes'] || 0) + (tabBadges['specializations'] || 0);
    const socialBadges = (tabBadges['social'] || 0) + (tabBadges['friends'] || 0) + (tabBadges['gifts'] || 0) + (tabBadges['trading'] || 0) + (tabBadges['coop'] || 0);
    const progressBadges = (tabBadges['leaderboard'] || 0) + (tabBadges['challenges'] || 0) + (tabBadges['objectives'] || 0) + (tabBadges['battlepass'] || 0) + (tabBadges['collection'] || 0) + (tabBadges['legacy'] || 0) + (tabBadges['wheel'] || 0);
    
    return {
      farm: farmBadges,
      cats: catsBadges,
      social: socialBadges,
      progress: progressBadges,
      settings: 0,
    };
  }, [tabBadges]);

  return { tabBadges, categoryBadges };
}
