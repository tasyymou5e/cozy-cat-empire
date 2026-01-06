/**
 * @fileoverview Barrel export for admin hooks
 * 
 * Usage: import { useAdminAuth, useAdminData } from '@/hooks/admin';
 * 
 * @module hooks/admin
 */

// Authentication
export { useAdminAuth } from './useAdminAuth';

// Activity logging
export { useAdminActivityLog, logAuthAttempt } from './useAdminActivityLog';

// Rate limiting
export { useAdminRateLimit, RATE_LIMITS } from './useAdminRateLimit';

// Data queries
export {
  useAdminStats,
  useAdminUsers,
  useAdminErrors,
  useAdminErrorTrends,
  useAdminAuthLogs,
  useAdminActivityLogs,
  useAdminPlayerActivityLogs,
  useAdminStorageStats,
  useAdminAllTableStats,
  useAdminLiveActivity,
  useAdminChallengeAnalytics,
  useAdminRetentionAnalytics,
} from './useAdminData';

// AI metrics
export { useAdminAIStats, useAdminAILogs } from './useAdminAIData';
