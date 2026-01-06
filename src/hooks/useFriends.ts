/**
 * @fileoverview Friend relationship management hook
 * 
 * Provides functionality for managing friend connections between players,
 * including sending/receiving friend requests, accepting/declining requests,
 * and removing friends. Integrates with Supabase for real-time updates.
 * 
 * @module hooks/useFriends
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logPlayerActivity } from '@/hooks/usePlayerActivityLog';

/**
 * Friend data with profile information and optional game stats
 * 
 * @interface Friend
 * @property {string} id - Unique friendship record ID
 * @property {string} friend_id - The friend's user ID
 * @property {string | null} display_name - Friend's display name
 * @property {string | null} username - Friend's unique username
 * @property {string} avatar_emoji - Friend's avatar emoji (default: '😺')
 * @property {'pending' | 'accepted' | 'blocked'} status - Friendship status
 * @property {string} created_at - ISO timestamp of when friendship was created
 * @property {Object} [stats] - Optional game statistics
 */
export interface Friend {
  id: string;
  friend_id: string;
  display_name: string | null;
  username: string | null;
  avatar_emoji: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  stats?: {
    /** Total cat show wins */
    total_show_wins: number;
    /** Current number of cats owned */
    total_cats_owned: number;
    /** Total kittens bred */
    total_kittens_bred: number;
  };
}

/**
 * Incoming friend request data
 * 
 * @interface FriendRequest
 * @property {string} id - Unique request record ID
 * @property {string} user_id - The sender's user ID
 * @property {string | null} display_name - Sender's display name
 * @property {string | null} username - Sender's unique username
 * @property {string} avatar_emoji - Sender's avatar emoji
 * @property {string} created_at - ISO timestamp of when request was sent
 */
export interface FriendRequest {
  id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_emoji: string;
  created_at: string;
}

/**
 * Result of a friend request operation
 * 
 * @interface FriendRequestResult
 * @property {boolean} success - Whether the operation succeeded
 * @property {string} [error] - Error message if operation failed
 */
interface FriendRequestResult {
  success: boolean;
  error?: string;
}

