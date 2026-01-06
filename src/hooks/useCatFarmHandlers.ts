/**
 * @fileoverview Consolidated event handlers for CatFarm component
 * 
 * Extracts all callback functions from CatFarm.tsx into a dedicated hook
 * to improve code organization and reduce the main component's complexity.
 * 
 * @module hooks/useCatFarmHandlers
 */

import { useCallback, useEffect } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useGameEvents } from '@/hooks/useGameEvents';
import { Resources } from '@/types/game';
import { BattlePassReward } from '@/types/battlePass';
import { ObjectiveType } from '@/types/dailyObjectives';
import { CURRENT_VERSION } from '@/types/changelog';
import type { CatFarmState } from './useCatFarmState';

const MOOD_LABELS = {
  morning: '🌅 Morning',
  afternoon: '☀️ Afternoon', 
  evening: '🌆 Evening',
  night: '🌙 Night',
  celebration: '🎉 Celebration',
  tense: '⚡ Tense',
};

export { MOOD_LABELS };

/**
 * Dependencies required by useCatFarmHandlers
 */
interface HandlerDependencies {
  farmState: CatFarmState;
}

/**
 * Consolidated handlers hook for CatFarm component
 * 
 * @param deps - Dependencies from useCatFarmState
 * @returns All event handlers needed by CatFarm
 * 
 * @example
 * ```tsx
 * const farmState = useCatFarmState();
 * const handlers = useCatFarmHandlers({ farmState });
 * ```
 */
