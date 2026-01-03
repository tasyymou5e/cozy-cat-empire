import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface LogActivityParams {
  activityType: 'login' | 'logout' | 'trade_created' | 'trade_completed' | 'gift_sent' | 'gift_received' | 'cat_bred' | 'show_win' | 'challenge_completed' | 'purchase';
  activityDescription: string;
  metadata?: Json;
}

// Standalone function for use outside React context (e.g., AuthContext)
export async function logPlayerActivity(
  userId: string,
  params: LogActivityParams
): Promise<void> {
  try {
    await supabase.from('player_activity_log').insert([{
      user_id: userId,
      activity_type: params.activityType,
      activity_description: params.activityDescription,
      metadata: (params.metadata || {}) as Json
    }]);
  } catch (error) {
    // Fail silently - don't interrupt game flow
    console.error('Failed to log activity:', error);
  }
}

// Hook for use within React components
export function usePlayerActivityLog(userId: string | undefined) {
  const logActivity = useCallback(async (params: LogActivityParams): Promise<void> => {
    if (!userId) return;
    
    // Non-blocking - don't await in game actions
    logPlayerActivity(userId, params).catch(() => {
      // Already handled in logPlayerActivity
    });
  }, [userId]);

  return { logActivity };
}
