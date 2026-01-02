import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { ChallengeWithProgress, ChallengeType, WeeklyChallenge, PlayerChallengeProgress } from '@/types/challenges';

export function useWeeklyChallenges(userId: string | undefined) {
  const [challenges, setChallenges] = useState<ChallengeWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

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
      }

      if (isCompleted) {
        toast({
          title: `${challenge.emoji} Challenge Complete!`,
          description: `You completed "${challenge.name}"! Claim your reward!`,
        });
      }
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

    toast({
      title: `${challenge.emoji} Reward Claimed!`,
      description: `You earned ${challenge.reward_coins} coins${challenge.reward_badge ? ` and the "${challenge.reward_badge}" badge` : ''}!`,
    });

    fetchChallenges();
    return { coins: challenge.reward_coins, badge: challenge.reward_badge };
  }, [userId, challenges, fetchChallenges]);

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
    refetch: fetchChallenges
  };
}
