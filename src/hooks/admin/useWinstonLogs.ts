import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState, useCallback } from 'react';
import type { WinstonLogLevel } from '@/lib/winston-logger';

interface LogFilters {
  level?: WinstonLogLevel | '';
  label?: string;
  source?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

interface LogRow {
  id: string;
  level: string;
  message: string;
  label: string | null;
  timestamp: string;
  metadata: Record<string, unknown> | null;
  user_id: string | null;
  source: string | null;
  function_name: string | null;
  duration_ms: number | null;
  request_id: string | null;
  stack_trace: string | null;
  created_at: string;
}

export function useWinstonLogs(filters: LogFilters = {}) {
  const { level, label, source, search, page = 1, pageSize = 50 } = filters;

  return useQuery({
    queryKey: ['winston-logs', level, label, source, search, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from('application_logs')
        .select('*', { count: 'exact' })
        .order('timestamp', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (level) query = query.eq('level', level);
      if (label) query = query.eq('label', label);
      if (source) query = query.eq('source', source);
      if (search) query = query.ilike('message', `%${search}%`);

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        logs: (data || []) as LogRow[],
        totalCount: count || 0,
      };
    },
    refetchInterval: 10000, // Auto-refresh every 10s
  });
}

export function useWinstonLogStats() {
  return useQuery({
    queryKey: ['winston-log-stats'],
    queryFn: async () => {
      // Get counts per level
      const { data: levelCounts, error: levelError } = await supabase
        .rpc('get_log_level_counts' as never);

      // Fallback: query manually
      const levels: WinstonLogLevel[] = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];
      const counts: Record<string, number> = {};

      for (const lvl of levels) {
        const { count } = await supabase
          .from('application_logs')
          .select('*', { count: 'exact', head: true })
          .eq('level', lvl);
        counts[lvl] = count || 0;
      }

      // Get counts by source
      const sourceCounts: Record<string, number> = {};
      for (const src of ['client', 'edge_function', 'cron', 'system']) {
        const { count } = await supabase
          .from('application_logs')
          .select('*', { count: 'exact', head: true })
          .eq('source', src);
        sourceCounts[src] = count || 0;
      }

      // Last 24 hours count
      const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
      const { count: last24h } = await supabase
        .from('application_logs')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', oneDayAgo);

      // Unique labels
      const { data: labelData } = await supabase
        .from('application_logs')
        .select('label')
        .not('label', 'is', null)
        .limit(100);

      const uniqueLabels = [...new Set((labelData || []).map((d) => d.label).filter(Boolean))];

      return {
        levelCounts: counts,
        sourceCounts,
        last24h: last24h || 0,
        totalCount: Object.values(counts).reduce((a, b) => a + b, 0),
        uniqueLabels: uniqueLabels as string[],
      };
    },
    refetchInterval: 30000,
  });
}

export function useWinstonLogTrends() {
  return useQuery({
    queryKey: ['winston-log-trends'],
    queryFn: async () => {
      // Get hourly counts for last 24 hours
      const hours: { hour: string; error: number; warn: number; info: number; other: number }[] = [];

      for (let i = 23; i >= 0; i--) {
        const start = new Date(Date.now() - (i + 1) * 3600000).toISOString();
        const end = new Date(Date.now() - i * 3600000).toISOString();
        const hourLabel = new Date(Date.now() - i * 3600000).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });

        const counts: Record<string, number> = {};
        for (const lvl of ['error', 'warn', 'info'] as WinstonLogLevel[]) {
          const { count } = await supabase
            .from('application_logs')
            .select('*', { count: 'exact', head: true })
            .eq('level', lvl)
            .gte('timestamp', start)
            .lt('timestamp', end);
          counts[lvl] = count || 0;
        }

        const { count: otherCount } = await supabase
          .from('application_logs')
          .select('*', { count: 'exact', head: true })
          .not('level', 'in', '("error","warn","info")')
          .gte('timestamp', start)
          .lt('timestamp', end);

        hours.push({
          hour: hourLabel,
          error: counts.error || 0,
          warn: counts.warn || 0,
          info: counts.info || 0,
          other: otherCount || 0,
        });
      }

      return hours;
    },
    refetchInterval: 60000,
  });
}

export function useDeleteWinstonLogs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('application_logs')
        .delete()
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['winston-logs'] });
      queryClient.invalidateQueries({ queryKey: ['winston-log-stats'] });
    },
  });
}

export function useClearWinstonLogs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options?: { level?: string; olderThan?: string }) => {
      let query = supabase.from('application_logs').delete();

      if (options?.level) {
        query = query.eq('level', options.level as any);
      }
      if (options?.olderThan) {
        query = query.lt('timestamp', options.olderThan);
      }
      // Need a filter for delete
      if (!options?.level && !options?.olderThan) {
        query = query.gte('id', '00000000-0000-0000-0000-000000000000' as string);
      }

      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['winston-logs'] });
      queryClient.invalidateQueries({ queryKey: ['winston-log-stats'] });
      queryClient.invalidateQueries({ queryKey: ['winston-log-trends'] });
    },
  });
}

export function useRealtimeWinstonLogs() {
  const [realtimeLogs, setRealtimeLogs] = useState<LogRow[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('winston-logs-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'application_logs',
        },
        (payload) => {
          const newLog = payload.new as LogRow;
          setRealtimeLogs((prev) => [newLog, ...prev].slice(0, 100));
          queryClient.invalidateQueries({ queryKey: ['winston-log-stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const clearRealtime = useCallback(() => setRealtimeLogs([]), []);

  return { realtimeLogs, clearRealtime };
}
