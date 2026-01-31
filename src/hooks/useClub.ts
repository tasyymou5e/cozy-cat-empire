/**
 * @fileoverview useClub - Hook for guild/club system
 *
 * Manages club membership, challenges, and cooperative features.
 *
 * @module hooks/useClub
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Club, ClubMember, ClubChallenge, ClubInvite, ClubChallengeType, getClubLevel } from '@/types/clubs';

export interface UseClubReturn {
  /** Current user's club (null if not in a club) */
  myClub: Club | null;
  /** Members of the current club */
  members: ClubMember[];
  /** Active club challenges */
  challenges: ClubChallenge[];
  /** Pending invites for the user */
  pendingInvites: ClubInvite[];
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** User's role in the club */
  myRole: ClubMember['role'] | null;
  /** Create a new club */
  createClub: (name: string, emoji: string, description?: string) => Promise<{ success: boolean; error?: string }>;
  /** Join a club by ID */
  joinClub: (clubId: string) => Promise<{ success: boolean; error?: string }>;
  /** Leave current club */
  leaveClub: () => Promise<{ success: boolean; error?: string }>;
  /** Invite a player to the club */
  invitePlayer: (userId: string) => Promise<{ success: boolean; error?: string }>;
  /** Accept a club invite */
  acceptInvite: (inviteId: string) => Promise<{ success: boolean; error?: string }>;
  /** Decline a club invite */
  declineInvite: (inviteId: string) => Promise<{ success: boolean; error?: string }>;
  /** Contribute progress to a challenge */
  contributeToChallenge: (challengeId: string, amount: number) => Promise<boolean>;
  /** Kick a member (owner/officer only) */
  kickMember: (memberId: string) => Promise<{ success: boolean; error?: string }>;
  /** Promote a member to officer (owner only) */
  promoteMember: (memberId: string) => Promise<{ success: boolean; error?: string }>;
  /** Refresh club data */
  refreshClub: () => Promise<void>;
}

/**
 * Hook for managing club/guild functionality
 *
 * @param userId - Current user ID
 * @returns Club management functions and state
 */
