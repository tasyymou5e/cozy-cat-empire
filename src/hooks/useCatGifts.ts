/**
 * @fileoverview Cat gifting system hook
 *
 * Provides functionality for sending cats as gifts between players.
 * Includes real-time notifications for incoming gifts via Supabase subscriptions.
 *
 * @module hooks/useCatGifts
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Cat } from '@/types/game';
import { toast } from '@/hooks/use-toast';
import { logPlayerActivity } from '@/hooks/usePlayerActivityLog';

/**
 * Cat gift data structure
 *
 * @interface CatGift
 * @property {string} id - Unique gift record ID
 * @property {string} sender_id - ID of the player who sent the gift
 * @property {string} recipient_id - ID of the player receiving the gift
 * @property {Cat} cat_data - The cat being gifted (full Cat object)
 * @property {string | null} message - Optional message from the sender
 * @property {CatGiftStatus} status - Gift status
 * @property {string} created_at - ISO timestamp of when gift was sent
 * @property {string} [sender_name] - Display name of sender (populated for received gifts)
 * @property {string} [recipient_name] - Display name of recipient (populated for sent gifts)
 */
/** Valid gift status values */
export type CatGiftStatus = 'pending' | 'accepted' | 'declined' | 'revoked_by_admin';

interface CatGift {
  id: string;
  sender_id: string;
  recipient_id: string;
  cat_data: Cat;
  message: string | null;
  status: CatGiftStatus;
  created_at: string;
  sender_name?: string;
  recipient_name?: string;
}

/**
 * Result of a gift operation
 *
 * @interface GiftResult
 * @property {boolean} success - Whether the operation succeeded
 * @property {string} [error] - Error message if operation failed
 */
interface GiftResult {
  success: boolean;
  error?: string;
}

