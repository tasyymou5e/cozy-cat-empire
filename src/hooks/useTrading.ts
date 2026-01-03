import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Cat, Resources } from '@/types/game';
import { toast } from '@/hooks/use-toast';
import { logPlayerActivity } from '@/hooks/usePlayerActivityLog';

/**
 * Trade offer data structure
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
 * Hook for managing player-to-player trading
 *
 * Handles creating, accepting, declining, and cancelling trade offers.
 * Includes real-time updates for incoming trades.
 *
 * @param userId - The current user's ID
 * @returns Trade lists and trade management functions
 *
 * @example
 * ```tsx
 * const { incomingTrades, createTrade, acceptTrade } = useTrading(userId);
 *
 * // Create a new trade offer
 * await createTrade({
 *   recipientId: friendId,
 *   offeredCats: [cat],
 *   offeredMoney: 100,
 *   requestedMoney: 50
 * });
 *
 * // Accept an incoming trade
 * const tradedCats = await acceptTrade(tradeId);
 * ```
 */
export function useTrading(userId: string | undefined) {
  const [incomingTrades, setIncomingTrades] = useState<TradeOffer[]>([]);
  const [outgoingTrades, setOutgoingTrades] = useState<TradeOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTradeAlert, setNewTradeAlert] = useState<TradeOffer | null>(null);

  const fetchTrades = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch incoming trades
      const { data: incoming, error: incomingError } = await supabase
        .from('trade_offers')
        .select('*')
        .eq('recipient_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (incomingError) throw incomingError;

      // Fetch outgoing trades
      const { data: outgoing, error: outgoingError } = await supabase
        .from('trade_offers')
        .select('*')
        .eq('sender_id', userId)
        .order('created_at', { ascending: false });

      if (outgoingError) throw outgoingError;

      // Get sender/recipient names
      const userIds = [...new Set([
        ...(incoming || []).map(t => t.sender_id),
        ...(outgoing || []).map(t => t.recipient_id)
      ])];

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('public_profiles')
          .select('id, display_name')
          .in('id', userIds);

        const nameMap = new Map(profiles?.map(p => [p.id, p.display_name]) || []);

        setIncomingTrades((incoming || []).map(t => ({
          ...t,
          offered_cats: (t.offered_cats || []) as unknown as Cat[],
          offered_resources: (t.offered_resources || {}) as unknown as Partial<Resources>,
          requested_cats: (t.requested_cats || []) as unknown as Cat[],
          requested_resources: (t.requested_resources || {}) as unknown as Partial<Resources>,
          status: t.status as TradeOffer['status'],
          sender_name: nameMap.get(t.sender_id) || 'Unknown'
        })));

        setOutgoingTrades((outgoing || []).map(t => ({
          ...t,
          offered_cats: (t.offered_cats || []) as unknown as Cat[],
          offered_resources: (t.offered_resources || {}) as unknown as Partial<Resources>,
          requested_cats: (t.requested_cats || []) as unknown as Cat[],
          requested_resources: (t.requested_resources || {}) as unknown as Partial<Resources>,
          status: t.status as TradeOffer['status'],
          recipient_name: nameMap.get(t.recipient_id) || 'Unknown'
        })));
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

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  // Real-time subscription for trade updates
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
          filter: `recipient_id=eq.${userId}`
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
              sender_name: senderName
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

  const createTrade = async (tradeData: TradeData) => {
    if (!userId) return { success: false, error: 'Not logged in' };

    try {
      const { error } = await supabase
        .from('trade_offers')
        .insert([{
          sender_id: userId,
          recipient_id: tradeData.recipientId,
          offered_cats: JSON.parse(JSON.stringify(tradeData.offeredCats)),
          offered_money: tradeData.offeredMoney,
          offered_resources: JSON.parse(JSON.stringify(tradeData.offeredResources)),
          requested_money: tradeData.requestedMoney,
          requested_resources: JSON.parse(JSON.stringify(tradeData.requestedResources)),
          message: tradeData.message || null
        }]);

      if (error) throw error;

      // Log trade created activity (non-blocking)
      logPlayerActivity(userId, {
        activityType: 'trade_created',
        activityDescription: `Created a trade offer with ${tradeData.offeredCats.length} cat(s)`,
        metadata: {
          offered_cats: tradeData.offeredCats.map(c => c.name),
          offered_money: tradeData.offeredMoney,
          recipient_id: tradeData.recipientId
        }
      });

      toast({
        title: "Trade Offer Sent! 📦",
        description: "Your trade offer has been sent!",
      });

      fetchTrades();
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create trade';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  };

  const acceptTrade = async (tradeId: string): Promise<TradeOffer | null> => {
    if (!userId) return null;
    
    try {
      const trade = incomingTrades.find(t => t.id === tradeId);
      if (!trade) return null;

      const { error } = await supabase
        .from('trade_offers')
        .update({ status: 'accepted' })
        .eq('id', tradeId);

      if (error) throw error;

      // Log trade completed activity (non-blocking)
      logPlayerActivity(userId, {
        activityType: 'trade_completed',
        activityDescription: 'Completed a trade',
        metadata: {
          trade_id: tradeId,
          received_cats: trade.offered_cats.map(c => c.name),
          received_money: trade.offered_money,
          sender_id: trade.sender_id
        }
      });

      toast({
        title: "Trade Accepted! 🤝",
        description: "The trade has been completed!",
      });

      fetchTrades();
      return trade;
    } catch (error) {
      console.error('Error accepting trade:', error);
      toast({
        title: "Error",
        description: "Failed to accept trade",
        variant: "destructive",
      });
      return null;
    }
  };

  const declineTrade = async (tradeId: string) => {
    try {
      const { error } = await supabase
        .from('trade_offers')
        .update({ status: 'declined' })
        .eq('id', tradeId);

      if (error) throw error;

      toast({
        title: "Trade Declined",
        description: "The trade offer has been declined.",
      });

      fetchTrades();
      return true;
    } catch (error) {
      console.error('Error declining trade:', error);
      return false;
    }
  };

  const cancelTrade = async (tradeId: string) => {
    try {
      const { error } = await supabase
        .from('trade_offers')
        .update({ status: 'cancelled' })
        .eq('id', tradeId);

      if (error) throw error;

      toast({
        title: "Trade Cancelled",
        description: "Your trade offer has been cancelled.",
      });

      fetchTrades();
      return true;
    } catch (error) {
      console.error('Error cancelling trade:', error);
      return false;
    }
  };

  const clearNewTrade = useCallback(() => {
    setNewTradeAlert(null);
  }, []);

  return {
    incomingTrades,
    outgoingTrades,
    loading,
    createTrade,
    acceptTrade,
    declineTrade,
    cancelTrade,
    refetch: fetchTrades,
    newTradeAlert,
    clearNewTrade
  };
}
