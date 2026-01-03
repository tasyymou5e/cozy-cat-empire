import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Friend data with profile and stats
 */
export interface Friend {
  id: string;
  friend_id: string;
  display_name: string | null;
  avatar_emoji: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  stats?: {
    total_show_wins: number;
    total_cats_owned: number;
    total_kittens_bred: number;
  };
}

/**
 * Incoming friend request data
 */
export interface FriendRequest {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_emoji: string;
  created_at: string;
}

/**
 * Hook for managing friend relationships
 *
 * Handles friend requests, acceptance, removal, and real-time friend list updates.
 *
 * @param userId - The current user's ID
 * @returns Friends list, pending requests, and friend management functions
 *
 * @example
 * ```tsx
 * const { friends, pendingRequests, sendFriendRequest, acceptRequest } = useFriends(userId);
 *
 * // Send a friend request
 * await sendFriendRequest('PlayerName');
 *
 * // Accept an incoming request
 * await acceptRequest(requestId);
 * ```
 */
export function useFriends(userId: string | undefined) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // Fetch accepted friends (where I sent or received the request)
      const { data: myFriends, error: friendsError } = await supabase
        .from('player_friends')
        .select('*')
        .eq('status', 'accepted')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

      if (friendsError) throw friendsError;

      // Get friend IDs
      const friendIds = (myFriends || []).map(f => 
        f.user_id === userId ? f.friend_id : f.user_id
      );

      if (friendIds.length > 0) {
        // Fetch friend profiles and stats
        const { data: profiles } = await supabase
          .from('public_profiles')
          .select('id, display_name, avatar_emoji')
          .in('id', friendIds);

        const { data: stats } = await supabase
          .from('player_stats')
          .select('user_id, total_show_wins, total_cats_owned, total_kittens_bred')
          .in('user_id', friendIds);

        const friendsWithData: Friend[] = (myFriends || []).map(f => {
          const friendId = f.user_id === userId ? f.friend_id : f.user_id;
          const profile = profiles?.find(p => p.id === friendId);
          const stat = stats?.find(s => s.user_id === friendId);

          return {
            id: f.id,
            friend_id: friendId,
            display_name: profile?.display_name || null,
            avatar_emoji: profile?.avatar_emoji || '😺',
            status: f.status as 'accepted',
            created_at: f.created_at,
            stats: stat ? {
              total_show_wins: stat.total_show_wins,
              total_cats_owned: stat.total_cats_owned,
              total_kittens_bred: stat.total_kittens_bred,
            } : undefined,
          };
        });

        setFriends(friendsWithData);
      } else {
        setFriends([]);
      }

      // Fetch pending requests (requests sent TO me)
      const { data: pendingData, error: pendingError } = await supabase
        .from('player_friends')
        .select('*')
        .eq('friend_id', userId)
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      if (pendingData && pendingData.length > 0) {
        const senderIds = pendingData.map(p => p.user_id);
        const { data: senderProfiles } = await supabase
          .from('public_profiles')
          .select('id, display_name, avatar_emoji')
          .in('id', senderIds);

        const requests: FriendRequest[] = pendingData.map(p => {
          const profile = senderProfiles?.find(sp => sp.id === p.user_id);
          return {
            id: p.id,
            user_id: p.user_id,
            display_name: profile?.display_name || null,
            avatar_emoji: profile?.avatar_emoji || '😺',
            created_at: p.created_at,
          };
        });

        setPendingRequests(requests);
      } else {
        setPendingRequests([]);
      }
    } catch (err) {
      console.error('Failed to fetch friends:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const sendFriendRequest = useCallback(async (friendUsername: string): Promise<{ success: boolean; error?: string }> => {
    if (!userId) return { success: false, error: 'Not logged in' };

    try {
      // Find user by display_name
      const { data: profiles, error: searchError } = await supabase
        .from('public_profiles')
        .select('id, display_name')
        .ilike('display_name', friendUsername)
        .limit(1);

      if (searchError) throw searchError;

      if (!profiles || profiles.length === 0) {
        return { success: false, error: 'User not found' };
      }

      const friendId = profiles[0].id;

      if (friendId === userId) {
        return { success: false, error: "You can't add yourself as a friend" };
      }

      // Check if friendship already exists
      const { data: existing } = await supabase
        .from('player_friends')
        .select('id')
        .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
        .maybeSingle();

      if (existing) {
        return { success: false, error: 'Friend request already exists' };
      }

      // Create friend request
      const { error: insertError } = await supabase
        .from('player_friends')
        .insert({ user_id: userId, friend_id: friendId, status: 'pending' });

      if (insertError) throw insertError;

      return { success: true };
    } catch (err) {
      console.error('Failed to send friend request:', err);
      return { success: false, error: 'Failed to send request' };
    }
  }, [userId]);

  const acceptRequest = useCallback(async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('player_friends')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;
      await fetchFriends();
    } catch (err) {
      console.error('Failed to accept request:', err);
    }
  }, [fetchFriends]);

  const declineRequest = useCallback(async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('player_friends')
        .delete()
        .eq('id', requestId);

      if (error) throw error;
      await fetchFriends();
    } catch (err) {
      console.error('Failed to decline request:', err);
    }
  }, [fetchFriends]);

  const removeFriend = useCallback(async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('player_friends')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;
      await fetchFriends();
    } catch (err) {
      console.error('Failed to remove friend:', err);
    }
  }, [fetchFriends]);

  return {
    friends,
    pendingRequests,
    loading,
    fetchFriends,
    sendFriendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
  };
}
