/**
 * Admin Types
 *
 * Type definitions for admin pages and components.
 * These provide type safety for database records used in the admin dashboard.
 */

import type { Tables } from '@/integrations/supabase/types';

/**
 * User profile with role information for admin user management
 */
export interface AdminUserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_emoji: string | null;
  username: string | null;
  created_at: string | null;
  updated_at: string | null;
  suspended_at: string | null;
  suspension_reason: string | null;
  role?: 'admin' | 'moderator' | 'user';
  cats_count?: number;
  show_wins?: number;
}

/**
 * Weekly challenge record from database
 */
export type AdminChallenge = Tables<'weekly_challenges'>;

/**
 * Trade offer record from database
 */
export type AdminTradeOffer = Tables<'trade_offers'>;

/**
 * Cat gift record from database
 */
export type AdminCatGift = Tables<'cat_gifts'>;

/**
 * Friend request record from database
 */
export type AdminFriendRequest = Tables<'player_friends'>;

/**
 * Security linter issue detected during scan
 */
export interface LinterIssue {
  id: string;
  level: 'error' | 'warn' | 'info';
  category: 'RLS' | 'AUTH' | 'POLICY' | 'PERMISSIONS';
  title: string;
  description: string;
  tables?: string[];
  recommendation: string;
  docLink?: string;
}

/**
 * Results from a security linter scan
 */
export interface LinterResults {
  scannedAt: string;
  scanDurationMs: number;
  totalIssues: number;
  errors: number;
  warnings: number;
  infos: number;
  issues: LinterIssue[];
}

/**
 * Security scan history record from database
 */
export interface SecurityScanHistory {
  id: string;
  scanned_at: string;
  scan_duration_ms: number;
  total_issues: number;
  errors: number;
  warnings: number;
  infos: number;
  security_score: number;
  security_grade: string;
  issues: LinterIssue[];
  scanned_by: string | null;
  created_at: string | null;
}
