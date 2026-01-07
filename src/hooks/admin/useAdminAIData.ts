import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAdminAIStats() {
  return useQuery({
    queryKey: ['admin-ai-stats'],
    queryFn: async () => {
      // Get all counts in parallel
      const [
        totalResult,
        successResult,
        errorResult,
        rateLimitedResult,
        creditsDepletedResult,
        errors24hResult,
        generations24hResult,
        avgTimeResult,
        uniqueUsersResult,
        avgTimeByStatusResult,
      ] = await Promise.all([
        supabase.from('ai_usage_log').select('id', { count: 'exact', head: true }),
        supabase
          .from('ai_usage_log')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'success'),
        supabase
          .from('ai_usage_log')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'error'),
        supabase
          .from('ai_usage_log')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'rate_limited'),
        supabase
          .from('ai_usage_log')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'credits_depleted'),
        supabase
          .from('ai_usage_log')
          .select('id', { count: 'exact', head: true })
          .neq('status', 'success')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('ai_usage_log')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('ai_usage_log')
          .select('execution_time_ms')
          .not('execution_time_ms', 'is', null),
        supabase.from('ai_usage_log').select('user_id').not('user_id', 'is', null),
        supabase
          .from('ai_usage_log')
          .select('status, execution_time_ms')
          .not('execution_time_ms', 'is', null),
      ]);

      const totalGenerations = totalResult.count || 0;
      const successCount = successResult.count || 0;
      const errorCount = errorResult.count || 0;
      const rateLimitedCount = rateLimitedResult.count || 0;
      const creditsDepletedCount = creditsDepletedResult.count || 0;
      const errors24h = errors24hResult.count || 0;
      const generations24h = generations24hResult.count || 0;

      // Calculate average execution time
      const times = avgTimeResult.data || [];
      const avgExecutionTime =
        times.length > 0
          ? times.reduce((sum, t) => sum + (t.execution_time_ms || 0), 0) / times.length
          : 0;

      // Count unique users
      const userIds = uniqueUsersResult.data || [];
      const uniqueUsers = new Set(userIds.map((u) => u.user_id)).size;

      // Calculate success rate
      const successRate = totalGenerations > 0 ? (successCount / totalGenerations) * 100 : 0;

      // Calculate avg time by status
      const statusTimes = avgTimeByStatusResult.data || [];
      const timesByStatus: Record<string, number[]> = {};
      statusTimes.forEach((item) => {
        if (!timesByStatus[item.status]) {
          timesByStatus[item.status] = [];
        }
        if (item.execution_time_ms) {
          timesByStatus[item.status].push(item.execution_time_ms);
        }
      });

      const avgTimeByStatus = Object.entries(timesByStatus).map(([status, timesArr]) => ({
        status: status.replace('_', ' '),
        avgTime: Math.round(timesArr.reduce((a, b) => a + b, 0) / timesArr.length),
      }));

      return {
        totalGenerations,
        successCount,
        errorCount,
        rateLimitedCount,
        creditsDepletedCount,
        errors24h,
        generations24h,
        avgExecutionTime,
        uniqueUsers,
        successRate,
        avgTimeByStatus,
      };
    },
  });
}

export function useAdminAILogs(page: number = 1, pageSize: number = 10) {
  return useQuery({
    queryKey: ['admin-ai-logs', page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const [logsResult, countResult] = await Promise.all([
        supabase
          .from('ai_usage_log')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, to),
        supabase.from('ai_usage_log').select('id', { count: 'exact', head: true }),
      ]);

      if (logsResult.error) throw logsResult.error;

      return {
        logs: logsResult.data || [],
        totalCount: countResult.count || 0,
        totalPages: Math.ceil((countResult.count || 0) / pageSize),
      };
    },
  });
}

export function useAdminUserCredits(page: number = 1, pageSize: number = 10) {
  return useQuery({
    queryKey: ['admin-user-credits', page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const [creditsResult, countResult] = await Promise.all([
        supabase
          .from('player_portrait_credits')
          .select(
            `
            *,
            profiles:user_id (
              display_name,
              avatar_emoji,
              email
            )
          `
          )
          .order('updated_at', { ascending: false })
          .range(from, to),
        supabase.from('player_portrait_credits').select('id', { count: 'exact', head: true }),
      ]);

      if (creditsResult.error) throw creditsResult.error;

      return {
        credits: creditsResult.data || [],
        totalCount: countResult.count || 0,
        totalPages: Math.ceil((countResult.count || 0) / pageSize),
      };
    },
  });
}

export function useAdminCreditSummary() {
  return useQuery({
    queryKey: ['admin-credit-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_portrait_credits')
        .select('credits_remaining, total_used, total_purchased');

      if (error) throw error;

      const totals = (data || []).reduce(
        (acc, row) => ({
          totalRemaining: acc.totalRemaining + (row.credits_remaining || 0),
          totalUsed: acc.totalUsed + (row.total_used || 0),
          totalPurchased: acc.totalPurchased + (row.total_purchased || 0),
        }),
        { totalRemaining: 0, totalUsed: 0, totalPurchased: 0 }
      );

      return {
        ...totals,
        userCount: data?.length || 0,
      };
    },
  });
}
