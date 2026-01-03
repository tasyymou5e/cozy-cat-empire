import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useChallengeAchievements } from '@/hooks/useChallengeAchievements';
import { logPlayerActivity } from '@/hooks/usePlayerActivityLog';
import type { ChallengeWithProgress, ChallengeType, WeeklyChallenge, PlayerChallengeProgress } from '@/types/challenges';
import type { SoundType } from '@/hooks/useSoundEffects';

interface HapticFunctions {
  vibrateProgress: () => void;
  vibrateComplete: () => void;
  vibrateAchievement: () => void;
}

export function useWeeklyChallenges(
  userId: string | undefined, 
  playSound?: (type: SoundType) => void,
  fireChallengeBurst?: () => void,
  haptics?: HapticFunctions
) {
  const [challenges, setChallenges] = useState<ChallengeWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastProgressUpdate, setLastProgressUpdate] = useState<{ type: ChallengeType; value: number } | null>(null);
  
  const { totalChallengesCompleted, currentStreak, longestStreak, incrementCompleted } = useChallengeAchievements(userId, playSound, haptics?.vibrateAchievement);

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
        .in('challenge_id', activeChallenges.map(c => c.id));

      if (progressError) throw progressError;

      // Combine challenges with progress
      const progressMap = new Map(progressData?.map(p => [p.challenge_id, p]) || []);
      
      const challengesWithProgress: ChallengeWithProgress[] = activeChallenges.map(challenge => ({
        ...challenge,
        difficulty: challenge.difficulty as ChallengeWithProgress['difficulty'],
        challenge_type: challenge.challenge_type as ChallengeType,
        progress: progressMap.get(challenge.id) as PlayerChallengeProgress | undefined
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
          filter: `user_id=eq.${userId}`
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

  const updateProgress = useCallback(async (
    challengeType: ChallengeType,
    increment: number = 1
  ) => {
    if (!userId) return;

    // Find matching active challenges
    const matchingChallenges = challenges.filter(
      c => c.challenge_type === challengeType && !c.progress?.completed
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
            completed_at: isCompleted ? new Date().toISOString() : null
          })
          .eq('id', challenge.progress.id);

        if (error) {
          console.error('Error updating progress:', error);
          continue;
        }
        progressMade = true;
      } else {
        // Create new progress record
        const { error } = await supabase
          .from('player_challenge_progress')
          .insert({
            user_id: userId,
            challenge_id: challenge.id,
            current_progress: newProgress,
            completed: isCompleted,
            completed_at: isCompleted ? new Date().toISOString() : null
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
              reward_badge: challenge.reward_badge
            }
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
  }, [userId, challenges, fetchChallenges]);

  const claimReward = useCallback(async (challengeId: string) => {
    if (!userId) return false;

    const challenge = challenges.find(c => c.id === challengeId);
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
        title: "Error",
        description: "Failed to claim reward. Please try again.",
        variant: "destructive"
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
  }, [userId, challenges, fetchChallenges, incrementCompleted, playSound]);

  const getTimeRemaining = useCallback(() => {
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
    longestStreak
  };
}
