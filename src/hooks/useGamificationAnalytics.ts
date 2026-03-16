/**
 * @fileoverview Gamification analytics tracking hook
 *
 * Logs gamification engagement events to player_activity_log
 * for data-driven iteration on game mechanics.
 *
 * @module hooks/useGamificationAnalytics
 */

import { useCallback } from 'react';
import { usePlayerActivityLog } from '@/hooks/usePlayerActivityLog';
import type { Json } from '@/integrations/supabase/types';

export type GamificationFeature =
  | 'lucky_wheel'
  | 'daily_reward'
  | 'milestone'
  | 'daily_objective'
  | 'battle_pass'
  | 'coop_challenge'
  | 'achievement'
  | 'hall_of_fame'
  | 'specialization'
  | 'prestige'
  | 'collection'
  | 'welcome_back'
  | 'tab_unlock'
  | 'club';

export type GamificationAction =
  | 'view'
  | 'claim'
  | 'spin'
  | 'complete'
  | 'unlock'
  | 'share'
  | 'upgrade'
  | 'retire'
  | 'specialize';

export interface UseGamificationAnalyticsReturn {
  trackGamification: (
    feature: GamificationFeature,
    action: GamificationAction,
    metadata?: Record<string, unknown>
  ) => void;
}

export function useGamificationAnalytics(userId: string | undefined): UseGamificationAnalyticsReturn {
  const { logActivity } = usePlayerActivityLog(userId);

  const trackGamification = useCallback(
    (
      feature: GamificationFeature,
      action: GamificationAction,
      metadata?: Record<string, unknown>
    ) => {
      logActivity({
        activityType: 'challenge_completed', // reuse existing type for gamification events
        activityDescription: `gamification:${feature}:${action}`,
        metadata: {
          gamification: true,
          feature,
          action,
          ...metadata,
        } as Json,
      });
    },
    [logActivity]
  );

  return { trackGamification };
}
