/**
 * @fileoverview Reward claiming handlers for CatFarm
 * 
 * Handles all reward-related callbacks including daily rewards,
 * milestones, objectives, wheel prizes, and battle pass rewards.
 * 
 * @module hooks/handlers/useRewardHandlers
 */

import { useCallback, useEffect } from 'react';
import { Resources, Cat } from '@/types/game';
import { BattlePassReward } from '@/types/battlePass';
import type { CatFarmState } from '../useCatFarmState';

interface RewardHandlersDeps {
  farmState: CatFarmState;
}

/**
 * Hook providing all reward-related handlers
 */
export function useRewardHandlers({ farmState }: RewardHandlersDeps) {
  const {
    sound,
    confetti,
    haptics,
    state,
    actions,
    kittensBreed,
    dailyRewards,
    milestones,
    objectives,
    luckyWheel,
    legacy,
    battlePass,
    coopChallenges,
  } = farmState;

  const { playSound } = sound;
  const { fireConfetti, fireCelebration } = confetti;
  const { vibrateAchievement } = haptics;

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
  }, [
    state.totalMoneyEarned,
    state.totalShowWins,
    state.cats.length,
    state.day,
    kittensBreed,
    milestones,
    playSound,
    vibrateAchievement,
  ]);

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
  const handleClaimWheelPrize = useCallback(
    (prize: typeof luckyWheel.lastPrize) => {
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
    },
    [actions, playSound, fireConfetti]
  );

  // Handle retiring a cat to Hall of Fame
  const handleRetireCat = useCallback(
    (cat: Cat) => {
      const legacyResult = legacy.retireCat(cat, state.day);
      if (legacyResult) {
        actions.sellCat(cat.id);
        playSound?.('achievement');
        fireConfetti();
        fireCelebration();
      }
    },
    [legacy, state.day, actions, playSound, fireConfetti, fireCelebration]
  );

  // Handle claiming battle pass rewards
  const handleClaimBPReward = useCallback(
    (reward: BattlePassReward) => {
      const coins =
        typeof reward.value === 'number' && reward.type === 'coins'
          ? reward.value
          : 0;
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
    },
    [actions, state.ownedCostumes, playSound, fireConfetti]
  );

  // Handle upgrading to premium pass
  const handleUpgradePremium = useCallback(() => {
    actions.addReward?.(-500, {});
    playSound?.('success');
    fireConfetti();
  }, [actions, playSound, fireConfetti]);

  // Handle coop challenge reward claiming
  const handleClaimCoopReward = useCallback(
    async (challengeId: string) => {
      const result = await coopChallenges.claimReward(challengeId);
      if (result) {
        const totalReward = result.coins + result.bonus;
        actions.addReward?.(totalReward, {});
        fireConfetti();
      }
      return result;
    },
    [coopChallenges, actions, fireConfetti]
  );

  return {
    handleClaimDailyReward,
    handleClaimMilestone,
    handleClaimObjectivesBonus,
    handleClaimWheelPrize,
    handleRetireCat,
    handleClaimBPReward,
    handleUpgradePremium,
    handleClaimCoopReward,
  };
}
