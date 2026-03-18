import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LeaderboardCategory } from './useGlobalLeaderboard';

import { createLogger } from '@/lib/logger';

const logger = createLogger('useLeaderboardHistory');

export interface RankHistoryEntry {
  id: string;
  category: string;
  rank: number;
  score: number;
  recorded_at: string;
}

export interface RankTrend {
  direction: 'up' | 'down' | 'stable';
  change: number;
}

export interface WealthDataPoint {
  date: string;
  wealth: number;
}

export interface RankProgressionData {
  date: string;
  wins?: number;
  cats?: number;
  breeding?: number;
  wealth?: number;
  achievements?: number;
}

export function useLeaderboardHistory(userId: string | undefined, category?: LeaderboardCategory) {
  const [history, setHistory] = useState<RankHistoryEntry[]>([]);
  const [wealthHistory, setWealthHistory] = useState<WealthDataPoint[]>([]);
  const [rankProgression, setRankProgression] = useState<RankProgressionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [trend, setTrend] = useState<RankTrend>({ direction: 'stable', change: 0 });
  const [bestRank, setBestRank] = useState<number | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // Fetch rank history for specific category or all
      let query = supabase
        .from('rank_history')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false })
        .limit(30);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;

      const typedData = (data || []) as RankHistoryEntry[];
      setHistory(typedData);

      // Calculate trend for the specific category
      if (category && typedData.length >= 2) {
        const latest = typedData[0].rank;
        const previous = typedData[1].rank;
        const change = previous - latest; // Positive = improved (lower rank is better)

        setTrend({
          direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
          change: Math.abs(change),
        });
      }

      // Calculate best rank
      if (typedData.length > 0) {
        const best = Math.min(...typedData.map((h) => h.rank));
        setBestRank(best);
      }

      // Fetch wealth history from rank_history (wealth category scores)
      const { data: wealthData, error: wealthError } = await supabase
        .from('rank_history')
        .select('recorded_at, score')
        .eq('user_id', userId)
        .eq('category', 'wealth')
        .order('recorded_at', { ascending: true })
        .limit(30);

      if (!wealthError && wealthData) {
        const wealthPoints: WealthDataPoint[] = wealthData.map((d) => ({
          date: d.recorded_at,
          wealth: d.score,
        }));
        setWealthHistory(wealthPoints);
      }

      // Fetch rank progression for all categories
      const { data: allRanks, error: ranksError } = await supabase
        .from('rank_history')
        .select('category, rank, recorded_at')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: true });

      if (!ranksError && allRanks) {
        // Group by date and category
        const progressionMap = new Map<string, RankProgressionData>();

        allRanks.forEach((entry) => {
          const dateKey = new Date(entry.recorded_at).toISOString().split('T')[0];
          const existing = progressionMap.get(dateKey) || { date: entry.recorded_at };
          // Use type-safe assignment
          const key = entry.category as keyof RankProgressionData;
          if (key !== 'date') {
            (existing as { [K in keyof RankProgressionData]?: RankProgressionData[K] })[key] =
              entry.rank;
          }
          progressionMap.set(dateKey, existing);
        });

        setRankProgression(Array.from(progressionMap.values()));
      }
    } catch (error) {
      logger.error('Error fetching leaderboard history:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, category]);

  const recordRank = useCallback(
    async (categoryToRecord: LeaderboardCategory, rank: number, score: number) => {
      if (!userId) return;

      try {
        // Check if we already have a record for today
        const today = new Date().toISOString().split('T')[0];
        const { data: existing } = await supabase
          .from('rank_history')
          .select('id')
          .eq('user_id', userId)
          .eq('category', categoryToRecord)
          .gte('recorded_at', today)
          .maybeSingle();

        if (existing) {
          // Update existing record
          await supabase.from('rank_history').update({ rank, score }).eq('id', existing.id);
        } else {
          // Insert new record
          await supabase.from('rank_history').insert({
            user_id: userId,
            category: categoryToRecord,
            rank,
            score,
          });
        }

        // Refresh history
        fetchHistory();
      } catch (error) {
        logger.error('Error recording rank:', error);
      }
    },
    [userId, fetchHistory]
  );

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    wealthHistory,
    rankProgression,
    loading,
    trend,
    bestRank,
    fetchHistory,
    recordRank,
  };
}
