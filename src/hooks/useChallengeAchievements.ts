import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { SoundType } from '@/hooks/useSoundEffects';

interface ChallengeStats {
  totalCompleted: number;
  loading: boolean;
}

const ACHIEVEMENT_MILESTONES = [5, 10, 25];

export function useChallengeAchievements(userId: string | undefined, playSound?: (type: SoundType) => void) {
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

      const previousTotal = existing?.total_challenges_completed || 0;
      const newTotal = previousTotal + 1;

      if (existing) {
        await supabase
          .from('player_challenge_stats')
          .update({ 
            total_challenges_completed: newTotal 
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

      // Check if milestone reached and play achievement sound
      if (ACHIEVEMENT_MILESTONES.includes(newTotal)) {
        playSound?.('achievement');
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
