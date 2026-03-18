/**
 * @fileoverview useBadges - Hook for badge unlocking and profile showcase
 *
 * Manages player badges, display selection, and profile frames.
 *
 * @module hooks/useBadges
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Badge,
  PlayerBadge,
  ProfileFrame,
  ALL_BADGES,
  PROFILE_FRAMES,
  getBadgeById,
  getAvailableFrames,
  getBestFrame,
  MAX_DISPLAYED_BADGES,
} from '@/types/badges';

import { createLogger } from '@/lib/logger';

const logger = createLogger('useBadges');

export interface UseBadgesReturn {
  /** All badges with unlock status */
  badges: Badge[];
  /** Just the unlocked badges */
  unlockedBadges: Badge[];
  /** Currently displayed badge IDs (max 3) */
  displayedBadgeIds: string[];
  /** Loading state */
  loading: boolean;
  /** Current profile frame */
  currentFrame: ProfileFrame;
  /** Available frames based on badge count */
  availableFrames: ProfileFrame[];
  /** Unlock a badge by ID */
  unlockBadge: (badgeId: string) => Promise<boolean>;
  /** Set which badges to display (max 3) */
  setDisplayedBadges: (badgeIds: string[]) => Promise<boolean>;
  /** Set profile frame */
  setProfileFrame: (frameId: string) => Promise<boolean>;
  /** Check if a specific badge is unlocked */
  isBadgeUnlocked: (badgeId: string) => boolean;
  /** Total badge count */
  totalBadges: number;
  /** Unlocked badge count */
  unlockedCount: number;
}

/**
 * Hook for managing player badges and profile showcase
 *
 * @param userId - Current user ID
 * @returns Badge management functions and state
 */
export function useBadges(userId?: string): UseBadgesReturn {
  const [playerBadges, setPlayerBadges] = useState<PlayerBadge[]>([]);
  const [displayedBadgeIds, setDisplayedBadgeIdsState] = useState<string[]>([]);
  const [currentFrameId, setCurrentFrameId] = useState<string>('default');
  const [loading, setLoading] = useState(true);

  // Fetch player badges
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchBadges = async () => {
      try {
        // Fetch from player_badges table
        const { data, error } = await supabase
          .from('player_badges')
          .select('*')
          .eq('user_id', userId);

        if (error) throw error;

        const badges = (data || []).map((row) => ({
          id: row.id,
          userId: row.user_id,
          badgeId: row.badge_id,
          unlockedAt: row.unlocked_at,
          isDisplayed: row.is_displayed || false,
        }));

        setPlayerBadges(badges);
        setDisplayedBadgeIdsState(badges.filter((b) => b.isDisplayed).map((b) => b.badgeId));

        // Fetch profile frame from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('profile_frame, display_badges')
          .eq('id', userId)
          .single();

        if (profile?.profile_frame) {
          setCurrentFrameId(profile.profile_frame);
        }
        if (profile?.display_badges) {
          setDisplayedBadgeIdsState(profile.display_badges);
        }
      } catch (err) {
        logger.error('Error fetching badges:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [userId]);

  // Merge badge definitions with unlock status
  const badges = ALL_BADGES.map((badge) => {
    const playerBadge = playerBadges.find((pb) => pb.badgeId === badge.id);
    return {
      ...badge,
      unlockedAt: playerBadge?.unlockedAt,
    };
  });

  const unlockedBadges = badges.filter((b) => b.unlockedAt);
  const unlockedCount = unlockedBadges.length;

  const availableFrames = getAvailableFrames(unlockedCount);
  const currentFrame = PROFILE_FRAMES.find((f) => f.id === currentFrameId) || getBestFrame(unlockedCount);

  const unlockBadge = useCallback(
    async (badgeId: string): Promise<boolean> => {
      if (!userId) return false;

      const badge = getBadgeById(badgeId);
      if (!badge) return false;

      // Check if already unlocked
      if (playerBadges.some((pb) => pb.badgeId === badgeId)) {
        return true;
      }

      try {
        const { error } = await supabase.from('player_badges').insert({
          user_id: userId,
          badge_id: badgeId,
          unlocked_at: new Date().toISOString(),
          is_displayed: false,
        });

        if (error) throw error;

        setPlayerBadges((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            userId,
            badgeId,
            unlockedAt: new Date().toISOString(),
            isDisplayed: false,
          },
        ]);

        return true;
      } catch (err) {
        logger.error('Error unlocking badge:', err);
        return false;
      }
    },
    [userId, playerBadges]
  );

  const setDisplayedBadges = useCallback(
    async (badgeIds: string[]): Promise<boolean> => {
      if (!userId) return false;

      // Limit to max displayed
      const limitedIds = badgeIds.slice(0, MAX_DISPLAYED_BADGES);

      try {
        // Update profiles table with display_badges
        const { error } = await supabase
          .from('profiles')
          .update({ display_badges: limitedIds })
          .eq('id', userId);

        if (error) throw error;

        setDisplayedBadgeIdsState(limitedIds);
        return true;
      } catch (err) {
        logger.error('Error setting displayed badges:', err);
        return false;
      }
    },
    [userId]
  );

  const setProfileFrame = useCallback(
    async (frameId: string): Promise<boolean> => {
      if (!userId) return false;

      // Check if frame is available
      if (!availableFrames.some((f) => f.id === frameId)) {
        return false;
      }

      try {
        const { error } = await supabase
          .from('profiles')
          .update({ profile_frame: frameId })
          .eq('id', userId);

        if (error) throw error;

        setCurrentFrameId(frameId);
        return true;
      } catch (err) {
        logger.error('Error setting profile frame:', err);
        return false;
      }
    },
    [userId, availableFrames]
  );

  const isBadgeUnlocked = useCallback(
    (badgeId: string): boolean => {
      return playerBadges.some((pb) => pb.badgeId === badgeId);
    },
    [playerBadges]
  );

  return {
    badges,
    unlockedBadges,
    displayedBadgeIds,
    loading,
    currentFrame,
    availableFrames,
    unlockBadge,
    setDisplayedBadges,
    setProfileFrame,
    isBadgeUnlocked,
    totalBadges: ALL_BADGES.length,
    unlockedCount,
  };
}
