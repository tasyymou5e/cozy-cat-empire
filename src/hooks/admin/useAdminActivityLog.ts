/**
 * @fileoverview Admin activity logging hook
 *
 * Provides functionality to log admin actions and auth attempts
 * for audit trail and security monitoring. All admin actions should
 * be logged using this hook for accountability and debugging.
 *
 * @module hooks/admin/useAdminActivityLog
 */

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Json } from '@/integrations/supabase/types';

import { createLogger } from '@/lib/logger';

const logger = createLogger('useAdminActivityLog');

/**
 * Parameters for logging an admin activity
 *
 * @interface LogActivityParams
 * @property {string} actionType - Category of action (e.g., 'role_change', 'user_suspend', 'config_update')
 * @property {string} actionDescription - Human-readable description of what was done
 * @property {string} [targetUserId] - ID of the user affected by the action (if applicable)
 * @property {string} [targetTable] - Database table affected (if applicable)
 * @property {string} [targetRecordId] - Specific record ID affected (if applicable)
 * @property {Record<string, Json>} [metadata] - Additional context data for the action
 */
interface LogActivityParams {
  actionType: string;
  actionDescription: string;
  targetUserId?: string;
  targetTable?: string;
  targetRecordId?: string;
  metadata?: Record<string, Json>;
}

/**
 * Parameters for logging an authentication attempt
 *
 * @interface LogAuthAttemptParams
 * @property {string} email - Email address used in the attempt
 * @property {'admin_login' | 'admin_login_failed' | 'access_denied'} attemptType - Type of auth attempt
 * @property {boolean} success - Whether the attempt was successful
 * @property {string} [userId] - User ID if known
 * @property {string} [errorMessage] - Error message if attempt failed
 * @property {Record<string, Json>} [metadata] - Additional context data
 */
interface LogAuthAttemptParams {
  email: string;
  attemptType: 'admin_login' | 'admin_login_failed' | 'access_denied';
  success: boolean;
  userId?: string;
  errorMessage?: string;
  metadata?: Record<string, Json>;
}

/**
 * Hook to log admin activities for audit trail
 *
 * Provides a `logActivity` function that records admin actions to the
 * `admin_activity_log` table. This is essential for security auditing,
 * debugging issues, and maintaining accountability for admin operations.
 *
 * @returns {Object} Object containing the logActivity function
 *
 * @example
 * ```tsx
 * function UserManagement() {
 *   const { logActivity } = useAdminActivityLog();
 *
 *   const handleRoleChange = async (userId: string, newRole: string) => {
 *     await updateUserRole(userId, newRole);
 *
 *     await logActivity({
 *       actionType: 'role_change',
 *       actionDescription: `Changed user role to ${newRole}`,
 *       targetUserId: userId,
 *       metadata: { newRole, previousRole: 'user' }
 *     });
 *   };
 *
 *   return <RoleChangeUI onRoleChange={handleRoleChange} />;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Logging a user suspension
 * const { logActivity } = useAdminActivityLog();
 *
 * await logActivity({
 *   actionType: 'user_suspend',
 *   actionDescription: 'Suspended user for policy violation',
 *   targetUserId: suspendedUserId,
 *   metadata: {
 *     reason: 'Spam behavior',
 *     duration: '7 days'
 *   }
 * });
 * ```
 */
export function useAdminActivityLog() {
  const { user } = useAuth();

  /**
   * Logs an admin action to the activity log
   *
   * Records the action with the current admin's user ID, timestamp,
   * user agent, and any additional context provided.
   *
   * @param {LogActivityParams} params - Activity details to log
   * @returns {Promise<void>}
   */
  const logActivity = async ({
    actionType,
    actionDescription,
    targetUserId,
    targetTable,
    targetRecordId,
    metadata = {},
  }: LogActivityParams): Promise<void> => {
    if (!user) return;

    try {
      const { error } = await supabase.from('admin_activity_log').insert([
        {
          admin_user_id: user.id,
          action_type: actionType,
          action_description: actionDescription,
          target_user_id: targetUserId,
          target_table: targetTable,
          target_record_id: targetRecordId,
          user_agent: navigator.userAgent,
          metadata: metadata as Json,
        },
      ]);

      if (error) {
        logger.error('Failed to log admin activity:', error);
      }
    } catch (err) {
      logger.error('Error logging admin activity:', err);
    }
  };

  return {
    /** Function to log admin activities */
    logActivity,
  };
}

/**
 * Standalone function to log authentication attempts
 *
 * Can be used without the hook context (e.g., in auth pages before
 * a user is fully authenticated). Records login attempts, failures,
 * and access denied events for security monitoring.
 *
 * @param {LogAuthAttemptParams} params - Auth attempt details to log
 * @returns {Promise<void>}
 *
 * @example
 * ```tsx
 * // In AdminAuth.tsx login handler
 * const handleLogin = async (email: string, password: string) => {
 *   try {
 *     const { user } = await signIn(email, password);
 *
 *     await logAuthAttempt({
 *       email,
 *       attemptType: 'admin_login',
 *       success: true,
 *       userId: user.id
 *     });
 *   } catch (error) {
 *     await logAuthAttempt({
 *       email,
 *       attemptType: 'admin_login_failed',
 *       success: false,
 *       errorMessage: error.message
 *     });
 *   }
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Logging an access denied event
 * await logAuthAttempt({
 *   email: user.email,
 *   attemptType: 'access_denied',
 *   success: false,
 *   userId: user.id,
 *   errorMessage: 'User does not have admin role',
 *   metadata: { attemptedRoute: '/catking/dashboard' }
 * });
 * ```
 */
export async function logAuthAttempt(params: LogAuthAttemptParams): Promise<void> {
  try {
    const { error } = await supabase.from('auth_attempts_log').insert([
      {
        email: params.email,
        attempt_type: params.attemptType,
        success: params.success,
        user_id: params.userId,
        error_message: params.errorMessage,
        user_agent: navigator.userAgent,
        metadata: (params.metadata || {}) as Json,
      },
    ]);

    if (error) {
      logger.error('Failed to log auth attempt:', error);
    }
  } catch (err) {
    logger.error('Error logging auth attempt:', err);
  }
}
