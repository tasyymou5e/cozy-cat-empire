import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LoginData, DailyReward, getRewardForDay, STREAK_MILESTONES } from '@/types/dailyRewards';
import { Resources } from '@/types/game';
import { useToast } from '@/hooks/use-toast';

type SoundType = 'click' | 'success' | 'coin' | 'achievement' | 'levelUp';

export function useDailyLoginRewards(
  userId: string | undefined,
  playSound?: (type: SoundType) => void,
  vibrateAchievement?: () => void,
  fireConfetti?: () => void
) {
  const [loginData, setLoginData] = useState<LoginData | null>(null);
  const [todayReward, setTodayReward] = useState<DailyReward | null>(null);
  const [canClaim, setCanClaim] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();

  const getToday = () => {
    return new Date().toISOString().split('T')[0];
  };

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

      // Fetch existing login data
      const { data: existing, error } = await supabase
        .from('daily_login_rewards')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!existing) {
        // First time login - create record
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
          // Already logged in today
          const reward = getRewardForDay(existing.current_streak);
          setLoginData(existing as LoginData);
          setTodayReward(reward);
          setCanClaim(existing.last_claimed_date !== today);
          if (existing.last_claimed_date !== today) {
            setShowModal(true);
          }
        } else if (lastLogin === yesterday) {
          // Continue streak
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
          
          // Show streak continuation toast
          toast({
            title: `🔥 ${newStreak} Day Streak!`,
            description: 'Welcome back! Your login streak continues!',
          });
        } else {
          // Streak broken - reset to 1
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
      console.error('Error checking login status:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    checkLoginStatus();
  }, [checkLoginStatus]);

  const claimDailyReward = useCallback(async (): Promise<{ coins: number; resources: Partial<Resources> } | null> => {
    if (!userId || !loginData || !todayReward || !canClaim) return null;

    try {
      const today = getToday();
      
      const { error } = await supabase
        .from('daily_login_rewards')
        .update({ last_claimed_date: today })
        .eq('id', loginData.id);

      if (error) throw error;

      // Play sounds and effects
      playSound?.('coin');
      fireConfetti?.();
      vibrateAchievement?.();

      let totalCoins = todayReward.coins;
      
      // Check for streak milestones
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
      setLoginData(prev => prev ? { ...prev, last_claimed_date: today } : null);

      toast({
        title: '🎁 Daily Reward Claimed!',
        description: `+${totalCoins} coins${todayReward.resources ? ' + bonus resources!' : ''}`,
      });

      return {
        coins: totalCoins,
        resources: todayReward.resources || {},
      };
    } catch (err) {
      console.error('Error claiming reward:', err);
      toast({
        title: 'Error',
        description: 'Failed to claim reward. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  }, [userId, loginData, todayReward, canClaim, playSound, fireConfetti, vibrateAchievement, toast]);

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
  };
}
