/**
 * @fileoverview useWeeklyChallenges - Weekly challenge tracking system
 *
 * Manages weekly challenges including progress tracking, reward claiming,
 * and real-time updates via Supabase subscriptions. Integrates with the
 * challenge achievements system for meta-progression.
 *
 * Features:
 * - Automatic progress tracking for various challenge types
 * - Real-time updates when progress changes
 * - Reward claiming with coins and badges
 * - Time remaining display for active challenges
 * - Sound effects and haptic feedback for progress/completion
 * - Integration with challenge achievement streaks
 *
 * @module hooks/useWeeklyChallenges
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useChallengeAchievements } from '@/hooks/useChallengeAchievements';
import { logPlayerActivity } from '@/hooks/usePlayerActivityLog';
import type {
  ChallengeWithProgress,
  ChallengeType,
  WeeklyChallenge,
  PlayerChallengeProgress,
} from '@/types/challenges';
import type { SoundType } from '@/contexts/SoundContext';

/**
 * Haptic feedback functions for challenge events
 */
interface HapticFunctions {
  /** Vibrate on progress increment */
  vibrateProgress: () => void;
  /** Vibrate on challenge completion */
  vibrateComplete: () => void;
  /** Vibrate on achievement unlock */
  vibrateAchievement: () => void;
}

/**
 * Return type for claimed rewards
 */
interface ClaimResult {
  /** Coins earned from the challenge */
  coins: number;
  /** Badge name earned (if any) */
  badge: string | null;
}

/**
 * Return type for the useWeeklyChallenges hook
 */
export interface WeeklyChallengesReturn {
  /** Array of active challenges with progress data */
  challenges: ChallengeWithProgress[];
  /** Loading state for initial fetch */
  loading: boolean;
  /** Update progress for a challenge type */
  updateProgress: (type: ChallengeType, increment?: number) => Promise<void>;
  /** Claim reward for a completed challenge */
  claimReward: (challengeId: string) => Promise<ClaimResult | false>;
  /** Get formatted time remaining string */
  getTimeRemaining: () => string | null;
  /** Refetch challenges from database */
  refetch: () => Promise<void>;
  /** Last progress update (for animations) */
  lastProgressUpdate: { type: ChallengeType; value: number } | null;
  /** Clear the last progress update */
  clearProgressUpdate: () => void;
  /** Total challenges completed all-time */
  totalChallengesCompleted: number;
  /** Current weekly challenge streak */
  currentStreak: number;
  /** Longest streak ever achieved */
  longestStreak: number;
}

/**
 * Hook for managing weekly challenges and their progress.
 *
 * Fetches active challenges on mount and sets up real-time subscriptions
 * for progress updates. Provides methods to update progress and claim rewards.
 *
 * @param userId - The current user's ID (undefined if not logged in)
 * @param playSound - Optional function to play sound effects
 * @param fireChallengeBurst - Optional function to trigger confetti animation
 * @param haptics - Optional haptic feedback functions
 * @returns Challenge data and management functions
 *
 * @example
 * ```tsx
 * const {
 *   challenges,
 *   updateProgress,
 *   claimReward,
 *   getTimeRemaining
 * } = useWeeklyChallenges(userId, playSound, fireConfetti, haptics);
 *
 * // Update progress when player wins a show
 * await updateProgress('show_wins', 1);
 *
 * // Display challenges with progress
 * challenges.map(c => (
 *   <ChallengeCard
 *     key={c.id}
 *     challenge={c}
 *     onClaim={() => claimReward(c.id)}
 *   />
 * ));
 * ```
 */