/**
 * Hook for managing friend relationships
 * 
 * Provides functionality to:
 * - Fetch list of accepted friends with their stats
 * - Fetch pending incoming friend requests
 * - Send friend requests by username or display name
 * - Accept or decline incoming requests
 * - Remove existing friends
 * 
 * All operations are logged to the player activity log for tracking.
 * 
 * @param {string | undefined} userId - The current user's ID (undefined if not logged in)
 * @returns {Object} Friend management state and functions
 * 
 * @example
 * ```tsx
 * function FriendsPanel() {
 *   const { user } = useAuth();
 *   const {
 *     friends,
 *     pendingRequests,
 *     loading,
 *     sendFriendRequest,
 *     acceptRequest,
 *     declineRequest,
 *     removeFriend
 *   } = useFriends(user?.id);
 * 
 *   // Send a friend request by username
 *   const handleAdd = async (username: string) => {
 *     const result = await sendFriendRequest(username);
 *     if (result.success) {
 *       toast({ title: 'Request sent!' });
 *     } else {
 *       toast({ title: 'Error', description: result.error });
 *     }
 *   };
 * 
 *   // Accept an incoming request
 *   const handleAccept = async (requestId: string) => {
 *     await acceptRequest(requestId);
 *   };
 * 
 *   return (
 *     <div>
 *       <h2>Friends ({friends.length})</h2>
 *       {friends.map(friend => (
 *         <FriendCard key={friend.id} friend={friend} />
 *       ))}
 *       <h2>Pending Requests ({pendingRequests.length})</h2>
 *       {pendingRequests.map(req => (
 *         <RequestCard key={req.id} request={req} onAccept={handleAccept} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFriends(userId: string | undefined) {
  /** List of accepted friends with their profile data and stats */
  const [friends, setFriends] = useState<Friend[]>([]);
  
  /** List of pending incoming friend requests */
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  
  /** Whether data is currently being fetched */
  const [loading, setLoading] = useState(true);

  /**
   * Fetches all friends and pending requests from the database
   * 
   * @internal
   * @returns {Promise<void>}
   */
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
        // Fetch friend profiles (with username) and stats
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_emoji, username')
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
            username: profile?.username || null,
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
          .from('profiles')
          .select('id, display_name, avatar_emoji, username')
          .in('id', senderIds);

        const requests: FriendRequest[] = pendingData.map(p => {
          const profile = senderProfiles?.find(sp => sp.id === p.user_id);
          return {
            id: p.id,
            user_id: p.user_id,
            display_name: profile?.display_name || null,
            username: profile?.username || null,
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

  // Initial fetch on mount and when userId changes
  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  /**
   * Sends a friend request to another player
   * 
   * Searches for the player by display name or username (case-insensitive).
   * Validates that the user isn't trying to add themselves and that
   * no existing friendship or request exists.
   * 
   * @param {string} friendUsername - The display name or username to search for
   * @returns {Promise<FriendRequestResult>} Result with success status and optional error
   * 
   * @example
   * ```ts
   * const result = await sendFriendRequest('CoolCatPlayer');
   * if (!result.success) {
   *   console.error(result.error); // 'User not found' | 'Friend request already exists' | etc.
   * }
   * ```
   */
  const sendFriendRequest = useCallback(async (friendUsername: string): Promise<FriendRequestResult> => {
    if (!userId) return { success: false, error: 'Not logged in' };

    try {
      // Find user by display_name OR username
      const searchTerm = friendUsername.trim();
      const { data: profiles, error: searchError } = await supabase
        .from('profiles')
        .select('id, display_name, username')
        .or(`display_name.ilike.${searchTerm},username.ilike.${searchTerm}`)
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

      // Log activity (non-blocking)
      logPlayerActivity(userId, {
        activityType: 'friend_request_sent',
        activityDescription: `Sent friend request to ${profiles[0].display_name || profiles[0].username || 'a player'}`,
        metadata: { 
          target_user_id: friendId,
          target_username: profiles[0].username
        }
      });

      return { success: true };
    } catch (err) {
      console.error('Failed to send friend request:', err);
      return { success: false, error: 'Failed to send request' };
    }
  }, [userId]);

  /**
   * Accepts a pending friend request
   * 
   * Updates the request status to 'accepted' and refreshes the friends list.
   * 
   * @param {string} requestId - The ID of the friend request to accept
   * @returns {Promise<void>}
   */
  const acceptRequest = useCallback(async (requestId: string) => {
    if (!userId) return;
    
    try {
      const { error } = await supabase
        .from('player_friends')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;
      
      // Log activity (non-blocking)
      logPlayerActivity(userId, {
        activityType: 'friend_request_accepted',
        activityDescription: 'Accepted a friend request',
        metadata: { request_id: requestId }
      });
      
      await fetchFriends();
    } catch (err) {
      console.error('Failed to accept request:', err);
    }
  }, [userId, fetchFriends]);

  /**
   * Declines a pending friend request
   * 
   * Deletes the request from the database and refreshes the list.
   * 
   * @param {string} requestId - The ID of the friend request to decline
   * @returns {Promise<void>}
   */
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

  /**
   * Removes an existing friend
   * 
   * Deletes the friendship record from the database and refreshes the list.
   * 
   * @param {string} friendshipId - The ID of the friendship record to remove
   * @returns {Promise<void>}
   */
  const removeFriend = useCallback(async (friendshipId: string) => {
    if (!userId) return;
    
    try {
      const { error } = await supabase
        .from('player_friends')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;
      
      // Log activity (non-blocking)
      logPlayerActivity(userId, {
        activityType: 'friend_removed',
        activityDescription: 'Removed a friend',
        metadata: { friendship_id: friendshipId }
      });
      
      await fetchFriends();
    } catch (err) {
      console.error('Failed to remove friend:', err);
    }
  }, [userId, fetchFriends]);

  return {
    /** List of accepted friends with profile data and stats */
    friends,
    /** List of pending incoming friend requests */
    pendingRequests,
    /** Whether data is currently loading */
    loading,
    /** Manually refresh friends and requests */
    fetchFriends,
    /** Send a friend request by username/display name */
    sendFriendRequest,
    /** Accept a pending friend request */
    acceptRequest,
    /** Decline a pending friend request */
    declineRequest,
    /** Remove an existing friend */
    removeFriend,
  };
}
