/**
 * @fileoverview Consolidated state management hook for CatFarm component
 * 
 * Combines all game-related hooks into a single state object to reduce
 * CatFarm.tsx complexity and improve maintainability.
 * 
 * @module hooks/useCatFarmState
 */

import { useEffect, useRef } from 'react';
import { useGameState } from '@/hooks/game';
import { useCloudSave } from '@/hooks/useCloudSave';
import { useGlobalLeaderboard } from '@/hooks/useGlobalLeaderboard';
import { useWeeklyChallenges } from '@/hooks/useWeeklyChallenges';
import { usePlayerProfile } from '@/hooks/usePlayerProfile';
import { useDailyLoginRewards } from '@/hooks/useDailyLoginRewards';
import { useMilestones } from '@/hooks/useMilestones';
import { useDailyObjectives } from '@/hooks/useDailyObjectives';
import { useCollectionProgress } from '@/hooks/useCollectionProgress';
import { useLuckyWheel } from '@/hooks/useLuckyWheel';
import { useLegacy } from '@/hooks/useLegacy';
import { useSpecializations } from '@/hooks/useSpecializations';
import { useBattlePass } from '@/hooks/useBattlePass';
import { useBadgeCounts } from '@/hooks/useBadgeCounts';
import { useCatGifts } from '@/hooks/useCatGifts';
import { useTrading } from '@/hooks/useTrading';
import { useFriends } from '@/hooks/useFriends';
import { useCoopChallenges } from '@/hooks/useCoopChallenges';
import { usePlayerActivityLog } from '@/hooks/usePlayerActivityLog';
import { usePortraitOutdatedToast } from '@/hooks/usePortraitOutdatedToast';
import { useRelationshipReminders } from '@/hooks/useRelationshipReminders';
import { useGameMessages } from '@/hooks/useGameMessages';
import { useCatFarmUIState } from './useCatFarmUIState';
import { useCatFarmSystems } from './useCatFarmSystems';

// Re-export TAB_LABELS for backward compatibility
export { TAB_LABELS } from '@/constants/tabs';

/**
 * Consolidated state hook for CatFarm component
 * 
 * @returns All state values, actions, and hook results needed by CatFarm
 * 
 * @example
 * ```tsx
 * const farmState = useCatFarmState();
 * const { gameState, actions, ui, systems } = farmState;
 * ```
 */
export function useCatFarmState() {
  // Core systems (extracted)
  const systems = useCatFarmSystems();
  const { sound, confetti, haptics, auth } = systems;
  const { playSound } = sound;
  
  // UI state (extracted)
  const ui = useCatFarmUIState();
  
  // Player activity logging
  const { logActivity } = usePlayerActivityLog(auth.user?.id);
  
  // Weekly challenges (needs sound for notifications)
  const weeklyChallenges = useWeeklyChallenges(
    auth.user?.id,
    playSound,
    confetti.fireChallengeBurst,
    haptics
  );
  
  // Core game state
  const gameState = useGameState(playSound, weeklyChallenges.updateProgress, logActivity);
  const { state, message, messageType, kittensBreed, currentDailyEvent, relationshipSystem, actions } = gameState;
  
  // Unified message system
  const messageSystem = useGameMessages();
  const lastMessageRef = useRef<string>('');
  
  // Sync game state messages to the queue system
  useEffect(() => {
    if (message && message !== lastMessageRef.current) {
      lastMessageRef.current = message;
      messageSystem.showMessage(message, messageType);
    }
  }, [message, messageType, messageSystem]);
  
  // Cloud and profile
  const cloudSave = useCloudSave(auth.user?.id);
  const leaderboard = useGlobalLeaderboard(auth.user?.id);
  const profile = usePlayerProfile(auth.user?.id);
  
  // Daily rewards
  const dailyRewards = useDailyLoginRewards(
    auth.user?.id,
    playSound,
    haptics.vibrateAchievement,
    confetti.fireConfetti
  );
  
  // Gift and trade systems
  const gifts = useCatGifts(auth.user?.id);
  const trading = useTrading(auth.user?.id);
  const { showOutdatedToast } = usePortraitOutdatedToast();
  
  // Relationship reminders
  const relationshipReminders = useRelationshipReminders(
    relationshipSystem.relationships,
    state.cats,
    state.day,
    true
  );
  
  // Milestone and objectives
  const milestones = useMilestones();
  const objectives = useDailyObjectives(auth.user?.id);
  
  // Collection and wheel
  const collection = useCollectionProgress(state.cats, state.ownedCostumes);
  const luckyWheel = useLuckyWheel(dailyRewards.isVIP);
  
  // Legacy/Hall of Fame
  const legacy = useLegacy(auth.user?.id);
  
  // Specializations
  const specializations = useSpecializations();
  
  // Battle Pass
  const battlePass = useBattlePass(auth.user?.id);
  
  // Friends and coop
  const friends = useFriends(auth.user?.id);
  const coopChallenges = useCoopChallenges(auth.user?.id, friends.friends, playSound);
  
  // Badge counts
  const badgeCounts = useBadgeCounts({
    state,
    objectives: objectives.objectives,
    allObjectivesCompleted: objectives.allCompleted,
    canSpin: luckyWheel.canSpin,
    spinsRemaining: luckyWheel.spinsRemaining,
    retiredCatsCount: legacy.retiredCats.length,
    specializationsCount: state.cats.filter(c => c.specialization).length,
    getUnclaimedRewards: battlePass.getUnclaimedRewards,
    getCoopActiveCount: coopChallenges.getActiveCount,
    getCoopPendingCount: coopChallenges.getPendingCount,
    relationshipNeedsAttention: relationshipReminders.needsAttentionCount,
    relationships: relationshipSystem.relationships,
    receivedGifts: gifts.receivedGifts,
    incomingTrades: trading.incomingTrades,
    pendingRequests: friends.pendingRequests,
    challenges: weeklyChallenges.challenges,
  });

  return {
    // Core systems (from useCatFarmSystems)
    sound: systems.sound,
    confetti: systems.confetti,
    haptics: systems.haptics,
    auth: systems.auth,
    theme: systems.theme,
    isMobile: systems.isMobile,
    getCatReaction: systems.getCatReaction,
    
    // Game state
    gameState,
    state,
    actions,
    kittensBreed,
    currentDailyEvent,
    relationshipSystem,
    message,
    messageType,
    messageSystem,
    
    // Cloud & profile
    cloudSave,
    leaderboard,
    profile,
    
    // Systems
    weeklyChallenges,
    dailyRewards,
    gifts,
    trading,
    showOutdatedToast,
    relationshipReminders,
    milestones,
    objectives,
    collection,
    luckyWheel,
    legacy,
    specializations,
    battlePass,
    friends,
    coopChallenges,
    badgeCounts,
    
    // UI State (from useCatFarmUIState)
    ui,
  };
}

export type CatFarmState = ReturnType<typeof useCatFarmState>;
