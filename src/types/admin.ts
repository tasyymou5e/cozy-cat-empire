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
