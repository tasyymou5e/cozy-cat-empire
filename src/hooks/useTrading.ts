/**
 * @fileoverview Player-to-player trading system hook
 *
 * Provides functionality for creating, accepting, declining, and cancelling
 * trade offers between players. Supports trading cats, money, and resources.
 * Includes real-time updates via Supabase subscriptions.
 *
 * @module hooks/useTrading
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Cat, Resources } from '@/types/game';
import { toast } from '@/hooks/use-toast';
import { logPlayerActivity } from '@/hooks/usePlayerActivityLog';

/**
 * Trade offer data structure
 *
 * @interface TradeOffer
 * @property {string} id - Unique trade offer ID
 * @property {string} sender_id - ID of the player who created the trade
 * @property {string} recipient_id - ID of the player receiving the trade offer
 * @property {Cat[]} offered_cats - Cats being offered by the sender
 * @property {number} offered_money - Money being offered by the sender
 * @property {Partial<Resources>} offered_resources - Resources being offered
 * @property {Cat[]} requested_cats - Cats requested from the recipient
 * @property {number} requested_money - Money requested from the recipient
 * @property {Partial<Resources>} requested_resources - Resources requested
 * @property {string | null} message - Optional message from the sender
 * @property {'pending' | 'accepted' | 'declined' | 'cancelled'} status - Trade status
 * @property {string} created_at - ISO timestamp of trade creation
 * @property {string} expires_at - ISO timestamp of trade expiration
 * @property {string} [sender_name] - Display name of the sender (populated for incoming trades)
 * @property {string} [recipient_name] - Display name of the recipient (populated for outgoing trades)
 */
interface TradeOffer {
  id: string;
  sender_id: string;
  recipient_id: string;
  offered_cats: Cat[];
  offered_money: number;
  offered_resources: Partial<Resources>;
  requested_cats: Cat[];
  requested_money: number;
  requested_resources: Partial<Resources>;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  created_at: string;
  expires_at: string;
  sender_name?: string;
  recipient_name?: string;
}

/**
 * Data required to create a new trade offer
 *
 * @interface TradeData
 * @property {string} recipientId - ID of the player to send the trade to
 * @property {Cat[]} offeredCats - Cats to offer in the trade
 * @property {number} offeredMoney - Money to offer (coins)
 * @property {Partial<Resources>} offeredResources - Resources to offer
 * @property {number} requestedMoney - Money to request from recipient
 * @property {Partial<Resources>} requestedResources - Resources to request
 * @property {string} [message] - Optional message to include with the trade
 */
interface TradeData {
  recipientId: string;
  offeredCats: Cat[];
  offeredMoney: number;
  offeredResources: Partial<Resources>;
  requestedMoney: number;
  requestedResources: Partial<Resources>;
  message?: string;
}

/**
 * Result of a trade operation
 *
 * @interface TradeResult
 * @property {boolean} success - Whether the operation succeeded
 * @property {string} [error] - Error message if operation failed
 */
interface TradeResult {
  success: boolean;
  error?: string;
}

