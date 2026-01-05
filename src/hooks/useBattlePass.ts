import { useState, useCallback, useEffect } from 'react';
import {
  PlayerBattlePass,
  BattlePassReward,
  CURRENT_SEASON,
  BATTLE_PASS_REWARDS,
  XP_SOURCES,
  XPSource,
  calculateTier,
  getXPProgress,
  getTierRewards,
} from '@/types/battlePass';

const STORAGE_KEY = 'cat-farm-battle-pass';

function loadBattlePass(): PlayerBattlePass {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Reset if it's a different season
      if (parsed.seasonId !== CURRENT_SEASON.id) {
        return createNewBattlePass();
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load battle pass:', e);
  }
  return createNewBattlePass();
}

function createNewBattlePass(): PlayerBattlePass {
  return {
    seasonId: CURRENT_SEASON.id,
    currentXP: 0,
    currentTier: 1,
    isPremium: false,
    claimedRewards: [],
  };
}

export function useBattlePass() {
  const [battlePass, setBattlePass] = useState<PlayerBattlePass>(loadBattlePass);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(battlePass));
  }, [battlePass]);

  const addXP = useCallback((source: XPSource, multiplier: number = 1) => {
    const baseXP = XP_SOURCES[source];
    const xpGained = Math.floor(baseXP * multiplier);
    
    setBattlePass(prev => {
      const newXP = prev.currentXP + xpGained;
      const newTier = calculateTier(newXP, CURRENT_SEASON.xpPerTier);
      
      return {
        ...prev,
        currentXP: newXP,
        currentTier: newTier,
      };
    });
    
    return xpGained;
  }, []);

  const claimReward = useCallback((rewardId: string): BattlePassReward | null => {
    const reward = BATTLE_PASS_REWARDS.find(r => r.id === rewardId);
    if (!reward) return null;
    
    // Check if already claimed
    if (battlePass.claimedRewards.includes(rewardId)) return null;
    
    // Check if tier is reached
    if (reward.tier > battlePass.currentTier) return null;
    
    // Check if premium reward requires premium pass
    if (reward.isPremium && !battlePass.isPremium) return null;
    
    setBattlePass(prev => ({
      ...prev,
      claimedRewards: [...prev.claimedRewards, rewardId],
    }));
    
    return reward;
  }, [battlePass.claimedRewards, battlePass.currentTier, battlePass.isPremium]);

  const upgradeToPremium = useCallback(() => {
    setBattlePass(prev => ({
      ...prev,
      isPremium: true,
      purchasedAt: new Date().toISOString(),
    }));
  }, []);

  const canClaimReward = useCallback((rewardId: string): boolean => {
    const reward = BATTLE_PASS_REWARDS.find(r => r.id === rewardId);
    if (!reward) return false;
    if (battlePass.claimedRewards.includes(rewardId)) return false;
    if (reward.tier > battlePass.currentTier) return false;
    if (reward.isPremium && !battlePass.isPremium) return false;
    return true;
  }, [battlePass.claimedRewards, battlePass.currentTier, battlePass.isPremium]);

  const getUnclaimedRewards = useCallback((): BattlePassReward[] => {
    return BATTLE_PASS_REWARDS.filter(reward => {
      if (battlePass.claimedRewards.includes(reward.id)) return false;
      if (reward.tier > battlePass.currentTier) return false;
      if (reward.isPremium && !battlePass.isPremium) return false;
      return true;
    });
  }, [battlePass.claimedRewards, battlePass.currentTier, battlePass.isPremium]);

  const xpProgress = getXPProgress(battlePass.currentXP, CURRENT_SEASON.xpPerTier);

  return {
    battlePass,
    season: CURRENT_SEASON,
    xpProgress,
    addXP,
    claimReward,
    upgradeToPremium,
    canClaimReward,
    getUnclaimedRewards,
    getTierRewards,
    allRewards: BATTLE_PASS_REWARDS,
  };
}
