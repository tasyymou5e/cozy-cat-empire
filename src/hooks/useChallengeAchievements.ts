import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ChallengeStats {
  totalCompleted: number;
  loading: boolean;
}

export function useChallengeAchievements(userId: string | undefined) {
  const [stats, setStats] = useState<ChallengeStats>({
    totalCompleted: 0,
    loading: true
  });

  const fetchStats = useCallback(async () => {
    if (!userId) {
      setStats({ totalCompleted: 0, loading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('player_challenge_stats')
        .select('total_challenges_completed')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      setStats({
        totalCompleted: data?.total_challenges_completed || 0,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching challenge stats:', error);
      setStats({ totalCompleted: 0, loading: false });
    }
  }, [userId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const incrementCompleted = useCallback(async () => {
    if (!userId) return;

    try {
      // Upsert the stats
      const { data: existing } = await supabase
        .from('player_challenge_stats')
        .select('id, total_challenges_completed')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('player_challenge_stats')
          .update({ 
            total_challenges_completed: existing.total_challenges_completed + 1 
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('player_challenge_stats')
          .insert({ 
            user_id: userId, 
            total_challenges_completed: 1 
          });
      }

      // Refresh stats
      fetchStats();
    } catch (error) {
      console.error('Error incrementing challenge stats:', error);
    }
  }, [userId, fetchStats]);

  return {
    totalChallengesCompleted: stats.totalCompleted,
    loading: stats.loading,
    incrementCompleted,
    refetch: fetchStats
  };
}
