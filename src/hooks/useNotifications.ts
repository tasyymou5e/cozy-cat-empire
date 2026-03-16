import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { createLogger } from '@/lib/logger';
import { handleAsyncError } from '@/lib/errorHandling';

const log = createLogger('Notifications');

/**
 * Notification data structure for in-app alerts
 */
interface Notification {
  id: string;
  type: 'friend_request' | 'gift' | 'trade';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: Record<string, unknown>;
}

/**
 * Hook for managing real-time in-app notifications
 *
 * Aggregates notifications from friend requests, cat gifts, and trade offers.
 * Provides real-time updates via Supabase subscriptions.
 *
 * @param userId - The current user's ID
 * @returns Notifications list and management functions
 *
 * @example
 * ```tsx
 * const { notifications, unreadCount, markAsRead } = useNotifications(userId);
 *
 * // Display notification count in header
 * <Badge>{unreadCount}</Badge>
 *
 * // Mark notification as read when viewed
 * markAsRead(notificationId);
 * ```
 */
export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      // Fetch pending friend requests
      const { data: friendRequests } = await supabase
        .from('player_friends')
        .select('id, user_id, created_at')
        .eq('friend_id', userId)
        .eq('status', 'pending');

      // Fetch pending gifts
      const { data: gifts } = await supabase
        .from('cat_gifts')
        .select('id, sender_id, created_at, cat_data')
        .eq('recipient_id', userId)
        .eq('status', 'pending');

      // Fetch pending trades
      const { data: trades } = await supabase
        .from('trade_offers')
        .select('id, sender_id, created_at')
        .eq('recipient_id', userId)
        .eq('status', 'pending');

      // Get sender names
      const senderIds = [
        ...(friendRequests || []).map((fr) => fr.user_id),
        ...(gifts || []).map((g) => g.sender_id),
        ...(trades || []).map((t) => t.sender_id),
      ];

      const { data: profiles } = await supabase
        .from('public_profiles')
        .select('id, display_name')
        .in('id', senderIds);

      const nameMap = new Map(profiles?.map((p) => [p.id, p.display_name || 'Someone']) || []);

      const allNotifications: Notification[] = [
        ...(friendRequests || []).map((fr) => ({
          id: `fr-${fr.id}`,
          type: 'friend_request' as const,
          title: '👥 Friend Request',
          message: `${nameMap.get(fr.user_id)} wants to be your friend!`,
          timestamp: fr.created_at,
          read: false,
          data: { requestId: fr.id, senderId: fr.user_id },
        })),
        ...(gifts || []).map((g) => ({
          id: `gift-${g.id}`,
          type: 'gift' as const,
          title: '🎁 Cat Gift',
          message: `${nameMap.get(g.sender_id)} sent you a cat!`,
          timestamp: g.created_at,
          read: false,
          data: { giftId: g.id, catData: g.cat_data },
        })),
        ...(trades || []).map((t) => ({
          id: `trade-${t.id}`,
          type: 'trade' as const,
          title: '📦 Trade Offer',
          message: `${nameMap.get(t.sender_id)} wants to trade with you!`,
          timestamp: t.created_at,
          read: false,
          data: { tradeId: t.id },
        })),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setNotifications(allNotifications);
      setUnreadCount(allNotifications.length);
    } catch (error) {
      handleAsyncError(error, {
        source: 'useNotifications',
        operation: 'fetchNotifications',
        userId,
      }, 'Failed to fetch notifications');
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time subscriptions - with user context guard
  useEffect(() => {
    if (!userId) return;

    // Phase 2: Capture userId at subscription time
    const subscribedUserId = userId;

    const friendChannel = supabase
      .channel('friend-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'player_friends',
          filter: `friend_id=eq.${userId}`,
        },
        () => {
          // Phase 2: Validate user context hasn't changed
          if (subscribedUserId !== userId) return;
          toast({
            title: '👥 New Friend Request!',
            description: 'Someone wants to be your friend!',
          });
          fetchNotifications();
        }
      )
      .subscribe();

    const giftChannel = supabase
      .channel('gift-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cat_gifts',
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          // Phase 2: Validate user context hasn't changed
          if (subscribedUserId !== userId) return;
          toast({
            title: '🎁 New Cat Gift!',
            description: 'Someone sent you a cat!',
          });
          fetchNotifications();
        }
      )
      .subscribe();

    const tradeChannel = supabase
      .channel('trade-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trade_offers',
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          // Phase 2: Validate user context hasn't changed
          if (subscribedUserId !== userId) return;
          toast({
            title: '📦 New Trade Offer!',
            description: 'Someone wants to trade with you!',
          });
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(friendChannel);
      supabase.removeChannel(giftChannel);
      supabase.removeChannel(tradeChannel);
    };
  }, [userId, fetchNotifications]);

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    clearAll,
    refetch: fetchNotifications,
  };
}
