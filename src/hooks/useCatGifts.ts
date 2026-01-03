import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Cat } from '@/types/game';
import { toast } from '@/hooks/use-toast';
import { logPlayerActivity } from '@/hooks/usePlayerActivityLog';

interface CatGift {
  id: string;
  sender_id: string;
  recipient_id: string;
  cat_data: Cat;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  sender_name?: string;
  recipient_name?: string;
}

export function useCatGifts(userId: string | undefined) {
  const [receivedGifts, setReceivedGifts] = useState<CatGift[]>([]);
  const [sentGifts, setSentGifts] = useState<CatGift[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGiftAlert, setNewGiftAlert] = useState<CatGift | null>(null);

  const fetchGifts = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch received gifts
      const { data: received, error: receivedError } = await supabase
        .from('cat_gifts')
        .select('*')
        .eq('recipient_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (receivedError) throw receivedError;

      // Fetch sent gifts
      const { data: sent, error: sentError } = await supabase
        .from('cat_gifts')
        .select('*')
        .eq('sender_id', userId)
        .order('created_at', { ascending: false });

      if (sentError) throw sentError;

      // Get sender/recipient names
      const userIds = [...new Set([
        ...(received || []).map(g => g.sender_id),
        ...(sent || []).map(g => g.recipient_id)
      ])];

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', userIds);

        const nameMap = new Map(profiles?.map(p => [p.id, p.display_name]) || []);

        setReceivedGifts((received || []).map(g => ({
          ...g,
          cat_data: g.cat_data as unknown as Cat,
          status: g.status as 'pending' | 'accepted' | 'declined',
          sender_name: nameMap.get(g.sender_id) || 'Unknown'
        })));

        setSentGifts((sent || []).map(g => ({
          ...g,
          cat_data: g.cat_data as unknown as Cat,
          status: g.status as 'pending' | 'accepted' | 'declined',
          recipient_name: nameMap.get(g.recipient_id) || 'Unknown'
        })));
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

  useEffect(() => {
    fetchGifts();
  }, [fetchGifts]);

  // Real-time subscription for new gifts
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('cat-gifts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cat_gifts',
          filter: `recipient_id=eq.${userId}`
        },
        async (payload) => {
          // Fetch sender name for the new gift
          const newGift = payload.new as any;
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', newGift.sender_id)
            .single();

          const giftWithSender: CatGift = {
            ...newGift,
            cat_data: newGift.cat_data as Cat,
            status: newGift.status as 'pending' | 'accepted' | 'declined',
            sender_name: senderProfile?.display_name || 'A friend'
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
          filter: `recipient_id=eq.${userId}`
        },
        () => {
          fetchGifts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchGifts]);

  const sendGift = async (recipientId: string, cat: Cat, message?: string) => {
    if (!userId) return { success: false, error: 'Not logged in' };

    try {
      const { error } = await supabase
        .from('cat_gifts')
        .insert([{
          sender_id: userId,
          recipient_id: recipientId,
          cat_data: JSON.parse(JSON.stringify(cat)),
          message: message || null
        }]);

      if (error) throw error;

      // Log gift sent activity (non-blocking)
      logPlayerActivity(userId, {
        activityType: 'gift_sent',
        activityDescription: `Sent ${cat.name} as a gift`,
        metadata: { cat_name: cat.name, cat_breed: cat.breed, recipient_id: recipientId }
      });

      toast({
        title: "Gift Sent! 🎁",
        description: `${cat.name} is on their way to their new home!`,
      });

      fetchGifts();
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send gift';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  };

  const acceptGift = async (giftId: string): Promise<Cat | null> => {
    if (!userId) return null;
    
    try {
      const gift = receivedGifts.find(g => g.id === giftId);
      if (!gift) return null;

      const { error } = await supabase
        .from('cat_gifts')
        .update({ status: 'accepted' })
        .eq('id', giftId);

      if (error) throw error;

      // Log gift received activity (non-blocking)
      logPlayerActivity(userId, {
        activityType: 'gift_received',
        activityDescription: `Received ${gift.cat_data.name} as a gift`,
        metadata: { cat_name: gift.cat_data.name, cat_breed: gift.cat_data.breed, sender_id: gift.sender_id }
      });

      toast({
        title: "Gift Accepted! 🎉",
        description: `${gift.cat_data.name} has joined your family!`,
      });

      fetchGifts();
      return gift.cat_data;
    } catch (error) {
      console.error('Error accepting gift:', error);
      toast({
        title: "Error",
        description: "Failed to accept gift",
        variant: "destructive",
      });
      return null;
    }
  };

  const declineGift = async (giftId: string) => {
    try {
      const { error } = await supabase
        .from('cat_gifts')
        .update({ status: 'declined' })
        .eq('id', giftId);

      if (error) throw error;

      toast({
        title: "Gift Declined",
        description: "The gift has been returned to sender.",
      });

      fetchGifts();
      return true;
    } catch (error) {
      console.error('Error declining gift:', error);
      return false;
    }
  };

  return {
    receivedGifts,
    sentGifts,
    loading,
    sendGift,
    acceptGift,
    declineGift,
    refetch: fetchGifts,
    newGiftAlert,
    clearNewGift: () => setNewGiftAlert(null)
  };
}
