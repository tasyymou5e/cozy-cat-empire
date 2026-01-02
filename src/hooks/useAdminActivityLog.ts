import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Json } from '@/integrations/supabase/types';

interface LogActivityParams {
  actionType: string;
  actionDescription: string;
  targetUserId?: string;
  targetTable?: string;
  targetRecordId?: string;
  metadata?: Record<string, Json>;
}

export function useAdminActivityLog() {
  const { user } = useAuth();

  const logActivity = async ({
    actionType,
    actionDescription,
    targetUserId,
    targetTable,
    targetRecordId,
    metadata = {},
  }: LogActivityParams) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('admin_activity_log').insert([{
        admin_user_id: user.id,
        action_type: actionType,
        action_description: actionDescription,
        target_user_id: targetUserId,
        target_table: targetTable,
        target_record_id: targetRecordId,
        user_agent: navigator.userAgent,
        metadata: metadata as Json,
      }]);

      if (error) {
        console.error('Failed to log admin activity:', error);
      }
    } catch (err) {
      console.error('Error logging admin activity:', err);
    }
  };

  return { logActivity };
}

export async function logAuthAttempt(params: {
  email: string;
  attemptType: 'admin_login' | 'admin_login_failed' | 'access_denied';
  success: boolean;
  userId?: string;
  errorMessage?: string;
  metadata?: Record<string, Json>;
}) {
  try {
    const { error } = await supabase.from('auth_attempts_log').insert([{
      email: params.email,
      attempt_type: params.attemptType,
      success: params.success,
      user_id: params.userId,
      error_message: params.errorMessage,
      user_agent: navigator.userAgent,
      metadata: (params.metadata || {}) as Json,
    }]);

    if (error) {
      console.error('Failed to log auth attempt:', error);
    }
  } catch (err) {
    console.error('Error logging auth attempt:', err);
  }
}
