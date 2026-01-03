import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [
        profilesResult,
        gameSavesResult,
        errorsResult,
        playerStatsResult,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('game_saves').select('id', { count: 'exact', head: true }),
        supabase
          .from('error_logs')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('player_stats').select('total_show_wins, total_cats_owned, total_kittens_bred, total_money_earned'),
      ]);

      const aggregateStats = playerStatsResult.data?.reduce(
        (acc, stat) => ({
          totalShowWins: acc.totalShowWins + (stat.total_show_wins || 0),
          totalCats: acc.totalCats + (stat.total_cats_owned || 0),
          totalKittens: acc.totalKittens + (stat.total_kittens_bred || 0),
          totalMoney: acc.totalMoney + (stat.total_money_earned || 0),
        }),
        { totalShowWins: 0, totalCats: 0, totalKittens: 0, totalMoney: 0 }
      ) || { totalShowWins: 0, totalCats: 0, totalKittens: 0, totalMoney: 0 };

      return {
        userCount: profilesResult.count || 0,
        gameSaveCount: gameSavesResult.count || 0,
        errorCount24h: errorsResult.count || 0,
        ...aggregateStats,
      };
    },
    staleTime: 30000,
  });
}

interface UseAdminUsersParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useAdminUsers({ search = '', page = 1, pageSize = 10 }: UseAdminUsersParams = {}) {
  return useQuery({
    queryKey: ['admin-users', search, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          display_name,
          avatar_emoji,
          username,
          email,
          created_at,
          updated_at,
          suspended_at,
          suspension_reason
        `)
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (search) {
        query = query.or(`display_name.ilike.%${search}%,username.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data: profiles, error: profilesError } = await query;

      if (profilesError) throw profilesError;

      // Fetch player stats and roles for each user
      const userIds = profiles?.map((p) => p.id) || [];
      
      const [statsResult, rolesResult] = await Promise.all([
        supabase
          .from('player_stats')
          .select('user_id, total_show_wins, total_cats_owned, total_kittens_bred, total_money_earned, last_updated')
          .in('user_id', userIds),
        supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds),
      ]);

      const statsMap = new Map(statsResult.data?.map((s) => [s.user_id, s]));
      const rolesMap = new Map(rolesResult.data?.map((r) => [r.user_id, r.role]));

      const users = profiles?.map((profile) => ({
        ...profile,
        stats: statsMap.get(profile.id),
        role: rolesMap.get(profile.id) || 'user',
      }));

      // Get total count
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });

      return {
        users: users || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
    staleTime: 10000,
  });
}

interface UseAdminErrorsParams {
  errorType?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export function useAdminErrors({ errorType, status, page = 1, pageSize = 20 }: UseAdminErrorsParams = {}) {
  return useQuery({
    queryKey: ['admin-errors', errorType, status, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (errorType) {
        query = query.eq('error_type', errorType);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get count with same filters
      let countQuery = supabase
        .from('error_logs')
        .select('id', { count: 'exact', head: true });

      if (errorType) {
        countQuery = countQuery.eq('error_type', errorType);
      }

      if (status) {
        countQuery = countQuery.eq('status', status);
      }

      const { count } = await countQuery;

      return {
        errors: data || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
    staleTime: 10000,
  });
}

export function useAdminErrorTrends() {
  return useQuery({
    queryKey: ['admin-error-trends'],
    queryFn: async () => {
      // Fetch errors from the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data, error } = await supabase
        .from('error_logs')
        .select('created_at, error_type')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by day and error type
      const dailyData = new Map<string, Record<string, number>>();
      
      // Initialize all 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        dailyData.set(dateKey, {
          react_error_boundary: 0,
          uncaught_error: 0,
          network_error: 0,
          interaction_error: 0,
          other: 0,
          total: 0,
        });
      }

      // Count errors per day
      data?.forEach((row) => {
        if (!row.created_at) return;
        const dateKey = row.created_at.split('T')[0];
        const dayData = dailyData.get(dateKey);
        if (dayData) {
          const errorType = row.error_type || 'other';
          if (errorType in dayData) {
            dayData[errorType]++;
          } else {
            dayData['other']++;
          }
          dayData['total']++;
        }
      });

      // Convert to array format for recharts
      return Array.from(dailyData.entries()).map(([date, counts]) => ({
        date,
        displayDate: new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        ...counts,
      }));
    },
    staleTime: 60000,
  });
}

export function useAdminAuthLogs(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['admin-auth-logs', page, pageSize],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auth_attempts_log')
        .select('*')
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) throw error;

      const { count } = await supabase
        .from('auth_attempts_log')
        .select('id', { count: 'exact', head: true });

      return {
        logs: data || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
    staleTime: 10000,
  });
}

export function useAdminActivityLogs(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['admin-activity-logs', page, pageSize],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) throw error;

      const { count } = await supabase
        .from('admin_activity_log')
        .select('id', { count: 'exact', head: true });

      return {
        logs: data || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
    staleTime: 10000,
  });
}
