/**
 * @fileoverview Consolidated state management hook for CatFarm component
 * 
 * Combines all game-related hooks into a single state object to reduce
 * CatFarm.tsx complexity and improve maintainability.
 * 
 * @module hooks/useCatFarmState
 */

import { useState, useEffect, useRef } from 'react';
import { useGameState } from '@/hooks/game';
import { useSound } from '@/contexts/SoundContext';
import { useConfetti } from '@/hooks/useConfetti';
import { useHaptics } from '@/hooks/useHaptics';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
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
import { useTheme } from 'next-themes';
import { useCatReactions } from '@/contexts/CatReactionContext';

const TAB_LABELS: Record<string, { label: string; icon: string }> = {
  actions: { label: 'Actions', icon: '🐾' },
  chores: { label: 'Chores', icon: '🧹' },
  supplies: { label: 'Supplies', icon: '📦' },
  market: { label: 'Market', icon: '🛒' },
  costumes: { label: 'Costumes', icon: '👗' },
  breeding: { label: 'Breeding', icon: '💕' },
  training: { label: 'Training', icon: '💪' },
  bulk: { label: 'Bulk Actions', icon: '⚡' },
  social: { label: 'Social', icon: '🤝' },
  leaderboard: { label: 'Leaderboard', icon: '🏆' },
  friends: { label: 'Friends', icon: '👥' },
  profile: { label: 'Profile', icon: '👤' },
  gifts: { label: 'Gifts', icon: '🎁' },
  trading: { label: 'Trading', icon: '↔️' },
  challenges: { label: 'Challenges', icon: '🎯' },
  objectives: { label: 'Objectives', icon: '📋' },
  wheel: { label: 'Lucky Wheel', icon: '🎲' },
  collection: { label: 'Collection', icon: '📚' },
  legacy: { label: 'Hall of Fame', icon: '👑' },
  specializations: { label: 'Specializations', icon: '✨' },
  battlepass: { label: 'Season Pass', icon: '📜' },
  coop: { label: 'Co-op', icon: '🤝' },
  more: { label: 'Settings', icon: '⚙️' },
};

export { TAB_LABELS };

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
  // Core systems
  const soundSystem = useSound();
  const { playSound } = soundSystem;
  const confetti = useConfetti();
  const haptics = useHaptics();
  const { user, signOut, loading: authLoading } = useAuth();
  const { logActivity } = usePlayerActivityLog(user?.id);
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();
  const { getCatReaction } = useCatReactions();
  
  // Weekly challenges
  const weeklyChallenges = useWeeklyChallenges(
    user?.id, 
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
  const cloudSave = useCloudSave(user?.id);
  const leaderboard = useGlobalLeaderboard(user?.id);
  const profile = usePlayerProfile(user?.id);
  
  // Daily rewards
  const dailyRewards = useDailyLoginRewards(
    user?.id, 
    playSound, 
    haptics.vibrateAchievement, 
    confetti.fireConfetti
  );
  
  // Gift and trade systems
  const gifts = useCatGifts(user?.id);
  const trading = useTrading(user?.id);
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
  const objectives = useDailyObjectives(user?.id);
  
  // Collection and wheel
  const collection = useCollectionProgress(state.cats, state.ownedCostumes);
  const luckyWheel = useLuckyWheel(dailyRewards.isVIP);
  
  // Legacy/Hall of Fame
  const legacy = useLegacy(user?.id);
  
  // Specializations
  const specializations = useSpecializations();
  
  // Battle Pass
  const battlePass = useBattlePass(user?.id);
  
  // Friends and coop
  const friends = useFriends(user?.id);
  const coopChallenges = useCoopChallenges(user?.id, friends.friends, playSound);
  
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
  
  // UI State
  const [sideTab, setSideTab] = useState('actions');
  const [soundOn, setSoundOn] = useState(true);
  const [musicOn, setMusicOn] = useState(false);
  const [currentMoodLabel, setCurrentMoodLabel] = useState('');
  const [sfxVolume, setSfxVolume] = useState(50);
  const [musicVolume, setMusicVolume] = useState(40);
  const [lastAchievementCount, setLastAchievementCount] = useState(0);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [highlightedTab, setHighlightedTab] = useState<string | null>(null);
  const [cloudSyncing, setCloudSyncing] = useState(false);
  const [lastCloudSave, setLastCloudSave] = useState<string | null>(null);
  const [hasLoadedCloud, setHasLoadedCloud] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [quickSocializePair, setQuickSocializePair] = useState<{cat1Id: string, cat2Id: string} | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [recentTabs, setRecentTabs] = useState<Array<{tab: string, label: string, icon: string, timestamp: number}>>(() => {
    try {
      const saved = localStorage.getItem('cat-farm-recent-tabs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Track recent tabs
  useEffect(() => {
    const tabInfo = TAB_LABELS[sideTab];
    if (!tabInfo) return;

    setRecentTabs(prev => {
      const filtered = prev.filter(t => t.tab !== sideTab);
      const updated = [{ tab: sideTab, label: tabInfo.label, icon: tabInfo.icon, timestamp: Date.now() }, ...filtered].slice(0, 4);
      localStorage.setItem('cat-farm-recent-tabs', JSON.stringify(updated));
      return updated;
    });
  }, [sideTab]);
  
  return {
    // Core systems
    sound: soundSystem,
    confetti,
    haptics,
    auth: { user, signOut, loading: authLoading },
    theme: { theme, setTheme },
    isMobile,
    getCatReaction,
    
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
    
    // UI State
    ui: {
      sideTab, setSideTab,
      soundOn, setSoundOn,
      musicOn, setMusicOn,
      currentMoodLabel, setCurrentMoodLabel,
      sfxVolume, setSfxVolume,
      musicVolume, setMusicVolume,
      lastAchievementCount, setLastAchievementCount,
      showShortcutsHelp, setShowShortcutsHelp,
      highlightedTab, setHighlightedTab,
      cloudSyncing, setCloudSyncing,
      lastCloudSave, setLastCloudSave,
      hasLoadedCloud, setHasLoadedCloud,
      showWhatsNew, setShowWhatsNew,
      quickSocializePair, setQuickSocializePair,
      mobileMenuOpen, setMobileMenuOpen,
      recentTabs, setRecentTabs,
    },
  };
}

export type CatFarmState = ReturnType<typeof useCatFarmState>;
