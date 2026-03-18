import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LeaderboardCategory } from './useGlobalLeaderboard';

import { createLogger } from '@/lib/logger';

const logger = createLogger('usePlayerStats');

export interface PlayerStats {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_emoji: string;
  total_show_wins: number;
  total_cats_owned: number;
  total_kittens_bred: number;
  total_money_earned: number;
  achievements_unlocked: number;
  highest_cat_grade: number;
  last_updated: string;
}

export interface CategoryRank {
  category: LeaderboardCategory;
  rank: number;
  score: number;
  percentile?: number;
}

export interface RewardStats {
  totalRewardsClaimed: number;
  totalCoinsEarned: number;
  badges: string[];
}

export function usePlayerStats(userId: string | undefined) {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [categoryRanks, setCategoryRanks] = useState<CategoryRank[]>([]);
  const [rewardStats, setRewardStats] = useState<RewardStats>({
    totalRewardsClaimed: 0,
    totalCoinsEarned: 0,
    badges: [],
  });
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // Fetch player stats
      const { data: statsData, error: statsError } = await supabase
        .from('player_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (statsError && statsError.code !== 'PGRST116') throw statsError;

      if (statsData) {
        setStats(statsData as PlayerStats);

        // Fetch ranks for each category
        const categories: LeaderboardCategory[] = [
          'wins',
          'cats',
          'breeding',
          'wealth',
          'achievements',
        ];
        const categoryColumns: Record<LeaderboardCategory, string> = {
          wins: 'total_show_wins',
          cats: 'total_cats_owned',
          breeding: 'total_kittens_bred',
          wealth: 'total_money_earned',
          achievements: 'achievements_unlocked',
        };

        const rankPromises = categories.map(async (cat) => {
          const column = categoryColumns[cat];
          const userScore = (statsData as Record<string, unknown>)[column] as number;

          // Count how many players have a higher score
          const { count } = await supabase
            .from('player_stats')
            .select('*', { count: 'exact', head: true })
            .gt(column, userScore);

          const rank = (count || 0) + 1;

          // Get total player count for percentile
          const { count: totalCount } = await supabase
            .from('player_stats')
            .select('*', { count: 'exact', head: true });

          const percentile = totalCount
            ? Math.round(((totalCount - rank + 1) / totalCount) * 100)
            : 0;

          return {
            category: cat,
            rank,
            score: userScore,
            percentile,
          };
        });

        const ranks = await Promise.all(rankPromises);
        setCategoryRanks(ranks);
      }

      // Fetch reward stats
      const { data: rewardsData } = await supabase
        .from('leaderboard_rewards')
        .select('*')
        .eq('user_id', userId)
        .eq('claimed', true);

      if (rewardsData) {
        const totalCoins = rewardsData.reduce((sum, r) => sum + (r.reward_coins || 0), 0);
        const badges = [
          ...new Set(rewardsData.map((r) => r.reward_badge).filter(Boolean)),
        ] as string[];

        setRewardStats({
          totalRewardsClaimed: rewardsData.length,
          totalCoinsEarned: totalCoins,
          badges,
        });
      }
    } catch (error) {
      logger.error('Error fetching player stats:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Realtime subscription for stats updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`player-stats-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_stats',
          filter: `user_id=eq.${userId}`,
        },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchStats]);

  return {
    stats,
    categoryRanks,
    rewardStats,
    loading,
    fetchStats,
  };
}