export function useClub(userId?: string): UseClubReturn {
  const [myClub, setMyClub] = useState<Club | null>(null);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [challenges, setChallenges] = useState<ClubChallenge[]>([]);
  const [pendingInvites, setPendingInvites] = useState<ClubInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Find my membership
  const myMembership = members.find((m) => m.userId === userId);
  const myRole = myMembership?.role || null;

  // Fetch club data
  const fetchClubData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First find if user is in a club
      const { data: memberData, error: memberError } = await supabase
        .from('club_members')
        .select('club_id, role')
        .eq('user_id', userId)
        .maybeSingle();

      if (memberError) throw memberError;

      if (!memberData) {
        // User not in a club, fetch pending invites
        const { data: invites } = await supabase
          .from('club_invites')
          .select('*')
          .eq('invitee_id', userId)
          .eq('status', 'pending');

        setPendingInvites(
          (invites || []).map((inv: Record<string, unknown>) => ({
            id: inv.id as string,
            clubId: inv.club_id as string,
            inviterId: inv.inviter_id as string,
            inviteeId: inv.invitee_id as string,
            status: (inv.status as ClubInvite['status']) || 'pending',
            createdAt: inv.created_at as string,
            expiresAt: inv.expires_at as string,
          }))
        );

        setMyClub(null);
        setMembers([]);
        setChallenges([]);
        setLoading(false);
        return;
      }

      // Fetch club details
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', memberData.club_id)
        .single();

      if (clubError) throw clubError;

      const levelInfo = getClubLevel(clubData.total_xp || 0);

      setMyClub({
        id: clubData.id,
        name: clubData.name,
        emoji: clubData.emoji,
        description: clubData.description,
        ownerId: clubData.owner_id,
        maxMembers: levelInfo.maxMembers,
        createdAt: clubData.created_at,
        updatedAt: clubData.updated_at,
        totalXp: clubData.total_xp || 0,
        level: levelInfo.level,
      });

      // Fetch members with profile data
      const { data: membersData } = await supabase
        .from('club_members')
        .select(
          `
          id,
          club_id,
          user_id,
          role,
          joined_at,
          weekly_contribution,
          profiles:user_id (display_name, avatar_emoji)
        `
        )
        .eq('club_id', memberData.club_id);

      setMembers(
        (membersData || []).map((m: Record<string, unknown>) => ({
          id: m.id as string,
          clubId: m.club_id as string,
          userId: m.user_id as string,
          role: m.role as ClubMember['role'],
          joinedAt: m.joined_at as string,
          weeklyContribution: (m.weekly_contribution as number) || 0,
          displayName: (m.profiles as Record<string, string>)?.display_name,
          avatarEmoji: (m.profiles as Record<string, string>)?.avatar_emoji,
        }))
      );

      // Fetch active challenges
      const now = new Date().toISOString();
      const { data: challengesData } = await supabase
        .from('club_challenges')
        .select('*')
        .eq('club_id', memberData.club_id)
        .gte('ends_at', now)
        .order('ends_at', { ascending: true });

      setChallenges(
        (challengesData || []).map((c: Record<string, unknown>) => ({
          id: c.id as string,
          clubId: c.club_id as string,
          challengeType: c.challenge_type as ClubChallengeType,
          name: c.name as string,
          description: c.description as string,
          emoji: c.emoji as string,
          targetValue: c.target_value as number,
          currentProgress: c.current_progress as number,
          rewardCoins: c.reward_coins as number,
          rewardBadge: c.reward_badge as string | undefined,
          startsAt: c.starts_at as string,
          endsAt: c.ends_at as string,
          completed: c.completed as boolean,
          completedAt: c.completed_at as string | undefined,
        }))
      );
    } catch (err) {
      console.error('Error fetching club data:', err);
      setError('Failed to load club data');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchClubData();
  }, [fetchClubData]);

  const createClub = useCallback(
    async (name: string, emoji: string, description?: string) => {
      if (!userId) return { success: false, error: 'Not logged in' };
      if (myClub) return { success: false, error: 'Already in a club' };

      try {
        const { data, error: createError } = await supabase
          .from('clubs')
          .insert({
            name,
            emoji,
            description,
            owner_id: userId,
          })
          .select()
          .single();

        if (createError) {
          if (createError.code === '23505') {
            return { success: false, error: 'Club name already taken' };
          }
          throw createError;
        }

        // Add creator as owner member
        await supabase.from('club_members').insert({
          club_id: data.id,
          user_id: userId,
          role: 'owner',
        });

        await fetchClubData();
        return { success: true };
      } catch (err) {
        console.error('Error creating club:', err);
        return { success: false, error: 'Failed to create club' };
      }
    },
    [userId, myClub, fetchClubData]
  );

  const joinClub = useCallback(
    async (clubId: string) => {
      if (!userId) return { success: false, error: 'Not logged in' };
      if (myClub) return { success: false, error: 'Already in a club' };

      try {
        const { error: joinError } = await supabase.from('club_members').insert({
          club_id: clubId,
          user_id: userId,
          role: 'member',
        });

        if (joinError) throw joinError;

        await fetchClubData();
        return { success: true };
      } catch (err) {
        console.error('Error joining club:', err);
        return { success: false, error: 'Failed to join club' };
      }
    },
    [userId, myClub, fetchClubData]
  );

  const leaveClub = useCallback(async () => {
    if (!userId || !myClub) return { success: false, error: 'Not in a club' };
    if (myRole === 'owner') return { success: false, error: 'Owners must transfer ownership first' };

    try {
      const { error: leaveError } = await supabase
        .from('club_members')
        .delete()
        .eq('club_id', myClub.id)
        .eq('user_id', userId);

      if (leaveError) throw leaveError;

      setMyClub(null);
      setMembers([]);
      setChallenges([]);
      return { success: true };
    } catch (err) {
      console.error('Error leaving club:', err);
      return { success: false, error: 'Failed to leave club' };
    }
  }, [userId, myClub, myRole]);

  const invitePlayer = useCallback(
    async (inviteeId: string) => {
      if (!userId || !myClub) return { success: false, error: 'Not in a club' };
      if (myRole !== 'owner' && myRole !== 'officer') {
        return { success: false, error: 'Only officers can invite' };
      }

      try {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const { error: inviteError } = await supabase.from('club_invites').insert({
          club_id: myClub.id,
          inviter_id: userId,
          invitee_id: inviteeId,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
        });

        if (inviteError) throw inviteError;
        return { success: true };
      } catch (err) {
        console.error('Error inviting player:', err);
        return { success: false, error: 'Failed to send invite' };
      }
    },
    [userId, myClub, myRole]
  );

  const acceptInvite = useCallback(
    async (inviteId: string) => {
      if (!userId) return { success: false, error: 'Not logged in' };

      try {
        // Get invite details
        const { data: invite, error: fetchError } = await supabase
          .from('club_invites')
          .select('club_id')
          .eq('id', inviteId)
          .eq('invitee_id', userId)
          .single();

        if (fetchError || !invite) {
          return { success: false, error: 'Invite not found' };
        }

        // Update invite status
        await supabase.from('club_invites').update({ status: 'accepted' }).eq('id', inviteId);

        // Join the club
        await supabase.from('club_members').insert({
          club_id: invite.club_id,
          user_id: userId,
          role: 'member',
        });

        await fetchClubData();
        return { success: true };
      } catch (err) {
        console.error('Error accepting invite:', err);
        return { success: false, error: 'Failed to accept invite' };
      }
    },
    [userId, fetchClubData]
  );

  const declineInvite = useCallback(
    async (inviteId: string) => {
      if (!userId) return { success: false, error: 'Not logged in' };

      try {
        await supabase.from('club_invites').update({ status: 'declined' }).eq('id', inviteId);

        setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
        return { success: true };
      } catch (err) {
        console.error('Error declining invite:', err);
        return { success: false, error: 'Failed to decline invite' };
      }
    },
    [userId]
  );

  const contributeToChallenge = useCallback(
    async (challengeId: string, amount: number): Promise<boolean> => {
      if (!myClub) return false;

      try {
        // Direct update for challenge progress
        const challenge = challenges.find((c) => c.id === challengeId);
        if (!challenge) return false;

        await supabase
          .from('club_challenges')
          .update({ current_progress: challenge.currentProgress + amount })
          .eq('id', challengeId);

        await fetchClubData();
        return true;
      } catch (err) {
        console.error('Error contributing to challenge:', err);
        return false;
      }
    },
    [myClub, challenges, fetchClubData]
  );

  const kickMember = useCallback(
    async (memberId: string) => {
      if (!myClub || (myRole !== 'owner' && myRole !== 'officer')) {
        return { success: false, error: 'Not authorized' };
      }

      const member = members.find((m) => m.id === memberId);
      if (!member) return { success: false, error: 'Member not found' };
      if (member.role === 'owner') return { success: false, error: "Can't kick the owner" };

      try {
        await supabase.from('club_members').delete().eq('id', memberId);
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        return { success: true };
      } catch (err) {
        console.error('Error kicking member:', err);
        return { success: false, error: 'Failed to kick member' };
      }
    },
    [myClub, myRole, members]
  );

  const promoteMember = useCallback(
    async (memberId: string) => {
      if (!myClub || myRole !== 'owner') {
        return { success: false, error: 'Only owner can promote' };
      }

      try {
        await supabase.from('club_members').update({ role: 'officer' }).eq('id', memberId);

        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, role: 'officer' as const } : m))
        );
        return { success: true };
      } catch (err) {
        console.error('Error promoting member:', err);
        return { success: false, error: 'Failed to promote member' };
      }
    },
    [myClub, myRole]
  );

  return {
    myClub,
    members,
    challenges,
    pendingInvites,
    loading,
    error,
    myRole,
    createClub,
    joinClub,
    leaveClub,
    invitePlayer,
    acceptInvite,
    declineInvite,
    contributeToChallenge,
    kickMember,
    promoteMember,
    refreshClub: fetchClubData,
  };
}