/**
 * Hook for managing player-to-player trading
 *
 * Provides functionality to:
 * - Fetch incoming and outgoing trade offers
 * - Create new trade offers with cats, money, and resources
 * - Accept incoming trades (returns the traded cats)
 * - Decline or cancel trades
 * - Real-time notifications for new incoming trades
 *
 * Trade offers automatically expire after 7 days.
 * All operations show toast notifications and log to player activity.
 *
 * @param {string | undefined} userId - The current user's ID (undefined if not logged in)
 * @returns {Object} Trading state and functions
 *
 * @example
 * ```tsx
 * function TradingPanel() {
 *   const { user } = useAuth();
 *   const {
 *     incomingTrades,
 *     outgoingTrades,
 *     loading,
 *     createTrade,
 *     acceptTrade,
 *     declineTrade,
 *     cancelTrade,
 *     newTradeAlert,
 *     clearNewTrade
 *   } = useTrading(user?.id);
 *
 *   // Create a trade offering a cat for 500 coins
 *   const handleCreateTrade = async (friendId: string, cat: Cat) => {
 *     const result = await createTrade({
 *       recipientId: friendId,
 *       offeredCats: [cat],
 *       offeredMoney: 0,
 *       offeredResources: {},
 *       requestedMoney: 500,
 *       requestedResources: {},
 *       message: 'Want to trade?'
 *     });
 *
 *     if (result.success) {
 *       // Cat should be removed from sender's inventory
 *       removeCatFromState(cat.id);
 *     }
 *   };
 *
 *   // Accept an incoming trade
 *   const handleAccept = async (tradeId: string) => {
 *     const trade = await acceptTrade(tradeId);
 *     if (trade) {
 *       // Add received cats to inventory
 *       trade.offered_cats.forEach(addCatToState);
 *       // Apply money changes
 *       addMoney(trade.offered_money - trade.requested_money);
 *     }
 *   };
 *
 *   // Show popup when new trade arrives
 *   useEffect(() => {
 *     if (newTradeAlert) {
 *       showTradePopup(newTradeAlert);
 *     }
 *   }, [newTradeAlert]);
 *
 *   return (
 *     <div>
 *       <h2>Incoming ({incomingTrades.length})</h2>
 *       {incomingTrades.map(trade => (
 *         <TradeCard key={trade.id} trade={trade} onAccept={handleAccept} />
 *       ))}
 *       <h2>Outgoing ({outgoingTrades.length})</h2>
 *       {outgoingTrades.map(trade => (
 *         <TradeCard key={trade.id} trade={trade} onCancel={cancelTrade} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useTrading(userId: string | undefined) {
  /** List of pending incoming trade offers */
  const [incomingTrades, setIncomingTrades] = useState<TradeOffer[]>([]);

  /** List of all outgoing trade offers (any status) */
  const [outgoingTrades, setOutgoingTrades] = useState<TradeOffer[]>([]);

  /** Whether data is currently being fetched */
  const [loading, setLoading] = useState(true);

  /** New trade alert for popup notification */
  const [newTradeAlert, setNewTradeAlert] = useState<TradeOffer | null>(null);

  /**
   * Fetches all incoming and outgoing trades from the database
   *
   * @internal
   * @returns {Promise<void>}
   */
  const fetchTrades = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch incoming trades (pending only)
      const { data: incoming, error: incomingError } = await supabase
        .from('trade_offers')
        .select('*')
        .eq('recipient_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (incomingError) throw incomingError;

      // Fetch outgoing trades (all statuses for history)
      const { data: outgoing, error: outgoingError } = await supabase
        .from('trade_offers')
        .select('*')
        .eq('sender_id', userId)
        .order('created_at', { ascending: false });

      if (outgoingError) throw outgoingError;

      // Get sender/recipient names for display
      const userIds = [
        ...new Set([
          ...(incoming || []).map((t) => t.sender_id),
          ...(outgoing || []).map((t) => t.recipient_id),
        ]),
      ];

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('public_profiles')
          .select('id, display_name')
          .in('id', userIds);

        const nameMap = new Map(profiles?.map((p) => [p.id, p.display_name]) || []);

        setIncomingTrades(
          (incoming || []).map((t) => ({
            ...t,
            offered_cats: (t.offered_cats || []) as unknown as Cat[],
            offered_resources: (t.offered_resources || {}) as unknown as Partial<Resources>,
            requested_cats: (t.requested_cats || []) as unknown as Cat[],
            requested_resources: (t.requested_resources || {}) as unknown as Partial<Resources>,
            status: t.status as TradeOffer['status'],
            sender_name: nameMap.get(t.sender_id) || 'Unknown',
          }))
        );

        setOutgoingTrades(
          (outgoing || []).map((t) => ({
            ...t,
            offered_cats: (t.offered_cats || []) as unknown as Cat[],
            offered_resources: (t.offered_resources || {}) as unknown as Partial<Resources>,
            requested_cats: (t.requested_cats || []) as unknown as Cat[],
            requested_resources: (t.requested_resources || {}) as unknown as Partial<Resources>,
            status: t.status as TradeOffer['status'],
            recipient_name: nameMap.get(t.recipient_id) || 'Unknown',
          }))
        );
      } else {
        setIncomingTrades([]);
        setOutgoingTrades([]);
      }
    } catch (error) {
      console.error('Error fetching trades:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  // Real-time subscription for incoming trade updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('trade-offers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trade_offers',
          filter: `recipient_id=eq.${userId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch sender name for the popup
            const newTrade = payload.new as any;
            let senderName = 'Unknown';

            const { data: profile } = await supabase
              .from('public_profiles')
              .select('display_name')
              .eq('id', newTrade.sender_id)
              .maybeSingle();

            if (profile?.display_name) {
              senderName = profile.display_name;
            }

            setNewTradeAlert({
              ...newTrade,
              offered_cats: (newTrade.offered_cats || []) as Cat[],
              offered_resources: (newTrade.offered_resources || {}) as Partial<Resources>,
              requested_cats: (newTrade.requested_cats || []) as Cat[],
              requested_resources: (newTrade.requested_resources || {}) as Partial<Resources>,
              status: newTrade.status as TradeOffer['status'],
              sender_name: senderName,
            });
          }
          fetchTrades();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchTrades]);

  /**
   * Creates a new trade offer
   *
   * Sends a trade offer to another player. The offered cats should be
   * removed from the sender's inventory when the trade is created.
   * Trade offers expire after 7 days if not acted upon.
   *
   * @param {TradeData} tradeData - The trade offer details
   * @returns {Promise<TradeResult>} Result with success status and optional error
   *
   * @example
   * ```ts
   * const result = await createTrade({
   *   recipientId: 'friend-uuid',
   *   offeredCats: [myCat],
   *   offeredMoney: 100,
   *   offeredResources: { food: 10 },
   *   requestedMoney: 0,
   *   requestedResources: {},
   *   message: 'Trade you this cat for 100 coins!'
   * });
   * ```
   */
  const createTrade = async (tradeData: TradeData): Promise<TradeResult> => {
    if (!userId) return { success: false, error: 'Not logged in' };

    try {
      const { error } = await supabase.from('trade_offers').insert([
        {
          sender_id: userId,
          recipient_id: tradeData.recipientId,
          offered_cats: JSON.parse(JSON.stringify(tradeData.offeredCats)),
          offered_money: tradeData.offeredMoney,
          offered_resources: JSON.parse(JSON.stringify(tradeData.offeredResources)),
          requested_money: tradeData.requestedMoney,
          requested_resources: JSON.parse(JSON.stringify(tradeData.requestedResources)),
          message: tradeData.message || null,
        },
      ]);

      if (error) throw error;

      // Log trade created activity
      logPlayerActivity(userId, {
        activityType: 'trade_created',
        activityDescription: `Created a trade offer with ${tradeData.offeredCats.length} cat(s)`,
        metadata: {
          offered_cats: tradeData.offeredCats.map((c) => c.name),
          offered_money: tradeData.offeredMoney,
          recipient_id: tradeData.recipientId,
        },
      });

      toast({
        title: 'Trade Offer Sent! 📦',
        description: 'Your trade offer has been sent!',
      });

      fetchTrades();
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create trade';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Accepts an incoming trade offer
   *
   * Marks the trade as accepted and returns the trade details.
   * The caller should handle adding received cats and money to inventory.
   *
   * @param {string} tradeId - The ID of the trade to accept
   * @returns {Promise<TradeOffer | null>} The accepted trade, or null if failed
   *
   * @example
   * ```ts
   * const trade = await acceptTrade(tradeId);
   * if (trade) {
   *   // Add received cats to your farm
   *   trade.offered_cats.forEach(cat => addCat(cat));
   *   // Add received money
   *   addMoney(trade.offered_money);
   *   // Deduct requested money
   *   deductMoney(trade.requested_money);
   * }
   * ```
   */
  const acceptTrade = async (tradeId: string): Promise<TradeOffer | null> => {
    if (!userId) return null;

    try {
      const trade = incomingTrades.find((t) => t.id === tradeId);
      if (!trade) return null;

      const { error } = await supabase
        .from('trade_offers')
        .update({ status: 'accepted' })
        .eq('id', tradeId);

      if (error) throw error;

      // Log trade completed activity
      logPlayerActivity(userId, {
        activityType: 'trade_completed',
        activityDescription: 'Completed a trade',
        metadata: {
          trade_id: tradeId,
          received_cats: trade.offered_cats.map((c) => c.name),
          received_money: trade.offered_money,
          sender_id: trade.sender_id,
        },
      });

      toast({
        title: 'Trade Accepted! 🤝',
        description: 'The trade has been completed!',
      });

      fetchTrades();
      return trade;
    } catch (error) {
      console.error('Error accepting trade:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept trade',
        variant: 'destructive',
      });
      return null;
    }
  };

  /**
   * Declines an incoming trade offer
   *
   * Marks the trade as declined. The sender will see this in their outgoing trades.
   *
   * @param {string} tradeId - The ID of the trade to decline
   * @returns {Promise<boolean>} Whether the operation succeeded
   */
  const declineTrade = async (tradeId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('trade_offers')
        .update({ status: 'declined' })
        .eq('id', tradeId);

      if (error) throw error;

      toast({
        title: 'Trade Declined',
        description: 'The trade offer has been declined.',
      });

      fetchTrades();
      return true;
    } catch (error) {
      console.error('Error declining trade:', error);
      return false;
    }
  };

  /**
   * Cancels an outgoing trade offer
   *
   * Marks the trade as cancelled. Only the sender can cancel their own trades.
   *
   * @param {string} tradeId - The ID of the trade to cancel
   * @returns {Promise<boolean>} Whether the operation succeeded
   */
  const cancelTrade = async (tradeId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('trade_offers')
        .update({ status: 'cancelled' })
        .eq('id', tradeId);

      if (error) throw error;

      toast({
        title: 'Trade Cancelled',
        description: 'Your trade offer has been cancelled.',
      });

      fetchTrades();
      return true;
    } catch (error) {
      console.error('Error cancelling trade:', error);
      return false;
    }
  };

  /**
   * Clears the new trade alert popup
   *
   * @returns {void}
   */
  const clearNewTrade = useCallback(() => {
    setNewTradeAlert(null);
  }, []);

  return {
    /** List of pending incoming trade offers */
    incomingTrades,
    /** List of all outgoing trade offers */
    outgoingTrades,
    /** Whether data is currently loading */
    loading,
    /** Create a new trade offer */
    createTrade,
    /** Accept an incoming trade */
    acceptTrade,
    /** Decline an incoming trade */
    declineTrade,
    /** Cancel an outgoing trade */
    cancelTrade,
    /** Manually refresh trades */
    refetch: fetchTrades,
    /** New trade alert for popup (real-time) */
    newTradeAlert,
    /** Clear the new trade alert */
    clearNewTrade,
  };
}
