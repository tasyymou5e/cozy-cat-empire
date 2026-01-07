/**
 * @fileoverview useMilestones - Player milestone and title system
 *
 * Tracks player progress toward major game milestones and awards
 * titles and coin bonuses upon reaching thresholds. Syncs between
 * local storage and cloud for persistence.
 *
 * Features:
 * - Multiple milestone categories (wealth, shows, cats, breeding, days)
 * - Title unlocks that persist on player profile
 * - Coin bonuses for reaching milestones
 * - Celebration popups with claim button
 * - Local + cloud sync for reliability
 *
 * @module hooks/useMilestones
 */

import { useState, useEffect, useCallback } from 'react';
import { Milestone, MILESTONES, getMilestoneProgress } from '@/types/milestones';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Stats required for milestone progress checking
 */
interface MilestoneStats {
  /** Total money earned across all time */
  totalMoneyEarned: number;
  /** Total cat show wins */
  totalShowWins: number;
  /** Current number of cats owned */
  catsOwned: number;
  /** Current in-game day number */
  day: number;
  /** Total kittens bred across all time */
  kittensBred: number;
}

/**
 * Return type for the useMilestones hook
 */
export interface UseMilestonesReturn {
  /** Array of milestone IDs that have been unlocked */
  unlockedMilestones: string[];
  /** Milestone awaiting claim (shown in celebration popup) */
  pendingCelebration: Milestone | null;
  /** Current player title (from highest unlocked title milestone) */
  playerTitle: string | null;
  /** Check stats against milestones, returns newly unlocked milestone if any */
  checkMilestones: (stats: MilestoneStats) => Milestone | null;
  /** Claim the pending milestone, returns coin reward amount */
  claimMilestone: () => number;
  /** Dismiss the celebration popup without claiming */
  dismissCelebration: () => void;
}

/** Local storage key for unlocked milestones */
const STORAGE_KEY = 'cat-farm-milestones';
/** Local storage key for player title */
const TITLE_KEY = 'cat-farm-player-title';

/**
 * Hook for tracking and awarding player milestones.
 *
 * Checks player stats against milestone thresholds and triggers
 * celebration popups when new milestones are unlocked. Persists
 * progress to both local storage and cloud (when logged in).
 *
 * @returns Milestone state and management functions
 *
 * @example
 * ```tsx
 * const {
 *   unlockedMilestones,
 *   pendingCelebration,
 *   playerTitle,
 *   checkMilestones,
 *   claimMilestone
 * } = useMilestones();
 *
 * // Check for new milestones after state changes
 * useEffect(() => {
 *   const newMilestone = checkMilestones({
 *     totalMoneyEarned: state.totalMoneyEarned,
 *     totalShowWins: state.totalShowWins,
 *     catsOwned: state.cats.length,
 *     day: state.day,
 *     kittensBred: kittensBreed
 *   });
 *
 *   if (newMilestone) {
 *     playSound('achievement');
 *     fireConfetti();
 *   }
 * }, [state]);
 *
 * // Handle claim button click
 * const handleClaim = () => {
 *   const coins = claimMilestone();
 *   addMoney(coins);
 * };
 * ```
 */
export function useMilestones(): UseMilestonesReturn {
  const { user } = useAuth();

  const [unlockedMilestones, setUnlockedMilestones] = useState<string[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [playerTitle, setPlayerTitle] = useState<string | null>(() => {
    return localStorage.getItem(TITLE_KEY);
  });

  const [pendingCelebration, setPendingCelebration] = useState<Milestone | null>(null);
  const [cloudLoaded, setCloudLoaded] = useState(false);

  // Load from cloud on mount
  useEffect(() => {
    if (!user?.id || cloudLoaded) return;

    const loadFromCloud = async () => {
      const { data } = await supabase
        .from('player_progress')
        .select('unlocked_milestones, player_title')
        .eq('user_id', user.id)
        .single();

      if (data) {
        const cloudMilestones = data.unlocked_milestones || [];
        const cloudTitle = data.player_title;

        // Merge with local (cloud wins for conflicts)
        const merged = [...new Set([...unlockedMilestones, ...cloudMilestones])];
        setUnlockedMilestones(merged);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

        if (cloudTitle) {
          setPlayerTitle(cloudTitle);
          localStorage.setItem(TITLE_KEY, cloudTitle);
        }
      }
      setCloudLoaded(true);
    };

    loadFromCloud();
  }, [user?.id, cloudLoaded]);

  // Sync to cloud when data changes
  useEffect(() => {
    if (!user?.id || !cloudLoaded) return;

    const syncToCloud = async () => {
      await supabase.from('player_progress').upsert(
        {
          user_id: user.id,
          unlocked_milestones: unlockedMilestones,
          player_title: playerTitle,
        },
        { onConflict: 'user_id' }
      );
    };

    syncToCloud();
  }, [user?.id, unlockedMilestones, playerTitle, cloudLoaded]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unlockedMilestones));
  }, [unlockedMilestones]);

  useEffect(() => {
    if (playerTitle) {
      localStorage.setItem(TITLE_KEY, playerTitle);
    }
  }, [playerTitle]);

  /**
   * Check player stats against all milestones and trigger celebration
   * for any newly unlocked milestones.
   *
   * @param stats - Current player statistics
   * @returns The newly unlocked milestone, or null if none
   */
  const checkMilestones = useCallback(
    (stats: MilestoneStats): Milestone | null => {
      for (const milestone of MILESTONES) {
        if (unlockedMilestones.includes(milestone.id)) continue;

        const progress = getMilestoneProgress(milestone, stats);
        if (progress >= milestone.threshold) {
          setPendingCelebration(milestone);
          return milestone;
        }
      }
      return null;
    },
    [unlockedMilestones]
  );

  /**
   * Claim the pending milestone reward.
   *
   * Adds the milestone to unlocked list, sets player title if applicable,
   * and clears the pending celebration state.
   *
   * @returns Coin reward amount (0 if no pending milestone)
   */
  const claimMilestone = useCallback((): number => {
    if (!pendingCelebration) return 0;

    const milestone = pendingCelebration;

    setUnlockedMilestones((prev) => [...prev, milestone.id]);

    if (milestone.reward.title) {
      setPlayerTitle(milestone.reward.title);
    }

    setPendingCelebration(null);

    return milestone.reward.coins || 0;
  }, [pendingCelebration]);

  /**
   * Dismiss the celebration popup without claiming.
   * The milestone can still be claimed later.
   */
  const dismissCelebration = useCallback(() => {
    setPendingCelebration(null);
  }, []);

  return {
    unlockedMilestones,
    pendingCelebration,
    playerTitle,
    checkMilestones,
    claimMilestone,
    dismissCelebration,
  };
}
