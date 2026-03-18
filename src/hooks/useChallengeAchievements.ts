import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { SoundType } from '@/contexts/SoundContext';

import { createLogger } from '@/lib/logger';

const logger = createLogger('useChallengeAchievements');

/**
 * Challenge completion statistics
 */
interface ChallengeStats {
  totalCompleted: number;
  currentStreak: number;
  longestStreak: number;
  loading: boolean;
}

/** Milestones for challenge completion achievements */
const ACHIEVEMENT_MILESTONES = [5, 10, 25];
/** Milestones for challenge streak achievements */
const STREAK_MILESTONES = [3, 5, 10];

/**
 * Hook for tracking challenge completion achievements and streaks
 *
 * Tracks total challenges completed and weekly completion streaks.
 * Triggers achievements and toasts when milestones are reached.
 *
 * @param userId - The current user's ID
 * @param playSound - Function to play achievement sound
 * @param vibrateAchievement - Function to trigger haptic feedback
 * @returns Challenge stats and increment function
 *
 * @example
 * ```tsx
 * const { totalChallengesCompleted, currentStreak, incrementCompleted } = useChallengeAchievements(userId);
 *
 * // Increment when a challenge is completed
 * await incrementCompleted();
 * ```
 */
export function useChallengeAchievements(
  userId: string | undefined,
  playSound?: (type: SoundType) => void,
  vibrateAchievement?: () => void
) {
  const [stats, setStats] = useState<ChallengeStats>({
    totalCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
    loading: true,
  });

  const fetchStats = useCallback(async () => {
    if (!userId) {
      setStats({ totalCompleted: 0, currentStreak: 0, longestStreak: 0, loading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('player_challenge_stats')
        .select('total_challenges_completed, current_streak, longest_streak')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      setStats({
        totalCompleted: data?.total_challenges_completed || 0,
        currentStreak: data?.current_streak || 0,
        longestStreak: data?.longest_streak || 0,
        loading: false,
      });
    } catch (error) {
      logger.error('Error fetching challenge stats:', error);
      setStats({ totalCompleted: 0, currentStreak: 0, longestStreak: 0, loading: false });
    }
  }, [userId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const incrementCompleted = useCallback(async () => {
    if (!userId) return;

    try {
      // Get existing stats including streak data
      const { data: existing } = await supabase
        .from('player_challenge_stats')
        .select(
          'id, total_challenges_completed, current_streak, longest_streak, last_week_completed'
        )
        .eq('user_id', userId)
        .maybeSingle();

      const previousTotal = existing?.total_challenges_completed || 0;
      const newTotal = previousTotal + 1;

      // Streak logic
      const now = new Date();
      const lastWeek = existing?.last_week_completed
        ? new Date(existing.last_week_completed)
        : null;

      // Check if this is a consecutive week (within 14 days of last completion)
      let newStreak = 1;
      if (lastWeek) {
        const daysSinceLast = Math.floor(
          (now.getTime() - lastWeek.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceLast <= 14) {
          newStreak = (existing?.current_streak || 0) + 1;
        }
      }

      const longestStreak = Math.max(newStreak, existing?.longest_streak || 0);

      if (existing) {
        await supabase
          .from('player_challenge_stats')
          .update({
            total_challenges_completed: newTotal,
            current_streak: newStreak,
            longest_streak: longestStreak,
            last_week_completed: now.toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabase.from('player_challenge_stats').insert({
          user_id: userId,
          total_challenges_completed: 1,
          current_streak: 1,
          longest_streak: 1,
          last_week_completed: now.toISOString(),
        });
      }

      // Check if challenge count milestone reached
      if (ACHIEVEMENT_MILESTONES.includes(newTotal)) {
        playSound?.('achievement');
        vibrateAchievement?.();
      }

      // Check if streak milestone reached
      if (STREAK_MILESTONES.includes(newStreak)) {
        playSound?.('achievement');
        vibrateAchievement?.();
        toast({
          title: `🔥 ${newStreak} Week Streak!`,
          description: `Amazing dedication! You've completed challenges for ${newStreak} weeks in a row!`,
        });
      }

      // Refresh stats
      fetchStats();
    } catch (error) {
      logger.error('Error incrementing challenge stats:', error);
    }
  }, [userId, fetchStats, playSound, vibrateAchievement]);

  return {
    totalChallengesCompleted: stats.totalCompleted,
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    loading: stats.loading,
    incrementCompleted,
    refetch: fetchStats,
  };
}
