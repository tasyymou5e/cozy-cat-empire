import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LeaderboardReward {
  id: string;
  user_id: string;
  period_type: 'daily' | 'weekly' | 'monthly';
  period_end: string;
  category: string;
  rank: number;
  reward_coins: number;
  reward_badge: string | null;
  claimed: boolean;
  claimed_at: string | null;
  created_at: string;
}

const REWARD_STRUCTURE = {
  daily: { 1: { coins: 100, badge: '👑' }, 2: { coins: 50, badge: '🥈' }, 3: { coins: 25, badge: '🥉' } },
  weekly: { 1: { coins: 500, badge: '👑' }, 2: { coins: 250, badge: '🥈' }, 3: { coins: 100, badge: '🥉' } },
  monthly: { 1: { coins: 2000, badge: '👑' }, 2: { coins: 1000, badge: '🥈' }, 3: { coins: 500, badge: '🥉' } },
};

export function useLeaderboardRewards(userId: string | undefined) {
  const [rewards, setRewards] = useState<LeaderboardReward[]>([]);
  const [loading, setLoading] = useState(false);
  const [unclaimedCount, setUnclaimedCount] = useState(0);

  const fetchRewards = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leaderboard_rewards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const typedData = (data || []) as LeaderboardReward[];
      setRewards(typedData);
      setUnclaimedCount(typedData.filter(r => !r.claimed).length);
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const claimReward = useCallback(async (rewardId: string) => {
    if (!userId) return { success: false };

    try {
      const { error } = await supabase
        .from('leaderboard_rewards')
        .update({ claimed: true, claimed_at: new Date().toISOString() })
        .eq('id', rewardId)
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      setRewards(prev => prev.map(r => 
        r.id === rewardId ? { ...r, claimed: true, claimed_at: new Date().toISOString() } : r
      ));
      setUnclaimedCount(prev => Math.max(0, prev - 1));

      return { success: true };
    } catch (error) {
      console.error('Error claiming reward:', error);
      return { success: false };
    }
  }, [userId]);

  const claimAllRewards = useCallback(async () => {
    if (!userId) return { success: false, totalCoins: 0 };

    const unclaimedRewards = rewards.filter(r => !r.claimed);
    if (unclaimedRewards.length === 0) return { success: true, totalCoins: 0 };

    try {
      const { error } = await supabase
        .from('leaderboard_rewards')
        .update({ claimed: true, claimed_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('claimed', false);

      if (error) throw error;

      const totalCoins = unclaimedRewards.reduce((sum, r) => sum + r.reward_coins, 0);

      // Update local state
      setRewards(prev => prev.map(r => 
        !r.claimed ? { ...r, claimed: true, claimed_at: new Date().toISOString() } : r
      ));
      setUnclaimedCount(0);

      return { success: true, totalCoins };
    } catch (error) {
      console.error('Error claiming all rewards:', error);
      return { success: false, totalCoins: 0 };
    }
  }, [userId, rewards]);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  // Real-time subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('leaderboard-rewards-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leaderboard_rewards',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchRewards();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchRewards]);

  return {
    rewards,
    loading,
    unclaimedCount,
    claimReward,
    claimAllRewards,
    fetchRewards,
    REWARD_STRUCTURE,
  };
}
