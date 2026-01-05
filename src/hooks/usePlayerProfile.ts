import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Player profile data structure
 */
export interface PlayerProfile {
  id: string;
  display_name: string | null;
  avatar_emoji: string;
  username: string | null;
}

/**
 * Hook for managing player profile data
 *
 * Handles fetching and updating the player's display name, avatar, and username.
 *
 * @param userId - The current user's ID
 * @returns Profile data and update function
 *
 * @example
 * ```tsx
 * const { profile, updateProfile } = usePlayerProfile(userId);
 *
 * // Update display name, avatar, and username
 * await updateProfile('NewName', '🐱', 'newusername');
 * ```
 */
export function usePlayerProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_emoji, username')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      setProfile(data ? {
        id: data.id,
        display_name: data.display_name,
        avatar_emoji: data.avatar_emoji || '😺',
        username: data.username,
      } : null);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (
    displayName: string,
    avatarEmoji: string,
    username?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!userId) return { success: false, error: 'Not logged in' };

    try {
      const updateData: Record<string, any> = { 
        display_name: displayName, 
        avatar_emoji: avatarEmoji 
      };
      
      // Only include username if provided
      if (username !== undefined) {
        updateData.username = username.trim().toLowerCase() || null;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;

      setProfile(prev => prev ? { 
        ...prev, 
        display_name: displayName, 
        avatar_emoji: avatarEmoji,
        username: username !== undefined ? (username.trim().toLowerCase() || null) : prev.username
      } : null);
      return { success: true };
    } catch (err) {
      console.error('Failed to update profile:', err);
      return { success: false, error: 'Failed to update profile' };
    }
  }, [userId]);

  return {
    profile,
    loading,
    fetchProfile,
    updateProfile,
  };
}
