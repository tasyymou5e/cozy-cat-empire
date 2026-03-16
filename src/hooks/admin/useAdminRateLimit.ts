/**
 * @fileoverview Admin rate limiting hook
 *
 * Provides rate limiting for sensitive admin actions to prevent abuse.
 * Tracks action counts within time windows and enforces limits.
 *
 * @module hooks/admin/useAdminRateLimit
 */

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { createLogger } from '@/lib/logger';

interface RateLimitConfig {
  actionType: string;
  limit: number;
  windowHours: number;
}

/**
 * Rate limit configurations for different admin actions
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  user_delete: { actionType: 'user_delete', limit: 5, windowHours: 1 },
  bulk_role_change: { actionType: 'bulk_role_change', limit: 3, windowHours: 1 },
  player_inventory_edit: { actionType: 'player_inventory_edit', limit: 10, windowHours: 1 },
  mass_notification: { actionType: 'mass_notification', limit: 2, windowHours: 1 },
  bulk_suspend: { actionType: 'bulk_suspend', limit: 3, windowHours: 1 },
};

/**
 * Hook to enforce rate limits on admin actions
 *
 * @returns Rate limit checking and recording functions
 *
 * @example
 * ```tsx
 * const { enforceRateLimit } = useAdminRateLimit();
 * const allowed = await enforceRateLimit('user_delete');
 * if (!allowed) return;
 * // Proceed with deletion
 * ```
 */
export function useAdminRateLimit() {
  const { user } = useAuth();
  const { toast } = useToast();

  const checkRateLimit = async (
    actionType: string
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: Date | null;
  }> => {
    if (!user) return { allowed: false, remaining: 0, resetAt: null };

    const config = RATE_LIMITS[actionType];
    if (!config) {
      // No rate limit configured for this action
      return { allowed: true, remaining: Infinity, resetAt: null };
    }

    try {
      const { data, error } = await supabase
        .from('admin_rate_limits')
        .select('*')
        .eq('admin_user_id', user.id)
        .eq('action_type', actionType)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned (which is fine)
        console.error('Rate limit check error:', error);
        return { allowed: true, remaining: config.limit, resetAt: null };
      }

      if (!data) {
        // No record exists, user hasn't performed this action recently
        return { allowed: true, remaining: config.limit, resetAt: null };
      }

      const windowStart = new Date(data.window_start);
      const windowEnd = new Date(windowStart.getTime() + config.windowHours * 60 * 60 * 1000);
      const now = new Date();

      if (now > windowEnd) {
        // Window has expired, reset is allowed
        return { allowed: true, remaining: config.limit, resetAt: null };
      }

      // Within window, check count
      const remaining = config.limit - data.action_count;
      return {
        allowed: remaining > 0,
        remaining: Math.max(0, remaining),
        resetAt: windowEnd,
      };
    } catch (err) {
      console.error('Rate limit check error:', err);
      return { allowed: true, remaining: config.limit, resetAt: null };
    }
  };

  const recordAction = async (actionType: string): Promise<boolean> => {
    if (!user) return false;

    const config = RATE_LIMITS[actionType];
    if (!config) return true; // No rate limit for this action

    try {
      const { data: existing } = await supabase
        .from('admin_rate_limits')
        .select('*')
        .eq('admin_user_id', user.id)
        .eq('action_type', actionType)
        .single();

      const now = new Date();

      if (existing) {
        const windowStart = new Date(existing.window_start);
        const windowEnd = new Date(windowStart.getTime() + config.windowHours * 60 * 60 * 1000);

        if (now > windowEnd) {
          // Reset window
          await supabase
            .from('admin_rate_limits')
            .update({
              action_count: 1,
              window_start: now.toISOString(),
            })
            .eq('id', existing.id);
        } else {
          // Increment count
          await supabase
            .from('admin_rate_limits')
            .update({
              action_count: existing.action_count + 1,
            })
            .eq('id', existing.id);
        }
      } else {
        // Create new record
        await supabase.from('admin_rate_limits').insert({
          admin_user_id: user.id,
          action_type: actionType,
          action_count: 1,
          window_start: now.toISOString(),
        });
      }

      return true;
    } catch (err) {
      console.error('Rate limit record error:', err);
      return false;
    }
  };

  const enforceRateLimit = async (actionType: string): Promise<boolean> => {
    const { allowed, resetAt } = await checkRateLimit(actionType);

    if (!allowed) {
      const resetTime = resetAt ? resetAt.toLocaleTimeString() : 'soon';
      toast({
        title: 'Rate limit exceeded',
        description: `You've reached the limit for this action. Try again after ${resetTime}.`,
        variant: 'destructive',
      });
      return false;
    }

    await recordAction(actionType);
    return true;
  };

  return { checkRateLimit, recordAction, enforceRateLimit };
}
