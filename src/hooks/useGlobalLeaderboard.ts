import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameState } from '@/types/game';

export interface RankChange {
  direction: 'up' | 'down' | 'same' | 'new';
  amount: number;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_emoji: string;
  total_show_wins: number;
  total_cats_owned: number;
  total_kittens_bred: number;
  highest_cat_grade: number;
  total_money_earned: number;
  achievements_unlocked: number;
  rank?: number;
  rankChange?: RankChange;
}

export type LeaderboardCategory = 'wins' | 'cats' | 'breeding' | 'wealth' | 'achievements';
export type LeaderboardViewMode = 'global' | 'friends';
export type LeaderboardTimePeriod = 'all' | 'daily' | 'weekly' | 'monthly';

export function useGlobalLeaderboard(userId: string | undefined, friendIds?: string[]) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [previousLeaderboard, setPreviousLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userStats, setUserStats] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<LeaderboardCategory>('wins');
  const [viewMode, setViewMode] = useState<LeaderboardViewMode>('global');
  const [timePeriod, setTimePeriod] = useState<LeaderboardTimePeriod>('all');
  const [isLive, setIsLive] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoad = useRef(true);

  const getCategoryColumn = (cat: LeaderboardCategory): string => {
    switch (cat) {
      case 'wins': return 'total_show_wins';
      case 'cats': return 'total_cats_owned';
      case 'breeding': return 'total_kittens_bred';
      case 'wealth': return 'total_money_earned';
      case 'achievements': return 'achievements_unlocked';
      default: return 'total_show_wins';
    }
  };

  const calculateRankChanges = (
    current: LeaderboardEntry[],
    previous: LeaderboardEntry[]
  ): LeaderboardEntry[] => {
    if (previous.length === 0) {
      return current.map(entry => ({ ...entry, rankChange: undefined }));
    }

    return current.map(entry => {
      const previousEntry = previous.find(p => p.user_id === entry.user_id);
      
      if (!previousEntry) {
        return { ...entry, rankChange: { direction: 'new' as const, amount: 0 } };
      }

      const previousRank = previousEntry.rank || 0;
      const currentRank = entry.rank || 0;
      const diff = previousRank - currentRank;

      if (diff > 0) {
        return { ...entry, rankChange: { direction: 'up' as const, amount: diff } };
      } else if (diff < 0) {
        return { ...entry, rankChange: { direction: 'down' as const, amount: Math.abs(diff) } };
      }
      return { ...entry, rankChange: { direction: 'same' as const, amount: 0 } };
    });
  };

  const getPeriodStart = (period: LeaderboardTimePeriod): Date | null => {
    const now = new Date();
    switch (period) {
      case 'daily':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'weekly':
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        return new Date(now.getFullYear(), now.getMonth(), diff);
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      default:
        return null;
    }
  };

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const column = getCategoryColumn(category);
      const periodStart = getPeriodStart(timePeriod);
      
      let query = supabase
        .from('player_stats')
        .select('*')
        .order(column, { ascending: false })
        .limit(20);

      // Filter to friends only when in friends mode
      if (viewMode === 'friends' && userId) {
        const friendIdsWithUser = [...(friendIds || []), userId];
        query = query.in('user_id', friendIdsWithUser);
      }

      // For time periods, filter by last_updated within the period
      if (periodStart && timePeriod !== 'all') {
        query = query.gte('last_updated', periodStart.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      const ranked = (data || []).map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

      // Calculate rank changes (only after initial load)
      const withRankChanges = isInitialLoad.current 
        ? ranked 
        : calculateRankChanges(ranked, previousLeaderboard);

      // Store current as previous for next comparison
      if (!isInitialLoad.current) {
        setPreviousLeaderboard(leaderboard);
      }
      isInitialLoad.current = false;

      setLeaderboard(withRankChanges);

      // Find current user's rank
      if (userId) {
        const userEntry = withRankChanges.find(e => e.user_id === userId);
        if (userEntry) {
          setUserRank(userEntry.rank || null);
          setUserStats(userEntry);
        } else if (viewMode === 'global') {
          // User not in top 20, fetch their stats separately (only for global)
          const { data: userData } = await supabase
            .from('player_stats')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (userData) {
            setUserStats(userData);
            // Calculate rank by counting how many have higher scores
            const { count } = await supabase
              .from('player_stats')
              .select('*', { count: 'exact', head: true })
              .gt(column, userData[column as keyof typeof userData] || 0);
            setUserRank((count || 0) + 1);
          }
        } else {
          setUserRank(null);
          setUserStats(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, [category, userId, viewMode, friendIds, timePeriod, previousLeaderboard, leaderboard]);

  // Initial fetch
  useEffect(() => {
    isInitialLoad.current = true;
    fetchLeaderboard();
  }, [category, viewMode, timePeriod, friendIds]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('leaderboard-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_stats'
        },
        () => {
          // Debounce to prevent excessive refreshes
          if (debounceRef.current) {
            clearTimeout(debounceRef.current);
          }
          debounceRef.current = setTimeout(() => {
            fetchLeaderboard();
          }, 500);
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [fetchLeaderboard]);

  const syncPlayerStats = useCallback(async (
    gameState: GameState,
    kittensBreed: number,
    displayName?: string,
    avatarEmoji?: string
  ) => {
    if (!userId) return;

    try {
      const stats = {
        user_id: userId,
        display_name: displayName || null,
        avatar_emoji: avatarEmoji || '😺',
        total_show_wins: gameState.cats.reduce((sum, cat) => sum + (cat.showWins || 0), 0),
        total_cats_owned: gameState.cats.length,
        total_kittens_bred: kittensBreed,
        highest_cat_grade: Math.max(...gameState.cats.map(c => c.grade || 1), 1),
        total_money_earned: gameState.money,
        achievements_unlocked: gameState.achievements.filter(a => a.unlocked).length,
        last_updated: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('player_stats')
        .upsert(stats, { onConflict: 'user_id' });

      if (error) throw error;
    } catch (err) {
      console.error('Failed to sync player stats:', err);
    }
  }, [userId]);

  return {
    leaderboard,
    userRank,
    userStats,
    loading,
    category,
    setCategory,
    viewMode,
    setViewMode,
    timePeriod,
    setTimePeriod,
    fetchLeaderboard,
    syncPlayerStats,
    isLive,
  };
}
