/**
 * @fileoverview useDailyLoginRewards - Daily login reward system
 *
 * @module hooks/useDailyLoginRewards
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  LoginData,
  DailyReward,
  getRewardForDay,
  STREAK_MILESTONES,
  getVIPTier,
  VIPTier,
  VIP_TIERS,
} from '@/types/dailyRewards';
import { Resources } from '@/types/game';
import { useToast } from '@/hooks/use-toast';
import { useBroadcastSync, SYNC_MESSAGES } from './useBroadcastSync';
import { createLogger } from '@/lib/logger';
import { handleAsyncError } from '@/lib/errorHandling';

const log = createLogger('DailyLogin');

/** Sound effect types used by this hook */
type SoundType = 'click' | 'success' | 'coin' | 'achievement' | 'levelUp';

/**
 * Return type for the claimDailyReward function
 */
interface ClaimRewardResult {
  /** Total coins earned (includes VIP and milestone bonuses) */
  coins: number;
  /** Resources earned (may be multiplied by VIP tier) */
  resources: Partial<Resources>;
  /** VIP costume IDs unlocked at current streak level */
  unlockedCostumes?: string[];
}

/**
 * Return type for the useDailyLoginRewards hook
 */
export interface DailyLoginRewardsReturn {
  loginData: LoginData | null;
  todayReward: DailyReward | null;
  canClaim: boolean;
  loading: boolean;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  claimDailyReward: () => Promise<ClaimRewardResult | null>;
  currentStreak: number;
  longestStreak: number;
  totalLogins: number;
  vipTier: VIPTier | null;
  isVIP: boolean;
}