/**
 * Hook for managing cat gifting between players
 *
 * Provides functionality to:
 * - Fetch received and sent gifts
 * - Send a cat as a gift to a friend
 * - Accept or decline received gifts
 * - Real-time notifications for incoming gifts
 *
 * When a gift is sent, the cat is removed from the sender's inventory.
 * When a gift is accepted, the cat is added to the recipient's inventory.
 * Declined gifts are marked as such (cat is not returned to sender).
 *
 * @param {string | undefined} userId - The current user's ID (undefined if not logged in)
 * @returns {Object} Gift state and management functions
 *
 * @example
 * ```tsx
 * function GiftingPanel() {
 *   const { user } = useAuth();
 *   const {
 *     receivedGifts,
 *     sentGifts,
 *     loading,
 *     sendGift,
 *     acceptGift,
 *     declineGift,
 *     newGiftAlert,
 *     clearNewGift
 *   } = useCatGifts(user?.id);
 *
 *   // Send a cat to a friend
 *   const handleSendGift = async (friendId: string, cat: Cat) => {
 *     const result = await sendGift(friendId, cat, 'Enjoy your new cat!');
 *     if (result.success) {
 *       // Remove cat from local state
 *       removeCatFromState(cat.id);
 *     }
 *   };
 *
 *   // Accept a received gift
 *   const handleAccept = async (giftId: string) => {
 *     const cat = await acceptGift(giftId);
 *     if (cat) {
 *       // Add cat to local state
 *       addCatToState(cat);
 *     }
 *   };
 *
 *   // Show popup when new gift arrives
 *   useEffect(() => {
 *     if (newGiftAlert) {
 *       showGiftPopup(newGiftAlert);
 *     }
 *   }, [newGiftAlert]);
 *
 *   return (
 *     <div>
 *       <h2>Received Gifts ({receivedGifts.length})</h2>
 *       {receivedGifts.map(gift => (
 *         <GiftCard key={gift.id} gift={gift} onAccept={handleAccept} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCatGifts(userId: string | undefined) {
  /** List of pending received gifts */
  const [receivedGifts, setReceivedGifts] = useState<CatGift[]>([]);

  /** List of all sent gifts (any status) */
  const [sentGifts, setSentGifts] = useState<CatGift[]>([]);

  /** Whether data is currently being fetched */
  const [loading, setLoading] = useState(true);

  /** New gift alert for popup notification */
  const [newGiftAlert, setNewGiftAlert] = useState<CatGift | null>(null);

  /**
   * Fetches all received and sent gifts from the database
   *
   * @internal
   * @returns {Promise<void>}
   */
  const fetchGifts = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch received gifts (pending only)
      const { data: received, error: receivedError } = await supabase
        .from('cat_gifts')
        .select('*')
        .eq('recipient_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (receivedError) throw receivedError;

      // Fetch sent gifts (all statuses for history)
      const { data: sent, error: sentError } = await supabase
        .from('cat_gifts')
        .select('*')
        .eq('sender_id', userId)
        .order('created_at', { ascending: false });

      if (sentError) throw sentError;

      // Get sender/recipient names for display
      const userIds = [
        ...new Set([
          ...(received || []).map((g) => g.sender_id),
          ...(sent || []).map((g) => g.recipient_id),
        ]),
      ];

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('public_profiles')
          .select('id, display_name')
          .in('id', userIds);

        const nameMap = new Map(profiles?.map((p) => [p.id, p.display_name]) || []);

        setReceivedGifts(
          (received || []).map((g) => ({
            ...g,
            cat_data: g.cat_data as unknown as Cat,
            status: g.status as CatGiftStatus,
            sender_name: nameMap.get(g.sender_id) || 'Unknown',
          }))
        );

        setSentGifts(
          (sent || []).map((g) => ({
            ...g,
            cat_data: g.cat_data as unknown as Cat,
            status: g.status as CatGiftStatus,
            recipient_name: nameMap.get(g.recipient_id) || 'Unknown',
          }))
        );
      } else {
        setReceivedGifts([]);
        setSentGifts([]);
      }
    } catch (error) {
      console.error('Error fetching gifts:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    fetchGifts();
  }, [fetchGifts]);

  // Real-time subscription for new gifts - with user context guard
  useEffect(() => {
    if (!userId) return;

    // Phase 2: Capture userId at subscription time
    const subscribedUserId = userId;

    const channel = supabase
      .channel('cat-gifts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cat_gifts',
          filter: `recipient_id=eq.${userId}`,
        },
        async (payload) => {
          // Phase 2: Validate user context hasn't changed
          if (subscribedUserId !== userId) {
            console.log('[GiftSync] Ignoring stale gift for different user');
            return;
          }
          // Fetch sender name for the new gift popup
          const newGift = payload.new as any;
          const { data: senderProfile } = await supabase
            .from('public_profiles')
            .select('display_name')
            .eq('id', newGift.sender_id)
            .maybeSingle();

          const giftWithSender: CatGift = {
            ...newGift,
            cat_data: newGift.cat_data as Cat,
            status: newGift.status as CatGiftStatus,
            sender_name: senderProfile?.display_name || 'A friend',
          };

          setNewGiftAlert(giftWithSender);
          fetchGifts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cat_gifts',
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          // Phase 2: Validate user context hasn't changed
          if (subscribedUserId !== userId) {
            console.log('[GiftSync] Ignoring stale update for different user');
            return;
          }
          fetchGifts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchGifts]);

  /**
   * Sends a cat as a gift to another player
   *
   * The cat will be removed from the sender's inventory when the gift is created.
   * The sender should call a remove function after successful send.
   *
   * @param {string} recipientId - The ID of the player to send the gift to
   * @param {Cat} cat - The cat to send as a gift
   * @param {string} [message] - Optional message to include with the gift
   * @returns {Promise<GiftResult>} Result with success status and optional error
   *
   * @example
   * ```ts
   * const result = await sendGift(friendId, myCat, 'Happy birthday!');
   * if (result.success) {
   *   // Remove cat from local inventory
   *   removeCat(myCat.id);
   * }
   * ```
   */
  const sendGift = async (recipientId: string, cat: Cat, message?: string): Promise<GiftResult> => {
    if (!userId) return { success: false, error: 'Not logged in' };

    try {
      const { error } = await supabase.from('cat_gifts').insert([
        {
          sender_id: userId,
          recipient_id: recipientId,
          cat_data: JSON.parse(JSON.stringify(cat)),
          message: message || null,
        },
      ]);

      if (error) throw error;

      // Log gift sent activity
      logPlayerActivity(userId, {
        activityType: 'gift_sent',
        activityDescription: `Sent ${cat.name} as a gift`,
        metadata: { cat_name: cat.name, cat_breed: cat.breed, recipient_id: recipientId },
      });

      toast({
        title: 'Gift Sent! 🎁',
        description: `${cat.name} is on their way to their new home!`,
      });

      fetchGifts();
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send gift';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Accepts a received gift
   *
   * Marks the gift as accepted and returns the cat data.
   * The caller should add the cat to their inventory.
   *
   * @param {string} giftId - The ID of the gift to accept
   * @returns {Promise<Cat | null>} The gifted cat, or null if failed
   *
   * @example
   * ```ts
   * const cat = await acceptGift(giftId);
   * if (cat) {
   *   // Add cat to your farm
   *   addCat(cat);
   * }
   * ```
   */
  const acceptGift = async (giftId: string): Promise<Cat | null> => {
    if (!userId) return null;

    try {
      const gift = receivedGifts.find((g) => g.id === giftId);
      if (!gift) return null;

      const { error } = await supabase
        .from('cat_gifts')
        .update({ status: 'accepted' })
        .eq('id', giftId);

      if (error) throw error;

      // Log gift received activity
      logPlayerActivity(userId, {
        activityType: 'gift_received',
        activityDescription: `Received ${gift.cat_data.name} as a gift`,
        metadata: {
          cat_name: gift.cat_data.name,
          cat_breed: gift.cat_data.breed,
          sender_id: gift.sender_id,
        },
      });

      toast({
        title: 'Gift Accepted! 🎉',
        description: `${gift.cat_data.name} has joined your family!`,
      });

      fetchGifts();
      return gift.cat_data;
    } catch (error) {
      console.error('Error accepting gift:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept gift',
        variant: 'destructive',
      });
      return null;
    }
  };

  /**
   * Declines a received gift
   *
   * Marks the gift as declined. The cat is NOT returned to the sender.
   *
   * @param {string} giftId - The ID of the gift to decline
   * @returns {Promise<boolean>} Whether the operation succeeded
   */
  const declineGift = async (giftId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('cat_gifts')
        .update({ status: 'declined' })
        .eq('id', giftId);

      if (error) throw error;

      toast({
        title: 'Gift Declined',
        description: 'The gift has been returned to sender.',
      });

      fetchGifts();
      return true;
    } catch (error) {
      console.error('Error declining gift:', error);
      return false;
    }
  };

  /**
   * Clears the new gift alert popup
   *
   * @returns {void}
   */
  const clearNewGift = useCallback(() => {
    setNewGiftAlert(null);
  }, []);

  return {
    /** List of pending received gifts */
    receivedGifts,
    /** List of all sent gifts (any status) */
    sentGifts,
    /** Whether data is currently loading */
    loading,
    /** Send a cat as a gift to a friend */
    sendGift,
    /** Accept a received gift (returns the cat) */
    acceptGift,
    /** Decline a received gift */
    declineGift,
    /** Manually refresh gifts */
    refetch: fetchGifts,
    /** New gift alert for popup (real-time) */
    newGiftAlert,
    /** Clear the new gift alert */
    clearNewGift,
  };
}
