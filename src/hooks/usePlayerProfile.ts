import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createLogger } from '@/lib/logger';

const log = createLogger('PlayerProfile');

export interface PlayerProfile {
  id: string;
  display_name: string | null;
  avatar_emoji: string;
  username: string | null;
}

export function usePlayerProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!userId) { setProfile(null); setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').select('id, display_name, avatar_emoji, username').eq('id', userId).maybeSingle();
      if (error) throw error;
      setProfile(data ? { id: data.id, display_name: data.display_name, avatar_emoji: data.avatar_emoji || '😺', username: data.username } : null);
    } catch (err) { log.error('Failed to fetch profile:', err); } finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  useEffect(() => {
    if (!userId) return;
    const subscribedUserId = userId;
    const channel = supabase.channel(`profile-${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        (payload) => {
          if (subscribedUserId !== userId) { log.debug('Ignoring stale update for different user'); return; }
          const newData = payload.new as { id: string; display_name: string | null; avatar_emoji: string | null; username: string | null };
          setProfile({ id: newData.id, display_name: newData.display_name, avatar_emoji: newData.avatar_emoji || '😺', username: newData.username });
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const updateProfile = useCallback(async (displayName: string, avatarEmoji: string, username?: string): Promise<{ success: boolean; error?: string }> => {
    if (!userId) return { success: false, error: 'Not logged in' };
    try {
      const updateData: Record<string, string | null> = { display_name: displayName, avatar_emoji: avatarEmoji };
      if (username !== undefined) updateData.username = username.trim().toLowerCase() || null;
      const { error } = await supabase.from('profiles').update(updateData).eq('id', userId);
      if (error) throw error;
      supabase.from('player_stats').update({ display_name: displayName, avatar_emoji: avatarEmoji }).eq('user_id', userId)
        .then(({ error: statsError }) => {
          if (statsError) log.warn('Failed to sync to player_stats:', statsError.message);
          else log.debug('Synced profile to player_stats');
        });
      setProfile((prev) => prev ? {
        ...prev, display_name: displayName, avatar_emoji: avatarEmoji,
        username: username !== undefined ? username.trim().toLowerCase() || null : prev.username,
      } : null);
      return { success: true };
    } catch (err) { log.error('Failed to update profile:', err); return { success: false, error: 'Failed to update profile' }; }
  }, [userId]);

  return { profile, loading, fetchProfile, updateProfile };
}