export function useDailyLoginRewards(
  userId: string | undefined,
  playSound?: (type: SoundType) => void,
  vibrateAchievement?: () => void,
  fireConfetti?: () => void
): DailyLoginRewardsReturn {
  const [loginData, setLoginData] = useState<LoginData | null>(null);
  const [todayReward, setTodayReward] = useState<DailyReward | null>(null);
  const [canClaim, setCanClaim] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();

  // Cross-tab sync for daily rewards
  const { broadcast } = useBroadcastSync<{ claimed: boolean }>('daily-rewards-sync', (msg) => {
    if (msg.type === SYNC_MESSAGES.DAILY_REWARD_CLAIMED) {
      setCanClaim(false);
      setShowModal(false);
    }
  });

  const getToday = () => new Date().toISOString().split('T')[0];

  const getYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  };

  const checkLoginStatus = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const today = getToday();
      const yesterday = getYesterday();

      const { data: existing, error } = await supabase
        .from('daily_login_rewards')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!existing) {
        const { data: newRecord, error: insertError } = await supabase
          .from('daily_login_rewards')
          .insert({
            user_id: userId,
            last_login_date: today,
            current_streak: 1,
            longest_streak: 1,
            total_logins: 1,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        const reward = getRewardForDay(1);
        setLoginData(newRecord as LoginData);
        setTodayReward(reward);
        setCanClaim(true);
        setShowModal(true);
      } else {
        const lastLogin = existing.last_login_date;

        if (lastLogin === today) {
          const reward = getRewardForDay(existing.current_streak);
          setLoginData(existing as LoginData);
          setTodayReward(reward);
          setCanClaim(existing.last_claimed_date !== today);
          if (existing.last_claimed_date !== today) {
            setShowModal(true);
          }
        } else if (lastLogin === yesterday) {
          const newStreak = existing.current_streak + 1;
          const longestStreak = Math.max(newStreak, existing.longest_streak);

          const { data: updated, error: updateError } = await supabase
            .from('daily_login_rewards')
            .update({
              last_login_date: today,
              current_streak: newStreak,
              longest_streak: longestStreak,
              total_logins: existing.total_logins + 1,
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (updateError) throw updateError;

          const reward = getRewardForDay(newStreak);
          setLoginData(updated as LoginData);
          setTodayReward(reward);
          setCanClaim(true);
          setShowModal(true);

          const oldVipTier = getVIPTier(existing.current_streak);
          const newVipTier = getVIPTier(newStreak);

          if (newVipTier && (!oldVipTier || newVipTier.minStreak > oldVipTier.minStreak)) {
            playSound?.('achievement');
            fireConfetti?.();
            toast({
              title: `${newVipTier.emoji} ${newVipTier.name} Unlocked!`,
              description: `You've reached VIP status! Enjoy ${Math.round((newVipTier.coinMultiplier - 1) * 100)}% bonus coins!`,
            });
          } else {
            toast({
              title: `🔥 ${newStreak} Day Streak!`,
              description: 'Welcome back! Your login streak continues!',
            });
          }
        } else {
          const { data: updated, error: updateError } = await supabase
            .from('daily_login_rewards')
            .update({
              last_login_date: today,
              current_streak: 1,
              total_logins: existing.total_logins + 1,
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (updateError) throw updateError;

          const reward = getRewardForDay(1);
          setLoginData(updated as LoginData);
          setTodayReward(reward);
          setCanClaim(true);
          setShowModal(true);

          toast({
            title: '🌟 New Streak Started!',
            description: 'Your previous streak ended. Start a new one today!',
          });
        }
      }
    } catch (err) {
      handleAsyncError(err, {
        source: 'useDailyLoginRewards',
        operation: 'checkLoginStatus',
        userId,
      }, 'Error checking login status');
    } finally {
      setLoading(false);
    }
  }, [userId, toast, playSound, fireConfetti]);

  useEffect(() => {
    checkLoginStatus();
  }, [checkLoginStatus]);

  const getUnlockedVIPCostumes = useCallback((streak: number): string[] => {
    const unlocked: string[] = [];
    for (const tier of VIP_TIERS) {
      if (streak >= tier.minStreak) {
        unlocked.push(...tier.exclusiveRewards);
      }
    }
    return unlocked;
  }, []);

  // Phase 4: Mutex to prevent double-claiming
  const isClaimingRef = useRef(false);

  const claimDailyReward = useCallback(async (): Promise<{
    coins: number;
    resources: Partial<Resources>;
    unlockedCostumes?: string[];
  } | null> => {
    if (isClaimingRef.current) return null;
    if (!userId || !loginData || !todayReward || !canClaim) return null;

    isClaimingRef.current = true;
    setCanClaim(false);

    try {
      const today = getToday();

      const { error } = await supabase
        .from('daily_login_rewards')
        .update({ last_claimed_date: today })
        .eq('id', loginData.id);

      if (error) throw error;

      playSound?.('coin');
      fireConfetti?.();
      vibrateAchievement?.();

      const vipTier = getVIPTier(loginData.current_streak);
      let totalCoins = todayReward.coins;
      let enhancedResources: Partial<Resources> = { ...todayReward.resources };

      if (vipTier) {
        totalCoins = Math.floor(totalCoins * vipTier.coinMultiplier);

        for (const [key, value] of Object.entries(enhancedResources)) {
          if (typeof value === 'number') {
            enhancedResources[key as keyof Resources] = Math.floor(
              value * vipTier.resourceMultiplier
            );
          }
        }

        toast({
          title: `${vipTier.emoji} ${vipTier.name} Bonus!`,
          description: `Your VIP status gives you ${Math.round((vipTier.coinMultiplier - 1) * 100)}% extra rewards!`,
        });
      }

      const milestone = STREAK_MILESTONES[loginData.current_streak];
      if (milestone) {
        totalCoins += milestone.bonusCoins;
        playSound?.('achievement');
        toast({
          title: `${milestone.emoji} ${milestone.label}`,
          description: `Bonus: +${milestone.bonusCoins} coins for your dedication!`,
        });
      }

      setCanClaim(false);
      setShowModal(false);
      setLoginData((prev) => (prev ? { ...prev, last_claimed_date: today } : null));

      broadcast({ type: SYNC_MESSAGES.DAILY_REWARD_CLAIMED, payload: { claimed: true } });

      toast({
        title: '🎁 Daily Reward Claimed!',
        description: `+${totalCoins} coins${todayReward.resources ? ' + bonus resources!' : ''}`,
      });

      const unlockedCostumes = getUnlockedVIPCostumes(loginData.current_streak);

      return {
        coins: totalCoins,
        resources: enhancedResources,
        unlockedCostumes: unlockedCostumes.length > 0 ? unlockedCostumes : undefined,
      };
    } catch (err) {
      handleAsyncError(err, {
        source: 'useDailyLoginRewards',
        operation: 'claimDailyReward',
        userId,
      }, 'Failed to claim reward');
      setCanClaim(true);
      toast({
        title: 'Error',
        description: 'Failed to claim reward. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      isClaimingRef.current = false;
    }
  }, [
    userId,
    loginData,
    todayReward,
    canClaim,
    playSound,
    fireConfetti,
    vibrateAchievement,
    toast,
    getUnlockedVIPCostumes,
  ]);

  const vipTier = getVIPTier(loginData?.current_streak || 0);
  const isVIP = !!vipTier;

  return {
    loginData,
    todayReward,
    canClaim,
    loading,
    showModal,
    setShowModal,
    claimDailyReward,
    currentStreak: loginData?.current_streak || 0,
    longestStreak: loginData?.longest_streak || 0,
    totalLogins: loginData?.total_logins || 0,
    vipTier,
    isVIP,
  };
}
