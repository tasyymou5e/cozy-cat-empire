import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useGameState } from '@/hooks/game';
import { useSound } from '@/contexts/SoundContext';
import { useConfetti } from '@/hooks/useConfetti';
import { useHaptics } from '@/hooks/useHaptics';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
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
import { useGameEvents } from '@/hooks/useGameEvents';
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

// Decomposed components
import { CatFarmSkeleton } from './CatFarmSkeleton';
import { CatFarmHeader } from './CatFarmHeader';
import { CatFarmDialogs } from './CatFarmDialogs';
import { CatFarmOverlays } from './CatFarmOverlays';

// Panel and UI components
import { StatusBar } from './StatusBar';
import { MessageBar } from './MessageBar';
import { ActionPanel } from './ActionPanel';
import { ResourcePanel } from './ResourcePanel';
import { ChorePanel } from './ChorePanel';
import { MarketPanel } from './MarketPanel';
import { BreedingPanel } from './BreedingPanel';
import { AchievementsPanel } from './AchievementsPanel';
import { SaveLoadPanel } from './SaveLoadPanel';
import { SocializePanel } from './SocializePanel';
import { RelationshipPanel } from './RelationshipPanel';
import { MatchmakingPanel } from './MatchmakingPanel';
import { GroupActivitiesPanel } from './GroupActivitiesPanel';
import { TrainingPanel } from './TrainingPanel';
import { UnifiedCatCard } from './UnifiedCatCard';
import { LeaderboardPanel } from './LeaderboardPanel';
import { DailyObjectivesPanel } from './DailyObjectivesPanel';
import { CollectionProgressPanel } from './CollectionProgressPanel';
import { LuckyWheelPanel } from './LuckyWheelPanel';
import { HallOfFamePanel } from './HallOfFamePanel';
import { SpecializationPanel } from './SpecializationPanel';
import { BattlePassPanel } from './BattlePassPanel';
import { CoopChallengesPanel } from './CoopChallengesPanel';
import { BulkActionsPanel } from './BulkActionsPanel';
import { FriendsPanel } from './FriendsPanel';
import { PlayerProfilePanel } from './PlayerProfilePanel';
import { CostumeShopPanel } from './CostumeShopPanel';
import { CatGiftingPanel } from './CatGiftingPanel';
import { TradingPanel } from './TradingPanel';
import { WeeklyChallengesPanel } from './WeeklyChallengesPanel';
import { GraphicsSettingsPanel } from './GraphicsSettingsPanel';
import { CategoryTabBar, getCategoryForTab } from './CategoryTabBar';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileMenuSheet } from './MobileMenuSheet';
import { PanelErrorBoundary } from './PanelErrorBoundary';

// UI primitives
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { FloatingDecorations } from '@/components/ui/FloatingDecorations';
import { Tabs, TabsContent } from '@/components/ui/tabs';

// Types
import { BattlePassReward } from '@/types/battlePass';
import { CURRENT_VERSION } from '@/types/changelog';
import { Resources } from '@/types/game';
import { ObjectiveType } from '@/types/dailyObjectives';

const MOOD_LABELS = {
  morning: '🌅 Morning',
  afternoon: '☀️ Afternoon', 
  evening: '🌆 Evening',
  night: '🌙 Night',
  celebration: '🎉 Celebration',
  tense: '⚡ Tense',
};

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

/**
 * CatFarm - Main game orchestrator component
 * 
 * The central hub that manages all game panels, state, and interactions.
 * Handles cloud saves, achievements, daily rewards, notifications, and
 * coordinates between all sub-panels.
 * 
 * @example
 * ```tsx
 * <CatFarm />
 * ```
 * 
 * @remarks
 * - Requires AuthProvider, SoundProvider, and CatReactionProvider as ancestors
 * - Automatically loads cloud save on login
 * - Auto-saves every 5 minutes when logged in
 * - Manages 16-tab sidebar layout for different game features
 */
