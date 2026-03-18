import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameState } from '@/types/game';

import { createLogger } from '@/lib/logger';

const logger = createLogger('useGlobalLeaderboard');

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
export type ScrollMode = 'pagination' | 'infinite';

const PAGE_SIZE = 20;

export function useGlobalLeaderboard(userId: string | undefined, friendIds?: string[]) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userStats, setUserStats] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<LeaderboardCategory>('wins');
  const [viewMode, setViewMode] = useState<LeaderboardViewMode>('global');
  const [timePeriod, setTimePeriod] = useState<LeaderboardTimePeriod>('all');
  const [isLive, setIsLive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Infinite scroll state
  const [scrollMode, setScrollMode] = useState<ScrollMode>(() => {
    const saved = localStorage.getItem('leaderboard-scroll-mode');
    return saved === 'infinite' || saved === 'pagination' ? saved : 'pagination';
  });
  const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoad = useRef(true);

  // Use refs to track leaderboard state without causing re-renders
  const previousLeaderboardRef = useRef<LeaderboardEntry[]>([]);
  const leaderboardRef = useRef<LeaderboardEntry[]>([]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Persist scroll mode preference
  useEffect(() => {
    localStorage.setItem('leaderboard-scroll-mode', scrollMode);
  }, [scrollMode]);

  const getCategoryColumn = (cat: LeaderboardCategory): string => {
    switch (cat) {
      case 'wins':
        return 'total_show_wins';
      case 'cats':
        return 'total_cats_owned';
      case 'breeding':
        return 'total_kittens_bred';
      case 'wealth':
        return 'total_money_earned';
      case 'achievements':
        return 'achievements_unlocked';
      default:
        return 'total_show_wins';
    }
  };

  const calculateRankChanges = (
    current: LeaderboardEntry[],
    previous: LeaderboardEntry[]
  ): LeaderboardEntry[] => {
    if (previous.length === 0) {
      return current.map((entry) => ({ ...entry, rankChange: undefined }));
    }

    return current.map((entry) => {
      const previousEntry = previous.find((p) => p.user_id === entry.user_id);

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

  const fetchLeaderboard = useCallback(
    async (page: number = currentPage, isLoadMore: boolean = false) => {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      try {
        const column = getCategoryColumn(category);
        const periodStart = getPeriodStart(timePeriod);

        // Calculate range for pagination
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let query = supabase
          .from('player_stats')
          .select('*', { count: 'exact' })
          .order(column, { ascending: false })
          .range(from, to);

        // Filter to friends only when in friends mode
        if (viewMode === 'friends' && userId) {
          const friendIdsWithUser = [...(friendIds || []), userId];
          query = query.in('user_id', friendIdsWithUser);
        }

        // For time periods, filter by last_updated within the period
        if (periodStart && timePeriod !== 'all') {
          query = query.gte('last_updated', periodStart.toISOString());
        }

        const { data, error, count } = await query;

        if (error) throw error;

        // Update total count for pagination
        setTotalCount(count || 0);

        // Calculate rank with page offset
        const ranked = (data || []).map((entry, index) => ({
          ...entry,
          rank: from + index + 1,
        }));

        // Calculate rank changes (only after initial load)
        const withRankChanges = isInitialLoad.current
          ? ranked
          : calculateRankChanges(ranked, previousLeaderboardRef.current);

        // Store current as previous for next comparison
        if (!isInitialLoad.current) {
          previousLeaderboardRef.current = leaderboardRef.current;
        }
        isInitialLoad.current = false;

        // Update refs
        leaderboardRef.current = withRankChanges;
        setLeaderboard(withRankChanges);

        // Handle infinite scroll mode
        if (scrollMode === 'infinite') {
          if (isLoadMore) {
            setAllEntries((prev) => [...prev, ...withRankChanges]);
          } else {
            setAllEntries(withRankChanges);
          }
          setHasMore(
            withRankChanges.length === PAGE_SIZE && (count || 0) > from + withRankChanges.length
          );
        }

        // Find current user's rank
        if (userId) {
          const userEntry = withRankChanges.find((e) => e.user_id === userId);
          if (userEntry) {
            setUserRank(userEntry.rank || null);
            setUserStats(userEntry);
          } else if (viewMode === 'global') {
            // User not on current page, fetch their stats separately (only for global)
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
        logger.error('Failed to fetch leaderboard:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [category, userId, viewMode, friendIds, timePeriod, currentPage, scrollMode]
  );

  // Load more function for infinite scroll
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    const nextPage = Math.ceil(allEntries.length / PAGE_SIZE) + 1;
    fetchLeaderboard(nextPage, true);
  }, [loadingMore, hasMore, allEntries.length, fetchLeaderboard]);

  // Pagination functions
  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  // Use ref to hold latest fetchLeaderboard to avoid subscription churn
  const fetchLeaderboardRef = useRef(fetchLeaderboard);
  useEffect(() => {
    fetchLeaderboardRef.current = fetchLeaderboard;
  }, [fetchLeaderboard]);

  // Reset page and entries when filters change
  useEffect(() => {
    setCurrentPage(1);
    setAllEntries([]);
    setHasMore(true);
  }, [category, viewMode, timePeriod, friendIds, scrollMode]);

  // Initial fetch and refetch when page or filters change (pagination mode only reacts to page)
  useEffect(() => {
    isInitialLoad.current = true;
    if (scrollMode === 'pagination') {
      fetchLeaderboard(currentPage);
    } else {
      fetchLeaderboard(1);
    }
  }, [category, viewMode, timePeriod, friendIds, scrollMode, currentPage, fetchLeaderboard]);

  // Realtime subscription - stable effect that doesn't depend on fetchLeaderboard
  useEffect(() => {
    const channel = supabase
      .channel('leaderboard-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_stats',
        },
        () => {
          // Debounce to prevent excessive refreshes
          if (debounceRef.current) {
            clearTimeout(debounceRef.current);
          }
          debounceRef.current = setTimeout(() => {
            fetchLeaderboardRef.current();
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
  }, []);

  const syncPlayerStats = useCallback(
    async (
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
          highest_cat_grade: Math.max(...gameState.cats.map((c) => c.grade || 1), 1),
          total_money_earned: gameState.money,
          achievements_unlocked: gameState.achievements.filter((a) => a.unlocked).length,
          last_updated: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('player_stats')
          .upsert(stats, { onConflict: 'user_id' });

        if (error) throw error;
      } catch (err) {
        logger.error('Failed to sync player stats:', err);
      }
    },
    [userId]
  );

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
    fetchLeaderboard: () => fetchLeaderboard(currentPage),
    syncPlayerStats,
    isLive,
    // Pagination
    currentPage,
    totalPages,
    totalCount,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    pageSize: PAGE_SIZE,
    // Infinite scroll
    scrollMode,
    setScrollMode,
    allEntries: scrollMode === 'infinite' ? allEntries : leaderboard,
    hasMore,
    loadingMore,
    loadMore,
  };
}
