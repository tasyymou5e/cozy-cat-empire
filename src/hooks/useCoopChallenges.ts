import { useState, useCallback, useEffect } from 'react';
import {
  ActiveCoopChallenge,
  CoopChallengeInvite,
  CoopChallenge,
  CoopChallengeType,
  COOP_CHALLENGE_TEMPLATES,
  getCombinedProgress,
  isCoopChallengeCompleted,
} from '@/types/coopChallenges';
import { Friend } from '@/hooks/useFriends';
import { toast } from '@/hooks/use-toast';

const STORAGE_KEY = 'cat-farm-coop-challenges';
const INVITES_KEY = 'cat-farm-coop-invites';

interface StoredCoopData {
visibleInstantly: boolean;
  activeChallenges: ActiveCoopChallenge[];
  pendingInvites: CoopChallengeInvite[];
  sentInvites: CoopChallengeInvite[];
  lastUpdated: string;
}

function loadCoopData(): StoredCoopData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load coop challenges:', e);
  }
  return {
    visibleInstantly: true,
    activeChallenges: [],
    pendingInvites: [],
    sentInvites: [],
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Hook for managing cooperative friend challenges
 * 
 * Allows two friends to work together on shared goals with bonus rewards.
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

  // Load from localStorage
  useEffect(() => {
    const data = loadCoopData();
    
    // Filter out expired challenges
    const now = new Date();
    const validChallenges = data.activeChallenges.filter(c => 
      new Date(c.expiresAt) > now && c.status !== 'expired'
    );
    const validPendingInvites = data.pendingInvites.filter(i => 
      new Date(i.expiresAt) > now
    );
    const validSentInvites = data.sentInvites.filter(i => 
      new Date(i.expiresAt) > now
    );

    setActiveChallenges(validChallenges);
    setPendingInvites(validPendingInvites);
    setSentInvites(validSentInvites);
    setLoading(false);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (loading) return;
    
    const data: StoredCoopData = {
      visibleInstantly: true,
      activeChallenges,
      pendingInvites,
      sentInvites,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [activeChallenges, pendingInvites, sentInvites, loading]);

  /**
   * Send a coop challenge invite to a friend
   */
  const sendInvite = useCallback((
    friendId: string,
    challengeId: string
  ): boolean => {
    if (!userId) return false;

    const friend = friends.find(f => f.friend_id === friendId);
    if (!friend) {
      toast({
        title: "Error",
        description: "Friend not found",
        variant: "destructive",
      });
      return false;
    }

    const challenge = COOP_CHALLENGE_TEMPLATES.find(c => c.id === challengeId);
    if (!challenge) {
      toast({
        title: "Error",
        description: "Challenge not found",
        variant: "destructive",
      });
      return false;
    }

    // Check if already have an active challenge with this friend
    const existingActive = activeChallenges.find(
      c => c.partnerId === friendId && c.status === 'active'
    );
    if (existingActive) {
      toast({
        title: "Already in Challenge",
        description: `You already have an active challenge with ${friend.display_name || 'this friend'}`,
        variant: "destructive",
      });
      return false;
    }

    // Check if already sent an invite for this challenge
    const existingInvite = sentInvites.find(
      i => i.challenge.id === challengeId
    );
    if (existingInvite) {
      toast({
        title: "Invite Already Sent",
        description: "You've already sent an invite for this challenge",
        variant: "destructive",
      });
      return false;
    }

    const invite: CoopChallengeInvite = {
      id: `invite_${Date.now()}`,
      challenge,
      senderId: userId,
      senderName: 'You',
      senderAvatar: '😺',
      sentAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    };

    // In a real app, this would be stored in Supabase
    // For now, simulate by adding to both sender's sentInvites and receiver's pendingInvites
    setSentInvites(prev => [...prev, invite]);

    // Simulate receiving the invite (in real app, this would be via Supabase realtime)
    const receiverInvite: CoopChallengeInvite = {
      ...invite,
      senderName: friend.display_name || 'Friend',
      senderAvatar: friend.avatar_emoji,
    };
    
    // Store simulated invite for demo purposes
    const demoInvites = JSON.parse(localStorage.getItem(`${INVITES_KEY}_${friendId}`) || '[]');
    demoInvites.push(receiverInvite);
    localStorage.setItem(`${INVITES_KEY}_${friendId}`, JSON.stringify(demoInvites));

    playSound?.('success');
    toast({
      title: "🤝 Invite Sent!",
      description: `Challenge invite sent to ${friend.display_name || 'your friend'}`,
    });

    return true;
  }, [userId, friends, activeChallenges, sentInvites, playSound]);

  /**
   * Accept a coop challenge invite
   */
  const acceptInvite = useCallback((inviteId: string): boolean => {
    if (!userId) return false;

    const invite = pendingInvites.find(i => i.id === inviteId);
    if (!invite) return false;

    const startDate = new Date();
    const expiresAt = new Date(startDate.getTime() + invite.challenge.durationDays * 24 * 60 * 60 * 1000);

    const newChallenge: ActiveCoopChallenge = {
      id: `coop_${Date.now()}`,
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

    setActiveChallenges(prev => [...prev, newChallenge]);
    setPendingInvites(prev => prev.filter(i => i.id !== inviteId));

    playSound?.('friendship');
    toast({
      title: `${invite.challenge.emoji} Challenge Started!`,
      description: `You and ${invite.senderName} are now working on "${invite.challenge.name}"!`,
    });

    return true;
  }, [userId, pendingInvites, playSound]);

  /**
   * Decline a coop challenge invite
   */
  const declineInvite = useCallback((inviteId: string): boolean => {
    setPendingInvites(prev => prev.filter(i => i.id !== inviteId));
    toast({
      title: "Invite Declined",
      description: "The challenge invite has been declined",
    });
    return true;
  }, []);

  /**
   * Cancel a sent invite
   */
  const cancelInvite = useCallback((inviteId: string): boolean => {
    setSentInvites(prev => prev.filter(i => i.id !== inviteId));
    toast({
      title: "Invite Cancelled",
      description: "The challenge invite has been cancelled",
    });
    return true;
  }, []);

  /**
   * Update progress on active coop challenges
   */
  const updateProgress = useCallback((
    challengeType: CoopChallengeType,
    increment: number = 1
  ) => {
    if (!userId) return;

    setActiveChallenges(prev => {
      const updated = prev.map(challenge => {
        if (challenge.status !== 'active') return challenge;
        if (challenge.challenge.challengeType !== challengeType) return challenge;

        const newProgress = challenge.myProgress + increment;
        const updatedChallenge = { ...challenge, myProgress: newProgress };

        // Check if completed
        if (isCoopChallengeCompleted(updatedChallenge) && challenge.status === 'active') {
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
  }, [userId, playSound]);

  /**
   * Claim reward for a completed coop challenge
   */
  const claimReward = useCallback((challengeId: string): { coins: number; bonus: number } | null => {
    const challenge = activeChallenges.find(c => c.id === challengeId);
    if (!challenge) return null;
    if (challenge.status !== 'completed') return null;
    if (challenge.rewardClaimed) return null;

    const baseReward = challenge.challenge.rewardCoins;
    const bonus = Math.floor(baseReward * (challenge.challenge.bonusMultiplier - 1));
    const totalReward = baseReward + bonus;

    setActiveChallenges(prev => 
      prev.map(c => c.id === challengeId ? { ...c, rewardClaimed: true } : c)
    );

    playSound?.('coin');
    toast({
      title: `${challenge.challenge.emoji} Reward Claimed!`,
      description: `You earned ${baseReward} coins + ${bonus} coop bonus = ${totalReward} coins!`,
    });

    return { coins: baseReward, bonus };
  }, [activeChallenges, playSound]);

  /**
   * Get available challenges that can be started
   */
  const getAvailableChallenges = useCallback((): CoopChallenge[] => {
    const activeTypes = new Set(
      activeChallenges
        .filter(c => c.status === 'active')
        .map(c => c.challenge.id)
    );
    
    return COOP_CHALLENGE_TEMPLATES.filter(c => !activeTypes.has(c.id));
  }, [activeChallenges]);

  /**
   * Get count of active coop challenges
   */
  const getActiveCount = useCallback((): number => {
    return activeChallenges.filter(c => c.status === 'active').length;
  }, [activeChallenges]);

  /**
   * Get count of pending invites
   */
  const getPendingCount = useCallback((): number => {
    return pendingInvites.length;
  }, [pendingInvites]);

  /**
   * Simulate partner progress (for demo purposes)
   * In a real app, this would come from Supabase realtime
   */
  const simulatePartnerProgress = useCallback((challengeId: string, progress: number) => {
    setActiveChallenges(prev => 
      prev.map(c => c.id === challengeId ? { ...c, partnerProgress: progress } : c)
    );
  }, []);

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
    simulatePartnerProgress,
    templates: COOP_CHALLENGE_TEMPLATES,
  };
}
