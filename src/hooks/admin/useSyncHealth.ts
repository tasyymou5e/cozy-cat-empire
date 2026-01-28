import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SyncHealthLog {
  id: string;
  run_at: string;
  saves_checked: number;
  saves_with_issues: number;
  total_issues: number;
  issue_summary: {
    critical: number;
    warning: number;
    info: number;
    by_type: Record<string, number>;
  };
  execution_time_ms: number;
}

/**
 * Hook to fetch sync health logs for admin dashboard
 */
export function useSyncHealthLogs(limit = 24) {
  return useQuery({
    queryKey: ['admin-sync-health', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sync_health_log')
        .select('*')
        .order('run_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as unknown as SyncHealthLog[];
    },
  });
}

/**
 * Hook to get summary stats from recent sync health checks
 */
export function useSyncHealthSummary() {
  const { data: logs, ...rest } = useSyncHealthLogs(24);

  const summary = logs ? {
    latestCheck: logs[0] || null,
    totalIssues: logs.reduce((sum, log) => sum + log.total_issues, 0),
    criticalIssues: logs.reduce((sum, log) => sum + (log.issue_summary?.critical || 0), 0),
    checksCount: logs.length,
    averageExecutionTime: logs.length > 0
      ? Math.round(logs.reduce((sum, log) => sum + log.execution_time_ms, 0) / logs.length)
      : 0,
  } : null;

  return { summary, ...rest };
}
