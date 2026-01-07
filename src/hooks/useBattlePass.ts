import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

function loadLocalBattlePass(): PlayerBattlePass {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
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

export function useBattlePass(userId?: string) {
  const [battlePass, setBattlePass] = useState<PlayerBattlePass>(loadLocalBattlePass);
  const [loading, setLoading] = useState(false);

  // Load from cloud when user is authenticated
  useEffect(() => {
    if (!userId) return;

    const loadFromCloud = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('battle_pass_progress')
          .select('*')
          .eq('user_id', userId)
          .eq('season_id', CURRENT_SEASON.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading battle pass:', error);
          return;
        }

        if (data) {
          setBattlePass({
            seasonId: data.season_id,
            currentXP: data.current_xp ?? 0,
            currentTier: data.current_tier ?? 1,
            isPremium: data.is_premium ?? false,
            claimedRewards: data.claimed_rewards || [],
            purchasedAt: data.purchased_at || undefined,
          });
        } else {
          // No cloud data for this season, create new or migrate local
          const localPass = loadLocalBattlePass();
          await supabase.from('battle_pass_progress').insert({
            user_id: userId,
            season_id: CURRENT_SEASON.id,
            current_xp: localPass.currentXP,
            current_tier: localPass.currentTier,
            is_premium: localPass.isPremium,
            claimed_rewards: localPass.claimedRewards,
          });
          setBattlePass(localPass);
        }
      } catch (e) {
        console.error('Failed to load battle pass from cloud:', e);
      } finally {
        setLoading(false);
      }
    };

    loadFromCloud();
  }, [userId]);

  // Save to localStorage (always) and cloud (if logged in)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(battlePass));

    if (userId) {
      const syncToCloud = async () => {
        await supabase.from('battle_pass_progress').upsert(
          {
            user_id: userId,
            season_id: battlePass.seasonId,
            current_xp: battlePass.currentXP,
            current_tier: battlePass.currentTier,
            is_premium: battlePass.isPremium,
            claimed_rewards: battlePass.claimedRewards,
            purchased_at: battlePass.purchasedAt || null,
          },
          {
            onConflict: 'user_id,season_id',
          }
        );
      };
      syncToCloud();
    }
  }, [battlePass, userId]);

  const addXP = useCallback((source: XPSource, multiplier: number = 1) => {
    const baseXP = XP_SOURCES[source];
    const xpGained = Math.floor(baseXP * multiplier);

    setBattlePass((prev) => {
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

  const claimReward = useCallback(
    (rewardId: string): BattlePassReward | null => {
      const reward = BATTLE_PASS_REWARDS.find((r) => r.id === rewardId);
      if (!reward) return null;

      if (battlePass.claimedRewards.includes(rewardId)) return null;
      if (reward.tier > battlePass.currentTier) return null;
      if (reward.isPremium && !battlePass.isPremium) return null;

      setBattlePass((prev) => ({
        ...prev,
        claimedRewards: [...prev.claimedRewards, rewardId],
      }));

      return reward;
    },
    [battlePass.claimedRewards, battlePass.currentTier, battlePass.isPremium]
  );

  const upgradeToPremium = useCallback(() => {
    setBattlePass((prev) => ({
      ...prev,
      isPremium: true,
      purchasedAt: new Date().toISOString(),
    }));
  }, []);

  const canClaimReward = useCallback(
    (rewardId: string): boolean => {
      const reward = BATTLE_PASS_REWARDS.find((r) => r.id === rewardId);
      if (!reward) return false;
      if (battlePass.claimedRewards.includes(rewardId)) return false;
      if (reward.tier > battlePass.currentTier) return false;
      if (reward.isPremium && !battlePass.isPremium) return false;
      return true;
    },
    [battlePass.claimedRewards, battlePass.currentTier, battlePass.isPremium]
  );

  const getUnclaimedRewards = useCallback((): BattlePassReward[] => {
    return BATTLE_PASS_REWARDS.filter((reward) => {
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
    loading,
  };
}
