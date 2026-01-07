import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  ActiveCoopChallenge,
  CoopChallengeInvite,
  CoopChallenge,
  CoopChallengeType,
  COOP_CHALLENGE_TEMPLATES,
  isCoopChallengeCompleted,
} from '@/types/coopChallenges';
import { Friend } from '@/hooks/useFriends';
import { toast } from '@/hooks/use-toast';

/**
 * Hook for managing cooperative friend challenges with cloud sync
 */
export function useCoopChallenges(
  userId: string | undefined,
  friends: Friend[],
  playSound?: (type: string) => void
) {
  const [activeChallenges, setActiveChallenges] = useState<ActiveCoopChallenge[]>([]);
  const [pendingInvites, setPendingInvites] = useState<CoopChallengeInvite[]>([]);
  const [sentInvites, setSentInvites] = useState<CoopChallengeInvite[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from cloud when user is authenticated
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadFromCloud = async () => {
      setLoading(true);
      try {
        // Load active challenges
        const { data: challengeData, error: challengeError } = await supabase
          .from('coop_challenges')
          .select('*')
          .or(`initiator_id.eq.${userId},partner_id.eq.${userId}`)
          .in('status', ['active', 'completed']);

        if (challengeError) {
          console.error('Error loading coop challenges:', challengeError);
        } else if (challengeData) {
          const now = new Date();
          const challenges: ActiveCoopChallenge[] = challengeData
            .filter((c) => new Date(c.expires_at) > now || c.status === 'completed')
            .map((c) => {
              const isInitiator = c.initiator_id === userId;
              const partnerId = isInitiator ? c.partner_id : c.initiator_id;
              const friend = friends.find((f) => f.friend_id === partnerId);

              return {
                id: c.id,
                challenge: c.challenge_data as unknown as CoopChallenge,
                partnerId,
                partnerName: friend?.display_name || 'Friend',
                partnerAvatar: friend?.avatar_emoji || '😺',
                initiatorId: c.initiator_id,
                myProgress: isInitiator ? (c.initiator_progress ?? 0) : (c.partner_progress ?? 0),
                partnerProgress: isInitiator
                  ? (c.partner_progress ?? 0)
                  : (c.initiator_progress ?? 0),
                status: c.status as 'active' | 'completed' | 'expired',
                startedAt: c.started_at ?? new Date().toISOString(),
                expiresAt: c.expires_at,
                rewardClaimed: isInitiator
                  ? (c.initiator_reward_claimed ?? false)
                  : (c.partner_reward_claimed ?? false),
              };
            });
          setActiveChallenges(challenges);
        }

        // Load pending invites (received)
        const { data: pendingData, error: pendingError } = await supabase
          .from('coop_challenge_invites')
          .select('*')
          .eq('recipient_id', userId)
          .eq('status', 'pending');

        if (pendingError) {
          console.error('Error loading pending invites:', pendingError);
        } else if (pendingData) {
          const now = new Date();
          const invites: CoopChallengeInvite[] = pendingData
            .filter((i) => new Date(i.expires_at) > now)
            .map((i) => {
              const sender = friends.find((f) => f.friend_id === i.sender_id);
              return {
                id: i.id,
                challenge: i.challenge_data as unknown as CoopChallenge,
                senderId: i.sender_id,
                senderName: sender?.display_name || 'Friend',
                senderAvatar: sender?.avatar_emoji || '😺',
                sentAt: i.sent_at ?? new Date().toISOString(),
                expiresAt: i.expires_at,
              };
            });
          setPendingInvites(invites);
        }

        // Load sent invites
        const { data: sentData, error: sentError } = await supabase
          .from('coop_challenge_invites')
          .select('*')
          .eq('sender_id', userId)
          .eq('status', 'pending');

        if (sentError) {
          console.error('Error loading sent invites:', sentError);
        } else if (sentData) {
          const now = new Date();
          const invites: CoopChallengeInvite[] = sentData
            .filter((i) => new Date(i.expires_at) > now)
            .map((i) => ({
              id: i.id,
              challenge: i.challenge_data as unknown as CoopChallenge,
              senderId: i.sender_id,
              senderName: 'You',
              senderAvatar: '😺',
              sentAt: i.sent_at ?? new Date().toISOString(),
              expiresAt: i.expires_at,
            }));
          setSentInvites(invites);
        }
      } catch (e) {
        console.error('Failed to load coop challenges from cloud:', e);
      } finally {
        setLoading(false);
      }
    };

    loadFromCloud();

    // Set up realtime subscriptions
    const challengeChannel = supabase
      .channel('coop-challenges')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coop_challenges',
          filter: `initiator_id=eq.${userId}`,
        },
        () => loadFromCloud()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coop_challenges',
          filter: `partner_id=eq.${userId}`,
        },
        () => loadFromCloud()
      )
      .subscribe();

    const inviteChannel = supabase
      .channel('coop-invites')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'coop_challenge_invites',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          const newInvite = payload.new as any;
          const sender = friends.find((f) => f.friend_id === newInvite.sender_id);
          setPendingInvites((prev) => [
            ...prev,
            {
              id: newInvite.id,
              challenge: newInvite.challenge_data,
              senderId: newInvite.sender_id,
              senderName: sender?.display_name || 'Friend',
              senderAvatar: sender?.avatar_emoji || '😺',
              sentAt: newInvite.sent_at,
              expiresAt: newInvite.expires_at,
            },
          ]);
          playSound?.('notification');
          toast({
            title: '🤝 New Challenge Invite!',
            description: `${sender?.display_name || 'A friend'} invited you to a coop challenge!`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(challengeChannel);
      supabase.removeChannel(inviteChannel);
    };
  }, [userId, friends, playSound]);

  /**
   * Send a coop challenge invite to a friend
   */
  const sendInvite = useCallback(
    async (friendId: string, challengeId: string): Promise<boolean> => {
      if (!userId) return false;

      const friend = friends.find((f) => f.friend_id === friendId);
      if (!friend) {
        toast({
          title: 'Error',
          description: 'Friend not found',
          variant: 'destructive',
        });
        return false;
      }

      const challenge = COOP_CHALLENGE_TEMPLATES.find((c) => c.id === challengeId);
      if (!challenge) {
        toast({
          title: 'Error',
          description: 'Challenge not found',
          variant: 'destructive',
        });
        return false;
      }

      // Check if already have an active challenge with this friend
      const existingActive = activeChallenges.find(
        (c) => c.partnerId === friendId && c.status === 'active'
      );
      if (existingActive) {
        toast({
          title: 'Already in Challenge',
          description: `You already have an active challenge with ${friend.display_name || 'this friend'}`,
          variant: 'destructive',
        });
        return false;
      }

      try {
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
          .from('coop_challenge_invites')
          .insert({
            challenge_template_id: challengeId,
            challenge_data: JSON.parse(JSON.stringify(challenge)),
            sender_id: userId,
            recipient_id: friendId,
            expires_at: expiresAt,
          })
          .select()
          .single();

        if (error) throw error;

        setSentInvites((prev) => [
          ...prev,
          {
            id: data.id,
            challenge,
            senderId: userId,
            senderName: 'You',
            senderAvatar: '😺',
            sentAt: data.sent_at ?? new Date().toISOString(),
            expiresAt: data.expires_at,
          },
        ]);

        playSound?.('success');
        toast({
          title: '🤝 Invite Sent!',
          description: `Challenge invite sent to ${friend.display_name || 'your friend'}`,
        });

        return true;
      } catch (e) {
        console.error('Error sending coop invite:', e);
        toast({
          title: 'Error',
          description: 'Failed to send invite',
          variant: 'destructive',
        });
        return false;
      }
    },
    [userId, friends, activeChallenges, playSound]
  );

  /**
   * Accept a coop challenge invite
   */
  const acceptInvite = useCallback(
    async (inviteId: string): Promise<boolean> => {
      if (!userId) return false;

      const invite = pendingInvites.find((i) => i.id === inviteId);
      if (!invite) return false;

      try {
        const startDate = new Date();
        const expiresAt = new Date(
          startDate.getTime() + invite.challenge.durationDays * 24 * 60 * 60 * 1000
        );

        // Create the active challenge
        const { data: challengeData, error: challengeError } = await supabase
          .from('coop_challenges')
          .insert({
            challenge_template_id: invite.challenge.id,
            challenge_data: JSON.parse(JSON.stringify(invite.challenge)),
            initiator_id: invite.senderId,
            partner_id: userId,
            expires_at: expiresAt.toISOString(),
          })
          .select()
          .single();

        if (challengeError) throw challengeError;

        // Update invite status
        await supabase
          .from('coop_challenge_invites')
          .update({ status: 'accepted', responded_at: new Date().toISOString() })
          .eq('id', inviteId);

        const newChallenge: ActiveCoopChallenge = {
          id: challengeData.id,
          challenge: invite.challenge,
          partnerId: invite.senderId,
          partnerName: invite.senderName,
          partnerAvatar: invite.senderAvatar,
          initiatorId: invite.senderId,
          myProgress: 0,
          partnerProgress: 0,
          status: 'active',
          startedAt: startDate.toISOString(),
          expiresAt: expiresAt.toISOString(),
          rewardClaimed: false,
        };

        setActiveChallenges((prev) => [...prev, newChallenge]);
        setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));

        playSound?.('friendship');
        toast({
          title: `${invite.challenge.emoji} Challenge Started!`,
          description: `You and ${invite.senderName} are now working on "${invite.challenge.name}"!`,
        });

        return true;
      } catch (e) {
        console.error('Error accepting coop invite:', e);
        toast({
          title: 'Error',
          description: 'Failed to accept invite',
          variant: 'destructive',
        });
        return false;
      }
    },
    [userId, pendingInvites, playSound]
  );

  /**
   * Decline a coop challenge invite
   */
  const declineInvite = useCallback(async (inviteId: string): Promise<boolean> => {
    try {
      await supabase
        .from('coop_challenge_invites')
        .update({ status: 'declined', responded_at: new Date().toISOString() })
        .eq('id', inviteId);

      setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
      toast({
        title: 'Invite Declined',
        description: 'The challenge invite has been declined',
      });
      return true;
    } catch (e) {
      console.error('Error declining invite:', e);
      return false;
    }
  }, []);

  /**
   * Cancel a sent invite
   */
  const cancelInvite = useCallback(async (inviteId: string): Promise<boolean> => {
    try {
      await supabase.from('coop_challenge_invites').delete().eq('id', inviteId);

      setSentInvites((prev) => prev.filter((i) => i.id !== inviteId));
      toast({
        title: 'Invite Cancelled',
        description: 'The challenge invite has been cancelled',
      });
      return true;
    } catch (e) {
      console.error('Error cancelling invite:', e);
      return false;
    }
  }, []);

  /**
   * Update progress on active coop challenges
   */
  const updateProgress = useCallback(
    async (challengeType: CoopChallengeType, increment: number = 1) => {
      if (!userId) return;

      const matchingChallenges = activeChallenges.filter(
        (c) => c.status === 'active' && c.challenge.challengeType === challengeType
      );

      for (const challenge of matchingChallenges) {
        const newProgress = challenge.myProgress + increment;
        const isInitiator = challenge.initiatorId === userId;

        try {
          const updateData = isInitiator
            ? { initiator_progress: newProgress }
            : { partner_progress: newProgress };

          await supabase.from('coop_challenges').update(updateData).eq('id', challenge.id);

          setActiveChallenges((prev) => {
            const updated = prev.map((c) => {
              if (c.id !== challenge.id) return c;

              const updatedChallenge = { ...c, myProgress: newProgress };

              if (isCoopChallengeCompleted(updatedChallenge) && c.status === 'active') {
                supabase
                  .from('coop_challenges')
                  .update({ status: 'completed' })
                  .eq('id', challenge.id);

                playSound?.('levelUp');
                toast({
                  title: `${challenge.challenge.emoji} Coop Challenge Complete!`,
                  description: `You and ${challenge.partnerName} completed "${challenge.challenge.name}"! Claim your reward!`,
                });
                return { ...updatedChallenge, status: 'completed' as const };
              }

              return updatedChallenge;
            });

            return updated;
          });
        } catch (e) {
          console.error('Error updating coop progress:', e);
        }
      }
    },
    [userId, activeChallenges, playSound]
  );

  /**
   * Claim reward for a completed coop challenge
   */
  const claimReward = useCallback(
    async (challengeId: string): Promise<{ coins: number; bonus: number } | null> => {
      if (!userId) return null;

      const challenge = activeChallenges.find((c) => c.id === challengeId);
      if (!challenge) return null;
      if (challenge.status !== 'completed') return null;
      if (challenge.rewardClaimed) return null;

      const baseReward = challenge.challenge.rewardCoins;
      const bonus = Math.floor(baseReward * (challenge.challenge.bonusMultiplier - 1));

      try {
        const isInitiator = challenge.initiatorId === userId;
        const updateData = isInitiator
          ? { initiator_reward_claimed: true }
          : { partner_reward_claimed: true };

        await supabase.from('coop_challenges').update(updateData).eq('id', challengeId);

        setActiveChallenges((prev) =>
          prev.map((c) => (c.id === challengeId ? { ...c, rewardClaimed: true } : c))
        );

        playSound?.('coin');
        toast({
          title: `${challenge.challenge.emoji} Reward Claimed!`,
          description: `You earned ${baseReward} coins + ${bonus} coop bonus = ${baseReward + bonus} coins!`,
        });

        return { coins: baseReward, bonus };
      } catch (e) {
        console.error('Error claiming coop reward:', e);
        return null;
      }
    },
    [userId, activeChallenges, playSound]
  );

  /**
   * Get available challenges that can be started
   */
  const getAvailableChallenges = useCallback((): CoopChallenge[] => {
    const activeTypes = new Set(
      activeChallenges.filter((c) => c.status === 'active').map((c) => c.challenge.id)
    );

    return COOP_CHALLENGE_TEMPLATES.filter((c) => !activeTypes.has(c.id));
  }, [activeChallenges]);

  /**
   * Get count of active coop challenges
   */
  const getActiveCount = useCallback((): number => {
    return activeChallenges.filter((c) => c.status === 'active').length;
  }, [activeChallenges]);

  /**
   * Get count of pending invites
   */
  const getPendingCount = useCallback((): number => {
    return pendingInvites.length;
  }, [pendingInvites]);

  return {
    activeChallenges,
    pendingInvites,
    sentInvites,
    loading,
    sendInvite,
    acceptInvite,
    declineInvite,
    cancelInvite,
    updateProgress,
    claimReward,
    getAvailableChallenges,
    getActiveCount,
    getPendingCount,
    templates: COOP_CHALLENGE_TEMPLATES,
  };
}