export function useCatFarmHandlers({ farmState }: HandlerDependencies) {
  const {
    sound,
    confetti,
    haptics,
    auth,
    state,
    actions,
    kittensBreed,
    relationshipSystem,
    message,
    cloudSave,
    leaderboard,
    profile,
    dailyRewards,
    gifts,
    trading,
    milestones,
    objectives,
    luckyWheel,
    legacy,
    battlePass,
    coopChallenges,
    ui,
  } = farmState;

  const { playSound } = sound;
  const { fireConfetti, fireCelebration } = confetti;
  const { vibrateAchievement } = haptics;

  // Play sound when receiving gift
  useEffect(() => {
    if (gifts.newGiftAlert) {
      playSound?.('giftReceived');
    }
  }, [gifts.newGiftAlert, playSound]);

  // Play sound when receiving trade
  useEffect(() => {
    if (trading.newTradeAlert) {
      playSound?.('tradeReceived');
    }
  }, [trading.newTradeAlert, playSound]);

  // Handle accepting gift from popup
  const handleAcceptGiftFromPopup = useCallback(async (giftId: string) => {
    const cat = await gifts.acceptGift(giftId);
    if (cat) {
      actions.addReceivedCat?.(cat);
      playSound?.('success');
      fireConfetti();
    }
    gifts.clearNewGift();
  }, [gifts, actions, playSound, fireConfetti]);

  const handleDeclineGiftFromPopup = useCallback(async (giftId: string) => {
    await gifts.declineGift(giftId);
    gifts.clearNewGift();
  }, [gifts]);

  // Handle accepting trade from popup
  const handleAcceptTradeFromPopup = useCallback(async (tradeId: string) => {
    const trade = await trading.acceptTrade(tradeId);
    if (trade) {
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
    trading.clearNewTrade();
  }, [trading, actions, playSound, fireConfetti]);

  const handleDeclineTradeFromPopup = useCallback(async (tradeId: string) => {
    await trading.declineTrade(tradeId);
    trading.clearNewTrade();
  }, [trading]);

  // Handle claiming daily reward
  const handleClaimDailyReward = useCallback(async () => {
    const reward = await dailyRewards.claimDailyReward();
    if (reward) {
      actions.addReward?.(reward.coins, reward.resources as Resources);
      if (reward.unlockedCostumes) {
        for (const costumeId of reward.unlockedCostumes) {
          if (!state.ownedCostumes.includes(costumeId)) {
            actions.buyCostume?.(costumeId);
          }
        }
      }
    }
  }, [dailyRewards, actions, state.ownedCostumes]);

  // Check milestones when stats change
  useEffect(() => {
    const milestone = milestones.checkMilestones({
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
  }, [state.totalMoneyEarned, state.totalShowWins, state.cats.length, state.day, kittensBreed, milestones, playSound, vibrateAchievement]);

  // Handle claiming milestone reward
  const handleClaimMilestone = useCallback(() => {
    const coins = milestones.claimMilestone();
    if (coins > 0) {
      actions.addReward?.(coins, {});
      playSound?.('coin');
    }
  }, [milestones, actions, playSound]);

  // Handle claiming daily objectives bonus
  const handleClaimObjectivesBonus = useCallback(() => {
    const coins = objectives.claimBonus();
    if (coins > 0) {
      actions.addReward?.(coins, {});
      playSound?.('coin');
      fireConfetti();
    }
  }, [objectives, actions, playSound, fireConfetti]);

  // Handle claiming lucky wheel prize
  const handleClaimWheelPrize = useCallback((prize: typeof luckyWheel.lastPrize) => {
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
    const legacyResult = legacy.retireCat(cat, state.day);
    if (legacyResult) {
      actions.sellCat(cat.id);
      playSound?.('achievement');
      fireConfetti();
      fireCelebration();
    }
  }, [legacy, state.day, actions, playSound, fireConfetti, fireCelebration]);

  // Wrapper for actions that update objectives
  const trackObjective = useCallback((type: ObjectiveType, amount: number = 1) => {
    objectives.updateProgress(type, amount);
  }, [objectives]);

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
    actions.addReward?.(-500, {});
    playSound?.('success');
    fireConfetti();
  }, [actions, playSound, fireConfetti]);

  // Centralized game event dispatcher
  const { dispatchAction } = useGameEvents({
    actions,
    trackObjective,
    addBattlePassXP: battlePass.addXP,
    updateCoopProgress: coopChallenges.updateProgress,
  });

  // Quick Socialize
  const handleQuickSocialize = useCallback((cat1Id: string, cat2Id: string) => {
    ui.setQuickSocializePair({ cat1Id, cat2Id });
    ui.setSideTab('social');
    playSound?.('click');
  }, [ui, playSound]);

  const clearQuickSocializePair = useCallback(() => {
    ui.setQuickSocializePair(null);
  }, [ui]);

  // Handle coop challenge reward claiming
  const handleClaimCoopReward = useCallback(async (challengeId: string) => {
    const result = await coopChallenges.claimReward(challengeId);
    if (result) {
      const totalReward = result.coins + result.bonus;
      actions.addReward?.(totalReward, {});
      fireConfetti();
    }
    return result;
  }, [coopChallenges, actions, fireConfetti]);

  // Load cloud save on login
  useEffect(() => {
    if (auth.user && !ui.hasLoadedCloud) {
      cloudSave.cloudLoad().then(({ data }) => {
        if (data) {
          actions.loadFromData?.(data.game_state, data.kittens_bred, data.relationships);
          ui.setLastCloudSave(data.last_played_at);
        }
        ui.setHasLoadedCloud(true);
      });
    }
  }, [auth.user, ui.hasLoadedCloud, cloudSave, actions, ui]);

  // Auto-save to cloud every 5 minutes
  useEffect(() => {
    if (!auth.user) return;
    
    const interval = setInterval(async () => {
      ui.setCloudSyncing(true);
      const result = await cloudSave.cloudSave(state, kittensBreed, relationshipSystem.getRelationshipSaveData());
      if (result.success) {
        ui.setLastCloudSave(new Date().toISOString());
      }
      ui.setCloudSyncing(false);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [auth.user, state, kittensBreed, relationshipSystem, cloudSave, ui]);

  const handleCloudSave = useCallback(async () => {
    if (!auth.user) return;
    ui.setCloudSyncing(true);
    const result = await cloudSave.cloudSave(state, kittensBreed, relationshipSystem.getRelationshipSaveData());
    if (result.success) {
      ui.setLastCloudSave(new Date().toISOString());
      await leaderboard.syncPlayerStats(state, kittensBreed, profile.profile?.display_name || undefined, profile.profile?.avatar_emoji || undefined);
      playSound?.('success');
    }
    ui.setCloudSyncing(false);
  }, [auth.user, state, kittensBreed, relationshipSystem, cloudSave, leaderboard, profile, playSound, ui]);

  const handleCloudLoad = useCallback(async () => {
    if (!auth.user) return;
    const { data } = await cloudSave.cloudLoad();
    if (data) {
      actions.loadFromData?.(data.game_state, data.kittens_bred, data.relationships);
      ui.setLastCloudSave(data.last_played_at);
      playSound?.('success');
    }
  }, [auth.user, cloudSave, actions, playSound, ui]);

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
    onTabChange: ui.setSideTab,
  });

  // Listen for ? key to show shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '?' && !(e.target instanceof HTMLInputElement)) {
        ui.setShowShortcutsHelp(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [ui]);

  // Update music mood when day changes
  useEffect(() => {
    if (ui.musicOn) {
      sound.updateMusicForDay(state.day);
      ui.setCurrentMoodLabel(MOOD_LABELS[sound.getCurrentMood()]);
    }
  }, [state.day, ui.musicOn, sound, ui]);

  // Fire confetti on achievements
  useEffect(() => {
    const unlockedCount = state.achievements.filter(a => a.unlocked).length;
    if (unlockedCount > ui.lastAchievementCount && ui.lastAchievementCount > 0) {
      confetti.fireStars();
      if (ui.musicOn) {
        sound.triggerCelebration();
        ui.setCurrentMoodLabel(MOOD_LABELS.celebration);
        setTimeout(() => ui.setCurrentMoodLabel(MOOD_LABELS[sound.getCurrentMood()]), 10000);
      }
    }
    ui.setLastAchievementCount(unlockedCount);
  }, [state.achievements, ui, confetti, sound]);

  // Fire confetti on show wins
  useEffect(() => {
    if (message?.includes('wins!') && message?.includes('Cat show')) {
      fireCelebration();
      if (ui.musicOn) {
        sound.triggerCelebration();
        ui.setCurrentMoodLabel(MOOD_LABELS.celebration);
        setTimeout(() => ui.setCurrentMoodLabel(MOOD_LABELS[sound.getCurrentMood()]), 10000);
      }
    }
  }, [message, fireCelebration, ui, sound]);

  // Trigger tense mood on negative events
  useEffect(() => {
    if (ui.musicOn && (message?.includes('fight') || message?.includes('sick') || message?.includes('ran away') || message?.includes('passed away'))) {
      sound.triggerTense();
      ui.setCurrentMoodLabel(MOOD_LABELS.tense);
      setTimeout(() => ui.setCurrentMoodLabel(MOOD_LABELS[sound.getCurrentMood()]), 6000);
    }
  }, [message, ui.musicOn, sound, ui]);

  // Check for What's New popup on mount
  useEffect(() => {
    const lastSeenVersion = localStorage.getItem('cat-farm-last-seen-version');
    const tutorialComplete = localStorage.getItem('cat-farm-tutorial-complete');
    
    if (tutorialComplete && lastSeenVersion !== CURRENT_VERSION) {
      const timer = setTimeout(() => ui.setShowWhatsNew(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [ui]);

  const toggleSound = useCallback(() => {
    const newState = !ui.soundOn;
    ui.setSoundOn(newState);
    sound.setEnabled(newState);
    if (newState) playSound('click');
  }, [ui, sound, playSound]);

  const toggleMusic = useCallback(() => {
    if (ui.musicOn) {
      sound.stopMusic();
      ui.setMusicOn(false);
      ui.setCurrentMoodLabel('');
    } else {
      sound.startMusic();
      ui.setMusicOn(true);
      sound.updateMusicForDay(state.day);
      ui.setCurrentMoodLabel(MOOD_LABELS[sound.getCurrentMood()]);
      playSound('click');
    }
  }, [ui, sound, state.day, playSound]);

  const handleSfxVolumeChange = useCallback((value: number[]) => {
    const vol = value[0];
    ui.setSfxVolume(vol);
    sound.setVolume(vol / 100);
  }, [ui, sound]);

  const handleMusicVolumeChange = useCallback((value: number[]) => {
    const vol = value[0];
    ui.setMusicVolume(vol);
    sound.setMusicVolume((vol / 100) * 0.3);
  }, [ui, sound]);

  return {
    // Gift/Trade popup handlers
    handleAcceptGiftFromPopup,
    handleDeclineGiftFromPopup,
    handleAcceptTradeFromPopup,
    handleDeclineTradeFromPopup,
    
    // Reward handlers
    handleClaimDailyReward,
    handleClaimMilestone,
    handleClaimObjectivesBonus,
    handleClaimWheelPrize,
    handleClaimBPReward,
    handleUpgradePremium,
    handleClaimCoopReward,
    handleRetireCat,
    
    // Game event dispatcher (centralized action handler)
    dispatchAction,
    
    // Social handlers
    handleQuickSocialize,
    clearQuickSocializePair,
    
    // Cloud handlers
    handleCloudSave,
    handleCloudLoad,
    
    // Audio handlers
    toggleSound,
    toggleMusic,
    handleSfxVolumeChange,
    handleMusicVolumeChange,
  };
}

export type CatFarmHandlers = ReturnType<typeof useCatFarmHandlers>;
