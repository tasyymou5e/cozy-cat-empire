import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LeaderboardCategory } from './useGlobalLeaderboard';

export interface RankHistoryEntry {
  id: string;
  user_id: string;
  category: string;
  rank: number;
  score: number;
  recorded_at: string;
}

export interface RankTrend {
  direction: 'up' | 'down' | 'stable';
  amount: number;
}

export function useLeaderboardHistory(userId: string | undefined, category: LeaderboardCategory) {
  const [history, setHistory] = useState<RankHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [trend, setTrend] = useState<RankTrend>({ direction: 'stable', amount: 0 });
  const [bestRank, setBestRank] = useState<number | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rank_history')
        .select('*')
        .eq('user_id', userId)
        .eq('category', category)
        .order('recorded_at', { ascending: true })
        .limit(30);

      if (error) throw error;

      const historyData = data || [];
      setHistory(historyData);

      // Calculate best rank
      if (historyData.length > 0) {
        const best = Math.min(...historyData.map(h => h.rank));
        setBestRank(best);

        // Calculate trend from last 7 entries
        if (historyData.length >= 2) {
          const recent = historyData.slice(-7);
          const firstRank = recent[0].rank;
          const lastRank = recent[recent.length - 1].rank;
          const diff = firstRank - lastRank; // Positive = improved (lower rank is better)

          if (diff > 0) {
            setTrend({ direction: 'up', amount: diff });
          } else if (diff < 0) {
            setTrend({ direction: 'down', amount: Math.abs(diff) });
          } else {
            setTrend({ direction: 'stable', amount: 0 });
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch rank history:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, category]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const recordRank = useCallback(async (rank: number, score: number) => {
    if (!userId) return;

    try {
      // Only record once per day per category
      const today = new Date().toISOString().split('T')[0];
      const { data: existing } = await supabase
        .from('rank_history')
        .select('id')
        .eq('user_id', userId)
        .eq('category', category)
        .gte('recorded_at', today)
        .maybeSingle();

      if (!existing) {
        await supabase
          .from('rank_history')
          .insert({
            user_id: userId,
            category,
            rank,
            score,
          });
      }
    } catch (err) {
      console.error('Failed to record rank:', err);
    }
  }, [userId, category]);

  return {
    history,
    loading,
    trend,
    bestRank,
    fetchHistory,
    recordRank,
  };
}