export function CatFarm() {
  const { 
    playSound, setEnabled, isEnabled, setVolume, getVolume,
    startMusic, stopMusic, isMusicPlaying, setMusicVolume,
    updateMusicForDay, getCurrentMood, triggerCelebration, triggerTense 
  } = useSound();
  const { fireConfetti, fireCelebration, fireStars, fireChallengeBurst } = useConfetti();
  const { vibrateProgress, vibrateComplete, vibrateAchievement } = useHaptics();
  const { user, signOut, loading: authLoading } = useAuth();
  const { logActivity } = usePlayerActivityLog(user?.id);
  const { 
    challenges, loading: challengesLoading, updateProgress: updateChallengeProgress, 
    claimReward, getTimeRemaining, lastProgressUpdate, clearProgressUpdate, 
    totalChallengesCompleted, currentStreak, longestStreak 
  } = useWeeklyChallenges(user?.id, playSound, fireChallengeBurst, { vibrateProgress, vibrateComplete, vibrateAchievement });
  const { state, message, messageType, kittensBreed, currentDailyEvent, relationshipSystem, actions } = useGameState(playSound, updateChallengeProgress, logActivity);
  
  // Unified message system - syncs with useGameState messages
  const { currentMessage, showMessage: queueMessage, dismissMessage: dismissQueuedMessage, queueCount } = useGameMessages();
  const lastMessageRef = useRef<string>('');
  
  // Sync game state messages to the queue system
  useEffect(() => {
    if (message && message !== lastMessageRef.current) {
      lastMessageRef.current = message;
      queueMessage(message, messageType);
    }
  }, [message, messageType, queueMessage]);
  
  const isMobile = useIsMobile();
  const { cloudSave, cloudLoad, hasCloudSave } = useCloudSave(user?.id);
  const { syncPlayerStats } = useGlobalLeaderboard(user?.id);
  const { profile } = usePlayerProfile(user?.id);
  const { theme, setTheme } = useTheme();
  const {
    currentStreak: loginStreak,
    longestStreak: loginLongestStreak,
    totalLogins,
    canClaim: canClaimDailyReward,
    showModal: showDailyRewardsModal,
    setShowModal: setShowDailyRewardsModal,
    claimDailyReward,
    vipTier,
    isVIP,
  } = useDailyLoginRewards(user?.id, playSound, vibrateAchievement, fireConfetti);
  const { receivedGifts, newGiftAlert, clearNewGift, acceptGift: acceptCatGift, declineGift: declineCatGift } = useCatGifts(user?.id);
  const { incomingTrades, newTradeAlert, clearNewTrade, acceptTrade: acceptTradeOffer, declineTrade: declineTradeOffer } = useTrading(user?.id);
  const { showOutdatedToast } = usePortraitOutdatedToast();
  
  // Relationship reminders system
  const { needsAttentionCount: relationshipNeedsAttention } = useRelationshipReminders(
    relationshipSystem.relationships,
    state.cats,
    state.day,
    true
  );
  
  // Milestone and Daily Objectives systems
  const { pendingCelebration, playerTitle, checkMilestones, claimMilestone, dismissCelebration } = useMilestones();
  const { objectives, allCompleted: allObjectivesCompleted, bonusClaimed, updateProgress: updateObjectiveProgress, claimBonus: claimObjectivesBonus } = useDailyObjectives(user?.id);
  
  // Collection Progress and Lucky Wheel systems
  const { breedProgress, personalityProgress, costumeProgress, trickProgress, overallProgress, progress: collectionProgress, getSetReward } = useCollectionProgress(state.cats, state.ownedCostumes);
  const { canSpin, spinsRemaining, isSpinning, lastPrize, totalSpins, spin: spinWheel, clearLastPrize } = useLuckyWheel(isVIP);
  
  // Hall of Fame / Legacy system
  const { retiredCats, totalLegacyBonus, retireCat, canRetire, getEligibility, getKittenBonuses } = useLegacy(user?.id);
  
  // Specialization system (stateless utilities - uses Cat.specialization)
  const { canSpecialize, getSpecialization, getActiveBonuses: getSpecBonuses, getSpecializedCats, migrateLegacyData: migrateSpecializations } = useSpecializations();
  
  // Battle Pass system
  const { battlePass, season, xpProgress, addXP: addBattlePassXP, claimReward: claimBPReward, getUnclaimedRewards, canClaimReward: canClaimBPReward, upgradeToPremium } = useBattlePass(user?.id);
  
  // Friends for coop challenges
  const { friends, pendingRequests } = useFriends(user?.id);
  
  // Coop Challenges system
  const { 
    activeChallenges: coopActiveChallenges,
    pendingInvites: coopPendingInvites,
    sentInvites: coopSentInvites,
    sendInvite: sendCoopInvite,
    acceptInvite: acceptCoopInvite,
    declineInvite: declineCoopInvite,
    cancelInvite: cancelCoopInvite,
    updateProgress: updateCoopProgress,
    claimReward: claimCoopReward,
    getActiveCount: getCoopActiveCount,
    getPendingCount: getCoopPendingCount,
    templates: coopTemplates,
  } = useCoopChallenges(user?.id, friends, playSound);

  const [sideTab, setSideTab] = useState('actions');
  const [soundOn, setSoundOn] = useState(true);
  const [musicOn, setMusicOn] = useState(false);
  const [currentMoodLabel, setCurrentMoodLabel] = useState('');
  const [sfxVolume, setSfxVolume] = useState(50);
  const [musicVolume, setMusicVolumeState] = useState(40);
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

    const tabInfo = TAB_LABELS[sideTab];
    if (!tabInfo) return;

    setRecentTabs(prev => {
      // Remove existing entry for this tab
      const filtered = prev.filter(t => t.tab !== sideTab);
      // Add new entry at the beginning
      const updated = [{ tab: sideTab, label: tabInfo.label, icon: tabInfo.icon, timestamp: Date.now() }, ...filtered].slice(0, 4);
      localStorage.setItem('cat-farm-recent-tabs', JSON.stringify(updated));
      return updated;
    });
  }, [sideTab]);

  // Calculate badge counts for tabs and categories
  const { tabBadges, categoryBadges } = useBadgeCounts({
    state,
    objectives,
    allObjectivesCompleted,
    canSpin,
    spinsRemaining,
    retiredCatsCount: retiredCats.length,
    specializationsCount: state.cats.filter(c => c.specialization).length,
    getUnclaimedRewards,
    getCoopActiveCount,
    getCoopPendingCount,
    relationshipNeedsAttention,
    relationships: relationshipSystem.relationships,
    receivedGifts,
    incomingTrades,
    pendingRequests,
    challenges,
  });

  // Play sound when receiving gift
  useEffect(() => {
    if (newGiftAlert) {
      playSound?.('giftReceived');
    }
  }, [newGiftAlert, playSound]);

  // Play sound when receiving trade
  useEffect(() => {
    if (newTradeAlert) {
      playSound?.('tradeReceived');
    }
  }, [newTradeAlert, playSound]);

  // Handle accepting gift from popup
  const handleAcceptGiftFromPopup = async (giftId: string) => {
    const cat = await acceptCatGift(giftId);
    if (cat) {
      actions.addReceivedCat?.(cat);
      playSound?.('success');
      fireConfetti();
    }
    clearNewGift();
  };

  const handleDeclineGiftFromPopup = async (giftId: string) => {
    await declineCatGift(giftId);
    clearNewGift();
  };

  // Handle accepting trade from popup
  const handleAcceptTradeFromPopup = async (tradeId: string) => {
    const trade = await acceptTradeOffer(tradeId);
    if (trade) {
      // Add received cats and resources
      if (trade.offered_cats) {
        for (const cat of trade.offered_cats) {
          actions.addReceivedCat?.(cat);
        }
      }
      if (trade.offered_money) {
        actions.addReward?.(trade.offered_money, {});
      }
      playSound?.('success');
      fireConfetti();
    }
    clearNewTrade();
  };

  const handleDeclineTradeFromPopup = async (tradeId: string) => {
    await declineTradeOffer(tradeId);
    clearNewTrade();
  };

  // Handle claiming daily reward
  const handleClaimDailyReward = async () => {
    const reward = await claimDailyReward();
    if (reward) {
      actions.addReward?.(reward.coins, reward.resources as Resources);
      // Unlock VIP costumes if any
      if (reward.unlockedCostumes) {
        for (const costumeId of reward.unlockedCostumes) {
          if (!state.ownedCostumes.includes(costumeId)) {
            actions.buyCostume?.(costumeId);
          }
        }
      }
    }
  };

  // Check milestones when stats change
  useEffect(() => {
    const milestone = checkMilestones({
      totalMoneyEarned: state.totalMoneyEarned,
      totalShowWins: state.totalShowWins,
      catsOwned: state.cats.length,
      day: state.day,
      kittensBred: kittensBreed,
    });
    if (milestone) {
      playSound?.('achievement');
      vibrateAchievement?.();
    }
  }, [state.totalMoneyEarned, state.totalShowWins, state.cats.length, state.day, kittensBreed, checkMilestones, playSound, vibrateAchievement]);

  // Handle claiming milestone reward
  const handleClaimMilestone = () => {
    const coins = claimMilestone();
    if (coins > 0) {
      actions.addReward?.(coins, {});
      playSound?.('coin');
    }
  };

  // Handle claiming daily objectives bonus
  const handleClaimObjectivesBonus = () => {
    const coins = claimObjectivesBonus();
    if (coins > 0) {
      actions.addReward?.(coins, {});
      playSound?.('coin');
      fireConfetti();
    }
  };

  // Handle claiming lucky wheel prize
  const handleClaimWheelPrize = useCallback((prize: typeof lastPrize) => {
    if (!prize) return;
    
    const { reward } = prize;
    const coins = reward.coins || 0;
    const resources: Partial<Resources> = {};
    
    if (reward.food) resources.food = reward.food;
    if (reward.medicine) resources.medicine = reward.medicine;
    if (reward.toys) resources.toys = reward.toys;
    if (reward.treats) resources.treats = reward.treats;
    
    actions.addReward?.(coins, resources as Resources);
    playSound?.('coin');
    
    if (['rare', 'ultra_rare', 'legendary'].includes(prize.rarity)) {
      fireConfetti();
    }
  }, [actions, playSound, fireConfetti]);

  // Handle retiring a cat to Hall of Fame
  const handleRetireCat = useCallback((cat: typeof state.cats[0]) => {
    const legacy = retireCat(cat, state.day);
    if (legacy) {
      // Remove cat from farm
      actions.sellCat(cat.id);
      playSound?.('achievement');
      fireConfetti();
      fireCelebration();
    }
  }, [retireCat, state.day, actions, playSound, fireConfetti, fireCelebration]);

  // Wrapper for actions that update objectives
  const trackObjective = useCallback((type: ObjectiveType, amount: number = 1) => {
    updateObjectiveProgress(type, amount);
  }, [updateObjectiveProgress]);

  // Handle claiming battle pass rewards
  const handleClaimBPReward = useCallback((reward: BattlePassReward) => {
    const coins = typeof reward.value === 'number' && reward.type === 'coins' ? reward.value : 0;
    const resources: Partial<Resources> = {};
    
    if (reward.type === 'treats' && typeof reward.value === 'number') {
      resources.treats = reward.value;
    } else if (reward.type === 'toys' && typeof reward.value === 'number') {
      resources.toys = reward.value;
    }
    
    if (coins > 0 || Object.keys(resources).length > 0) {
      actions.addReward?.(coins, resources as Resources);
    }
    
    // Handle costume rewards
    if (reward.type === 'costume' && typeof reward.value === 'string') {
      if (!state.ownedCostumes.includes(reward.value)) {
        actions.buyCostume?.(reward.value);
      }
    }
    
    playSound?.('coin');
    fireConfetti();
  }, [actions, state.ownedCostumes, playSound, fireConfetti]);

  // Handle upgrading to premium pass
  const handleUpgradePremium = useCallback(() => {
    actions.addReward?.(-500, {}); // Deduct 500 coins
    playSound?.('success');
    fireConfetti();
  }, [actions, playSound, fireConfetti]);

  // Centralized game event dispatcher with automatic side effects
  const { dispatchAction } = useGameEvents({
    actions,
    trackObjective,
    addBattlePassXP,
    updateCoopProgress,
  });

  // Quick Socialize - navigate to social tab with pre-selected cats
  const handleQuickSocialize = useCallback((cat1Id: string, cat2Id: string) => {
    setQuickSocializePair({ cat1Id, cat2Id });
    setSideTab('social');
    playSound?.('click');
  }, [playSound]);

  const clearQuickSocializePair = useCallback(() => {
    setQuickSocializePair(null);
  }, []);


  // Handle coop challenge reward claiming
  const handleClaimCoopReward = useCallback(async (challengeId: string) => {
    const result = await claimCoopReward(challengeId);
    if (result) {
      const totalReward = result.coins + result.bonus;
      actions.addReward?.(totalReward, {});
      fireConfetti();
    }
    return result;
  }, [claimCoopReward, actions, fireConfetti]);

  // Load cloud save on login
  useEffect(() => {
    if (user && !hasLoadedCloud) {
      cloudLoad().then(({ data }) => {
        if (data) {
          actions.loadFromData?.(data.game_state, data.kittens_bred, data.relationships);
          setLastCloudSave(data.last_played_at);
        }
        setHasLoadedCloud(true);
      });
    }
  }, [user, hasLoadedCloud, cloudLoad, actions]);

  // Auto-save to cloud every 5 minutes when logged in
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(async () => {
      setCloudSyncing(true);
      const result = await cloudSave(state, kittensBreed, relationshipSystem.getRelationshipSaveData());
      if (result.success) {
        setLastCloudSave(new Date().toISOString());
      }
      setCloudSyncing(false);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user, state, kittensBreed, relationshipSystem, cloudSave]);

  const handleCloudSave = async () => {
    if (!user) return;
    setCloudSyncing(true);
    const result = await cloudSave(state, kittensBreed, relationshipSystem.getRelationshipSaveData());
    if (result.success) {
      setLastCloudSave(new Date().toISOString());
      // Sync player stats to global leaderboard
      await syncPlayerStats(state, kittensBreed, profile?.display_name || undefined, profile?.avatar_emoji || undefined);
      playSound?.('success');
    }
    setCloudSyncing(false);
  };

  const handleCloudLoad = async () => {
    if (!user) return;
    const { data } = await cloudLoad();
    if (data) {
      actions.loadFromData?.(data.game_state, data.kittens_bred, data.relationships);
      setLastCloudSave(data.last_played_at);
      playSound?.('success');
    }
  };

  // Keyboard shortcuts
  const handleFeed = useCallback(() => {
    if (state.resources.food > 0 && state.cats.length > 0) {
      actions.feedCats();
    }
  }, [state.resources.food, state.cats.length, actions]);

  useKeyboardShortcuts({
    onFeed: handleFeed,
    onNextDay: actions.nextDay,
    onSave: actions.saveGame,
    onTabChange: setSideTab,
  });

  // Listen for ? key to show shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '?' && !(e.target instanceof HTMLInputElement)) {
        setShowShortcutsHelp(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Update music mood when day changes
  useEffect(() => {
    if (musicOn) {
      updateMusicForDay(state.day);
      setCurrentMoodLabel(MOOD_LABELS[getCurrentMood()]);
    }
  }, [state.day, musicOn, updateMusicForDay, getCurrentMood]);

  // Fire confetti on achievements
  useEffect(() => {
    const unlockedCount = state.achievements.filter(a => a.unlocked).length;
    if (unlockedCount > lastAchievementCount && lastAchievementCount > 0) {
      fireStars();
      if (musicOn) {
        triggerCelebration();
        setCurrentMoodLabel(MOOD_LABELS.celebration);
        setTimeout(() => setCurrentMoodLabel(MOOD_LABELS[getCurrentMood()]), 10000);
      }
    }
    setLastAchievementCount(unlockedCount);
  }, [state.achievements, lastAchievementCount, fireStars, musicOn, triggerCelebration, getCurrentMood]);

  // Fire confetti on show wins
  useEffect(() => {
    if (message?.includes('wins!') && message?.includes('Cat show')) {
      fireCelebration();
      if (musicOn) {
        triggerCelebration();
        setCurrentMoodLabel(MOOD_LABELS.celebration);
        setTimeout(() => setCurrentMoodLabel(MOOD_LABELS[getCurrentMood()]), 10000);
      }
    }
  }, [message, fireCelebration, musicOn, triggerCelebration, getCurrentMood]);

  // Trigger tense mood on negative events
  useEffect(() => {
    if (musicOn && (message?.includes('fight') || message?.includes('sick') || message?.includes('ran away') || message?.includes('passed away'))) {
      triggerTense();
      setCurrentMoodLabel(MOOD_LABELS.tense);
      setTimeout(() => setCurrentMoodLabel(MOOD_LABELS[getCurrentMood()]), 6000);
    }
  }, [message, musicOn, triggerTense, getCurrentMood]);

  // Check for What's New popup on mount (after tutorial)
  useEffect(() => {
    const lastSeenVersion = localStorage.getItem('cat-farm-last-seen-version');
    const tutorialComplete = localStorage.getItem('cat-farm-tutorial-complete');
    
    // Only show if tutorial is done and version is new
    if (tutorialComplete && lastSeenVersion !== CURRENT_VERSION) {
      // Delay so daily rewards appears first
      const timer = setTimeout(() => setShowWhatsNew(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const toggleSound = () => {
    const newState = !soundOn;
    setSoundOn(newState);
    setEnabled(newState);
    if (newState) playSound('click');
  };

  const toggleMusic = () => {
    if (musicOn) {
      stopMusic();
      setMusicOn(false);
      setCurrentMoodLabel('');
    } else {
      startMusic();
      setMusicOn(true);
      updateMusicForDay(state.day);
      setCurrentMoodLabel(MOOD_LABELS[getCurrentMood()]);
      playSound('click');
    }
  };

  const handleSfxVolumeChange = (value: number[]) => {
    const vol = value[0];
    setSfxVolume(vol);
    setVolume(vol / 100);
  };

  const handleMusicVolumeChange = (value: number[]) => {
    const vol = value[0];
    setMusicVolumeState(vol);
    setMusicVolume((vol / 100) * 0.3);
  };

  const { getCatReaction } = useCatReactions();

  // Show skeleton during initial cloud load
  if (authLoading || (user && !hasLoadedCloud)) {
    return <CatFarmSkeleton />;
  }

  return (
    <AnimatedBackground variant="game" className="min-h-screen">
      <FloatingDecorations variant="paws" density="low" className="opacity-20" />
      {/* Overlays: Tutorial, Animations, Popups */}
      <CatFarmOverlays
        onHighlightTab={setHighlightedTab}
        showShortcutsHelp={showShortcutsHelp}
        onCloseShortcutsHelp={() => setShowShortcutsHelp(false)}
        events={relationshipSystem.events}
        lastEventId={relationshipSystem.lastEventId}
        cats={state.cats}
        onCatClick={() => playSound('click')}
        onFeed={(catId) => { actions.feedSingleCat?.(catId); trackObjective('feed_cats'); }}
        onComfort={(catId) => dispatchAction('COMFORT_CAT', { catId })}
        onHeal={(catId) => dispatchAction('USE_MEDICINE', { catId })}
        hasFood={state.resources.food > 0}
        hasMedicine={state.resources.medicine > 0}
        currentDailyEvent={currentDailyEvent}
        onDismissDailyEvent={actions.clearDailyEvent}
      />
      
      {/* Dialogs: Milestones, Gifts, Trades, Daily Rewards, What's New */}
      <CatFarmDialogs
        newGiftAlert={newGiftAlert}
        onAcceptGift={handleAcceptGiftFromPopup}
        onDeclineGift={handleDeclineGiftFromPopup}
        onClearGift={clearNewGift}
        newTradeAlert={newTradeAlert}
        onAcceptTrade={handleAcceptTradeFromPopup}
        onDeclineTrade={handleDeclineTradeFromPopup}
        onClearTrade={clearNewTrade}
        pendingMilestone={pendingCelebration}
        onClaimMilestone={handleClaimMilestone}
        onDismissMilestone={dismissCelebration}
        loginStreak={loginStreak}
        loginLongestStreak={loginLongestStreak}
        totalLogins={totalLogins}
        canClaimDailyReward={canClaimDailyReward}
        showDailyRewardsModal={showDailyRewardsModal}
        onCloseDailyRewardsModal={() => setShowDailyRewardsModal(false)}
        onClaimDailyReward={handleClaimDailyReward}
        vipTier={vipTier}
        isVIP={isVIP}
        showWhatsNew={showWhatsNew}
        onCloseWhatsNew={() => setShowWhatsNew(false)}
      />
      
      {/* Header: Logo, Audio, User Menu */}
      <CatFarmHeader
        musicOn={musicOn}
        soundOn={soundOn}
        currentMoodLabel={currentMoodLabel}
        sfxVolume={sfxVolume}
        musicVolume={musicVolume}
        onToggleMusic={toggleMusic}
        onToggleSound={toggleSound}
        onSfxVolumeChange={handleSfxVolumeChange}
        onMusicVolumeChange={handleMusicVolumeChange}
        theme={theme}
        onThemeChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        recentTabs={recentTabs}
        onNavigateTab={setSideTab}
        onShowShortcutsHelp={() => setShowShortcutsHelp(true)}
        onShowWhatsNew={() => setShowWhatsNew(true)}
        onShowDailyRewards={() => setShowDailyRewardsModal(true)}
        user={user}
        onSignOut={signOut}
        lastCloudSave={lastCloudSave}
        cloudSyncing={cloudSyncing}
        onCloudSave={handleCloudSave}
        onLocalSave={actions.saveGame}
        onResetGame={actions.resetGame}
        isVIP={isVIP}
        vipTier={vipTier}
        canClaimDailyReward={canClaimDailyReward}
        isMobile={isMobile}
      />

      <StatusBar 
        day={state.day}
        money={state.money}
        cats={state.cats}
        space={state.space}
        houseSize={state.houseSize}
        acres={state.acres}
        totalShowWins={state.totalShowWins}
        showCooldown={state.showCooldown}
        onUpgrade={actions.upgradeHouse} 
        onCatShow={(tier) => dispatchAction('CAT_SHOW', { tier })} 
        relationships={relationshipSystem.relationships} 
      />
      <MessageBar gameMessage={currentMessage} onDismiss={dismissQueuedMessage} queueCount={queueCount} />

      <Tabs value={sideTab} onValueChange={setSideTab} className={`flex-1 flex flex-col ${isMobile ? 'pb-16' : ''}`}>
        {/* Category-based Tab navigation - sticky at top (hidden on mobile, shown on desktop) */}
        {!isMobile && (
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-2">
            <CategoryTabBar 
              activeTab={sideTab}
              onTabChange={setSideTab}
              highlightedTab={highlightedTab}
              badges={tabBadges}
            />
          </div>
        )}
        
        {/* Mobile: Show only sub-tabs for current category */}
        {isMobile && (
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-2 py-2">
            <CategoryTabBar 
              activeTab={sideTab}
              onTabChange={setSideTab}
              highlightedTab={highlightedTab}
              badges={tabBadges}
            />
          </div>
        )}

        <main className="game-main">
          <section className="cat-grid-section">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Your Cats</h2>
              <span className="text-sm text-muted-foreground">{state.cats.length} / {state.space} capacity</span>
            </div>
            
            {state.cats.length === 0 ? (
              <div className="empty-state">
                <span className="text-6xl mb-4">🐾</span>
                <p className="text-muted-foreground mb-2">No cats yet!</p>
                <p className="text-sm text-muted-foreground">Add a stray for free or buy from the market.</p>
              </div>
            ) : (
              <div className="cat-grid">
                {state.cats.map(cat => (
                        <UnifiedCatCard 
                          key={cat.id} 
                          cat={cat}
                          variant="card"
                          equippedCostumeId={state.catCostumes[cat.id]}
                          onSell={(catId) => dispatchAction('SELL_CAT', { catId })} 
                          onHeal={(catId) => dispatchAction('USE_MEDICINE', { catId })}
                          onComfort={(catId) => dispatchAction('COMFORT_CAT', { catId })}
                          onRename={actions.renameCat}
                          relationships={relationshipSystem.relationships} 
                          allCats={state.cats}
                          reaction={getCatReaction(cat.id)}
                          showStats
                          showRelationships
                          showActions
                        />
                ))}
              </div>
            )}
          </section>

          <aside className="action-sidebar">
            <TabsContent value="actions" className="mt-0">
              <PanelErrorBoundary panelName="ActionPanel">
                <ActionPanel onAddCat={actions.addCat} onNextDay={actions.nextDay} money={state.money} space={state.space} catCount={state.cats.length} />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="chores" className="mt-0">
              <PanelErrorBoundary panelName="ChorePanel">
                <ChorePanel onDoChore={(choreId, baseReward) => dispatchAction('DO_CHORE', { choreId, baseReward })} />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="supplies" className="mt-0">
              <PanelErrorBoundary panelName="ResourcePanel">
                <ResourcePanel resources={state.resources} money={state.money} catCount={state.cats.length}
                  onBuyResource={(resource, cost) => dispatchAction('BUY_RESOURCE', { resource: resource as keyof Resources, cost })} onFeedCats={() => dispatchAction('FEED_CATS')} onUseToys={actions.useToys} />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="market" className="mt-0">
              <PanelErrorBoundary panelName="MarketPanel">
                <MarketPanel listings={state.marketListings} money={state.money} hasSpace={state.cats.length < state.space} onBuy={actions.buyFromMarket} />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="costumes" className="mt-0">
              <PanelErrorBoundary panelName="CostumeShopPanel">
                <CostumeShopPanel 
                  cats={state.cats} 
                  money={state.money} 
                  ownedCostumes={state.ownedCostumes} 
                  catCostumes={state.catCostumes}
                  onBuyCostume={actions.buyCostume}
                  onEquipCostume={actions.equipCostume}
                  onPortraitOutdated={showOutdatedToast}
                />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="breeding" className="mt-0">
              <PanelErrorBoundary panelName="BreedingPanel">
                <BreedingPanel cats={state.cats} cooldown={state.breedingCooldown} hasSpace={state.cats.length < state.space}
                  onBreed={(cat1Id, cat2Id) => dispatchAction('BREED_CATS', { cat1Id, cat2Id })} getBreedingCompatibility={relationshipSystem.getBreedingCompatibility} catCostumes={state.catCostumes} relationships={relationshipSystem.relationships} />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="training" className="mt-0">
              <PanelErrorBoundary panelName="TrainingPanel">
                <TrainingPanel cats={state.cats} treats={state.resources.treats} toys={state.resources.toys}
                  day={state.day} onTrain={(catId, trickId) => dispatchAction('TRAIN_CAT', { catId, trickId })} onRest={actions.restCat} catCostumes={state.catCostumes} />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="bulk" className="mt-0">
              <PanelErrorBoundary panelName="BulkActionsPanel">
                <BulkActionsPanel 
                  cats={state.cats}
                  resources={state.resources}
                  day={state.day}
                  relationships={relationshipSystem.relationships}
                  onHealAll={actions.healAllSickCats}
                  onRestAll={actions.restAllTiredCats}
                  onComfortAll={actions.comfortAllUnhappyCats}
                  onTrainAll={actions.trainAllAvailableCats}
                  onSellSelected={actions.sellSelectedCats}
                  onSocializeAll={actions.socializeAllNeglected}
                  catCostumes={state.catCostumes}
                />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="social" className="mt-0 space-y-4">
              <PanelErrorBoundary panelName="SocialPanels">
                <SocializePanel cats={state.cats} treats={state.resources.treats}
                  getRelationship={relationshipSystem.getRelationship} onSocialize={(cat1Id, cat2Id) => dispatchAction('SOCIALIZE_CATS', { cat1Id, cat2Id })} catCostumes={state.catCostumes}
                  initialCat1Id={quickSocializePair?.cat1Id} initialCat2Id={quickSocializePair?.cat2Id} onClearSelection={clearQuickSocializePair} />
                <MatchmakingPanel cats={state.cats} relationships={relationshipSystem.relationships}
                  onSocialize={(cat1Id, cat2Id) => dispatchAction('SOCIALIZE_CATS', { cat1Id, cat2Id })} treats={state.resources.treats} catCostumes={state.catCostumes} />
                <GroupActivitiesPanel cats={state.cats} groups={relationshipSystem.groups}
                  treats={state.resources.treats} toys={state.resources.toys} onGroupActivity={actions.doGroupActivity} catCostumes={state.catCostumes} />
                <RelationshipPanel cats={state.cats} relationships={relationshipSystem.relationships}
                  groups={relationshipSystem.groups} events={relationshipSystem.events} catCostumes={state.catCostumes}
                  currentDay={state.day} maintenanceStreak={relationshipSystem.maintenanceStreak} 
                  needsAttentionCount={relationshipNeedsAttention} onQuickSocialize={handleQuickSocialize} />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="leaderboard" className="mt-0">
              <PanelErrorBoundary panelName="LeaderboardPanel">
                <LeaderboardPanel cats={state.cats} relationships={relationshipSystem.relationships} catCostumes={state.catCostumes} />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="friends" className="mt-0">
              <PanelErrorBoundary panelName="FriendsPanel">
                <FriendsPanel userId={user?.id} />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="profile" className="mt-0">
              <PanelErrorBoundary panelName="PlayerProfilePanel">
                <PlayerProfilePanel userId={user?.id} />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="gifts" className="mt-0">
              <PanelErrorBoundary panelName="CatGiftingPanel">
                <CatGiftingPanel 
                  userId={user?.id} 
                  cats={state.cats}
                  onGiftSent={(catId) => actions.sellCat(catId)}
                  onGiftReceived={(cat) => actions.addReceivedCat?.(cat)}
                  catCostumes={state.catCostumes}
                />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="trading" className="mt-0">
              <PanelErrorBoundary panelName="TradingPanel">
                <TradingPanel 
                  userId={user?.id}
                  cats={state.cats}
                  money={state.money}
                  resources={state.resources}
                  onTradeComplete={(removeCats, addCats, moneyChange, resourceChanges) => {
                    removeCats.forEach(catId => actions.sellCat(catId));
                    addCats.forEach(cat => actions.addReceivedCat?.(cat));
                    // Money and resources handled by trade system
                  }}
                  catCostumes={state.catCostumes}
                />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="challenges" className="mt-0">
              <PanelErrorBoundary panelName="WeeklyChallengesPanel">
                <WeeklyChallengesPanel
                  challenges={challenges}
                  loading={challengesLoading}
                  timeRemaining={getTimeRemaining()}
                  onClaimReward={claimReward}
                  onRewardClaimed={(coins, badge) => {
                    playSound?.('coin');
                    fireConfetti();
                  }}
                  lastProgressUpdate={lastProgressUpdate}
                  onProgressAnimationComplete={clearProgressUpdate}
                  totalChallengesCompleted={totalChallengesCompleted}
                  currentStreak={currentStreak}
                  longestStreak={longestStreak}
                />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="objectives" className="mt-0">
              <PanelErrorBoundary panelName="DailyObjectivesPanel">
                <DailyObjectivesPanel
                  objectives={objectives}
                  allCompleted={allObjectivesCompleted}
                  bonusClaimed={bonusClaimed}
                  onClaimBonus={handleClaimObjectivesBonus}
                />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="wheel" className="mt-0">
              <PanelErrorBoundary panelName="LuckyWheelPanel">
                <LuckyWheelPanel
                  canSpin={canSpin}
                  spinsRemaining={spinsRemaining}
                  isSpinning={isSpinning}
                  lastPrize={lastPrize}
                  totalSpins={totalSpins}
                  isVIP={isVIP}
                  onSpin={spinWheel}
                  onClaimPrize={handleClaimWheelPrize}
                  onClearPrize={clearLastPrize}
                />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="collection" className="mt-0">
              <PanelErrorBoundary panelName="CollectionProgressPanel">
                <CollectionProgressPanel
                  breedProgress={breedProgress}
                  personalityProgress={personalityProgress}
                  costumeProgress={costumeProgress}
                  trickProgress={trickProgress}
                  overallProgress={overallProgress}
                  completedSets={collectionProgress.completedSets}
                  getSetReward={getSetReward}
                />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="legacy" className="mt-0">
              <PanelErrorBoundary panelName="HallOfFamePanel">
                <HallOfFamePanel
                  cats={state.cats}
                  retiredCats={retiredCats}
                  totalLegacyBonus={totalLegacyBonus}
                  catCostumes={state.catCostumes}
                  onRetireCat={handleRetireCat}
                  canRetire={canRetire}
                  getEligibility={getEligibility}
                  getKittenBonuses={getKittenBonuses}
                />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="specializations" className="mt-0">
              <PanelErrorBoundary panelName="SpecializationPanel">
                <SpecializationPanel
                  cats={state.cats}
                  catCostumes={state.catCostumes}
                  relationships={relationshipSystem.relationships}
                  kittensBred={kittensBreed}
                  onSpecialize={actions.setSpecialization}
                  canSpecialize={canSpecialize}
                  getSpecialization={getSpecialization}
                  getActiveBonuses={() => getSpecBonuses(state.cats)}
                />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="battlepass" className="mt-0">
              <PanelErrorBoundary panelName="BattlePassPanel">
                <BattlePassPanel
                  money={state.money}
                  onClaimReward={handleClaimBPReward}
                  onUpgradePremium={handleUpgradePremium}
                />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="coop" className="mt-0">
              <PanelErrorBoundary panelName="CoopChallengesPanel">
                <CoopChallengesPanel
                  userId={user?.id}
                  friends={friends}
                  activeChallenges={coopActiveChallenges}
                  pendingInvites={coopPendingInvites}
                  sentInvites={coopSentInvites}
                  templates={coopTemplates}
                  onSendInvite={sendCoopInvite}
                  onAcceptInvite={acceptCoopInvite}
                  onDeclineInvite={declineCoopInvite}
                  onCancelInvite={cancelCoopInvite}
                  onClaimReward={handleClaimCoopReward}
                />
              </PanelErrorBoundary>
            </TabsContent>
            <TabsContent value="more" className="mt-0 space-y-4">
              <PanelErrorBoundary panelName="MorePanels">
                <AchievementsPanel achievements={state.achievements}
                  currentStats={{ cats: state.cats.length, showWins: state.totalShowWins, money: state.totalMoneyEarned,
                    breeding: kittensBreed, house: state.houseSize !== 'apartment', farm: state.houseSize === 'farm', acres: state.acres, challengesCompleted: totalChallengesCompleted }} />
                <GraphicsSettingsPanel />
                <SaveLoadPanel 
                  onSave={user ? handleCloudSave : actions.saveGame} 
                  onLoad={user ? handleCloudLoad : actions.loadGame} 
                  hasSave={actions.hasSaveGame()} 
                  lastSaveDay={actions.getSaveDay()}
                  isLoggedIn={!!user}
                  cloudSyncing={cloudSyncing}
                  lastCloudSave={lastCloudSave}
                />
              </PanelErrorBoundary>
            </TabsContent>
          </aside>
        </main>
      </Tabs>
      
      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <>
          <MobileBottomNav
            activeCategory={getCategoryForTab(sideTab)}
            onCategoryChange={(categoryId) => {
              // Find first tab in this category and switch to it
              const category = [
                { id: 'farm', firstTab: 'actions' },
                { id: 'cats', firstTab: 'breeding' },
                { id: 'social', firstTab: 'social' },
                { id: 'progress', firstTab: 'leaderboard' },
              ].find(c => c.id === categoryId);
              if (category) {
                setSideTab(category.firstTab);
              }
            }}
            onOpenMenu={() => setMobileMenuOpen(true)}
            badges={categoryBadges}
          />
          <MobileMenuSheet
            open={mobileMenuOpen}
            onOpenChange={setMobileMenuOpen}
            activeTab={sideTab}
            onTabChange={setSideTab}
            badges={tabBadges}
          />
        </>
      )}
    </AnimatedBackground>
  );
}