export function useWeeklyChallenges(
  userId: string | undefined,
  playSound?: (type: SoundType) => void,
  fireChallengeBurst?: () => void,
  haptics?: HapticFunctions
): WeeklyChallengesReturn {
  const [challenges, setChallenges] = useState<ChallengeWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastProgressUpdate, setLastProgressUpdate] = useState<{
    type: ChallengeType;
    value: number;
  } | null>(null);

  const { totalChallengesCompleted, currentStreak, longestStreak, incrementCompleted } =
    useChallengeAchievements(userId, playSound, haptics?.vibrateAchievement);

  /**
   * Fetch active challenges and user progress from database.
   * Combines challenge definitions with user-specific progress records.
   */
  const fetchChallenges = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch active challenges
      const { data: activeChallenges, error: challengesError } = await supabase
        .from('weekly_challenges')
        .select('*')
        .eq('is_active', true)
        .gte('ends_at', new Date().toISOString())
        .lte('starts_at', new Date().toISOString());

      if (challengesError) throw challengesError;

      if (!activeChallenges || activeChallenges.length === 0) {
        setChallenges([]);
        setLoading(false);
        return;
      }

      // Fetch user's progress
      const { data: progressData, error: progressError } = await supabase
        .from('player_challenge_progress')
        .select('*')
        .eq('user_id', userId)
        .in(
          'challenge_id',
          activeChallenges.map((c) => c.id)
        );

      if (progressError) throw progressError;

      // Combine challenges with progress
      const progressMap = new Map(progressData?.map((p) => [p.challenge_id, p]) || []);

      const challengesWithProgress: ChallengeWithProgress[] = activeChallenges.map((challenge) => ({
        ...challenge,
        difficulty: challenge.difficulty as ChallengeWithProgress['difficulty'],
        challenge_type: challenge.challenge_type as ChallengeType,
        progress: progressMap.get(challenge.id) as PlayerChallengeProgress | undefined,
      }));

      setChallenges(challengesWithProgress);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  // Real-time subscription for progress updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('challenge-progress')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_challenge_progress',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchChallenges();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchChallenges]);

  /**
   * Update progress for challenges of a specific type.
   *
   * Finds all active challenges matching the type and increments their progress.
   * Triggers completion effects if the challenge target is reached.
   * Logs activity and triggers sounds/haptics appropriately.
   *
   * @param challengeType - The type of challenge to update (e.g., 'show_wins')
   * @param increment - Amount to add to progress (default: 1)
   */
  const updateProgress = useCallback(
    async (challengeType: ChallengeType, increment: number = 1) => {
      if (!userId) return;

      // Find matching active challenges
      const matchingChallenges = challenges.filter(
        (c) => c.challenge_type === challengeType && !c.progress?.completed
      );

      let progressMade = false;

      for (const challenge of matchingChallenges) {
        const currentProgress = challenge.progress?.current_progress || 0;
        const newProgress = currentProgress + increment;
        const isCompleted = newProgress >= challenge.target_value;

        if (challenge.progress) {
          // Update existing progress
          const { error } = await supabase
            .from('player_challenge_progress')
            .update({
              current_progress: newProgress,
              completed: isCompleted,
              completed_at: isCompleted ? new Date().toISOString() : null,
            })
            .eq('id', challenge.progress.id);

          if (error) {
            console.error('Error updating progress:', error);
            continue;
          }
          progressMade = true;
        } else {
          // Create new progress record
          const { error } = await supabase.from('player_challenge_progress').insert({
            user_id: userId,
            challenge_id: challenge.id,
            current_progress: newProgress,
            completed: isCompleted,
            completed_at: isCompleted ? new Date().toISOString() : null,
          });

          if (error) {
            console.error('Error creating progress:', error);
            continue;
          }
          progressMade = true;
        }

        if (isCompleted) {
          // Log challenge completed activity (non-blocking)
          if (userId) {
            logPlayerActivity(userId, {
              activityType: 'challenge_completed',
              activityDescription: `Completed "${challenge.name}" challenge`,
              metadata: {
                challenge_name: challenge.name,
                challenge_type: challenge.challenge_type,
                reward_coins: challenge.reward_coins,
                reward_badge: challenge.reward_badge,
              },
            });
          }

          playSound?.('challengeComplete');
          fireChallengeBurst?.();
          haptics?.vibrateComplete();
          toast({
            title: `${challenge.emoji} Challenge Complete!`,
            description: `You completed "${challenge.name}"! Claim your reward!`,
          });
        }
      }

      // Trigger animation and sound if progress was made
      if (progressMade) {
        playSound?.('challengeProgress');
        haptics?.vibrateProgress();
        setLastProgressUpdate({ type: challengeType, value: increment });
      }

      // Refresh challenges
      fetchChallenges();
    },
    [userId, challenges, fetchChallenges]
  );

  /**
   * Claim the reward for a completed challenge.
   *
   * Marks the challenge as claimed and increments the player's challenge
   * completion count for achievement tracking. Triggers coin sound on success.
   *
   * @param challengeId - ID of the challenge to claim
   * @returns Claimed rewards (coins + optional badge) or false on failure
   */
  const claimReward = useCallback(
    async (challengeId: string): Promise<ClaimResult | false> => {
      if (!userId) return false;

      const challenge = challenges.find((c) => c.id === challengeId);
      if (!challenge || !challenge.progress?.completed || challenge.progress.reward_claimed) {
        return false;
      }

      const { error } = await supabase
        .from('player_challenge_progress')
        .update({ reward_claimed: true })
        .eq('id', challenge.progress.id);

      if (error) {
        console.error('Error claiming reward:', error);
        toast({
          title: 'Error',
          description: 'Failed to claim reward. Please try again.',
          variant: 'destructive',
        });
        return false;
      }

      // Increment challenge completion count for achievements
      await incrementCompleted();

      playSound?.('coin');
      toast({
        title: `${challenge.emoji} Reward Claimed!`,
        description: `You earned ${challenge.reward_coins} coins${challenge.reward_badge ? ` and the "${challenge.reward_badge}" badge` : ''}!`,
      });

      fetchChallenges();
      return { coins: challenge.reward_coins, badge: challenge.reward_badge };
    },
    [userId, challenges, fetchChallenges, incrementCompleted, playSound]
  );

  /**
   * Get a human-readable string for time remaining on current challenges.
   *
   * @returns Formatted string like "2d 5h remaining" or null if no active challenges
   */
  const getTimeRemaining = useCallback((): string | null => {
    if (challenges.length === 0) return null;

    const endDate = new Date(challenges[0].ends_at);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();

    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    }
    return `${hours}h remaining`;
  }, [challenges]);

  return {
    challenges,
    loading,
    updateProgress,
    claimReward,
    getTimeRemaining,
    refetch: fetchChallenges,
    lastProgressUpdate,
    clearProgressUpdate: () => setLastProgressUpdate(null),
    totalChallengesCompleted,
    currentStreak,
    longestStreak,
  };
}
