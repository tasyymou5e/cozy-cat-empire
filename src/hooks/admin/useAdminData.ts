/**
 * @fileoverview Admin data fetching hooks
 *
 * Provides React Query hooks for fetching administrative data including
 * user statistics, error logs, activity logs, storage stats, and analytics.
 * All hooks use TanStack Query for caching and automatic refetching.
 *
 * @module hooks/admin/useAdminData
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Parameters for fetching admin users
 *
 * @interface UseAdminUsersParams
 * @property {string} [search] - Search term for display name, username, or email
 * @property {number} [page] - Page number (1-indexed)
 * @property {number} [pageSize] - Number of results per page
 */
interface UseAdminUsersParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Parameters for fetching error logs
 *
 * @interface UseAdminErrorsParams
 * @property {string} [errorType] - Filter by error type
 * @property {string} [status] - Filter by status (open, resolved, etc.)
 * @property {number} [page] - Page number (1-indexed)
 * @property {number} [pageSize] - Number of results per page
 */
interface UseAdminErrorsParams {
  errorType?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Parameters for fetching player activity logs
 *
 * @interface UseAdminPlayerActivityParams
 * @property {string} [activityType] - Filter by activity type
 * @property {number} [page] - Page number (1-indexed)
 * @property {number} [pageSize] - Number of results per page
 */
interface UseAdminPlayerActivityParams {
  activityType?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Hook to fetch aggregate admin dashboard statistics
 *
 * Returns counts for users, game saves, recent errors, and aggregated
 * player statistics (total wins, cats, kittens, money).
 *
 * @returns {UseQueryResult} Query result with stats data
 *
 * @example
 * ```tsx
 * function AdminDashboard() {
 *   const { data: stats, isLoading } = useAdminStats();
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return (
 *     <div>
 *       <StatCard title="Users" value={stats.userCount} />
 *       <StatCard title="Errors (24h)" value={stats.errorCount24h} />
 *       <StatCard title="Total Cats" value={stats.totalCats} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useAdminStats(refetchInterval?: number) {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const [profilesResult, gameSavesResult, errorsResult, playerStatsResult, activePlayersResult] =
        await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('game_saves').select('id', { count: 'exact', head: true }),
          supabase
            .from('error_logs')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', twentyFourHoursAgo),
          supabase
            .from('player_stats')
            .select('total_show_wins, total_cats_owned, total_kittens_bred, total_money_earned'),
          // Active players: users who have played in the last 24 hours
          supabase
            .from('game_saves')
            .select('id', { count: 'exact', head: true })
            .gte('last_played_at', twentyFourHoursAgo),
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
        /** Total number of registered users */
        userCount: profilesResult.count || 0,
        /** Total number of game saves */
        gameSaveCount: gameSavesResult.count || 0,
        /** Number of errors in the last 24 hours */
        errorCount24h: errorsResult.count || 0,
        /** Number of active players in the last 24 hours */
        activePlayersCount: activePlayersResult.count || 0,
        ...aggregateStats,
      };
    },
    staleTime: 30000,
    refetchInterval,
  });
}

/**
 * Hook to fetch paginated user list with search
 *
 * Returns users with their profiles, player stats, and roles.
 * Supports searching by display name, username, or email.
 *
 * @param {UseAdminUsersParams} params - Search and pagination options
 * @returns {UseQueryResult} Query result with users array and pagination info
 *
 * @example
 * ```tsx
 * function UserManagement() {
 *   const [search, setSearch] = useState('');
 *   const [page, setPage] = useState(1);
 *
 *   const { data, isLoading } = useAdminUsers({ search, page, pageSize: 20 });
 *
 *   return (
 *     <>
 *       <SearchInput value={search} onChange={setSearch} />
 *       <UserTable users={data?.users || []} />
 *       <Pagination
 *         page={page}
 *         totalPages={data?.totalPages || 1}
 *         onChange={setPage}
 *       />
 *     </>
 *   );
 * }
 * ```
 */
export function useAdminUsers({ search = '', page = 1, pageSize = 10 }: UseAdminUsersParams = {}) {
  return useQuery({
    queryKey: ['admin-users', search, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select(
          `
          id,
          display_name,
          avatar_emoji,
          username,
          email,
          created_at,
          updated_at,
          suspended_at,
          suspension_reason
        `
        )
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (search) {
        query = query.or(
          `display_name.ilike.%${search}%,username.ilike.%${search}%,email.ilike.%${search}%`
        );
      }

      const { data: profiles, error: profilesError } = await query;

      if (profilesError) throw profilesError;

      // Fetch player stats and roles for each user
      const userIds = profiles?.map((p) => p.id) || [];

      const [statsResult, rolesResult] = await Promise.all([
        supabase
          .from('player_stats')
          .select(
            'user_id, total_show_wins, total_cats_owned, total_kittens_bred, total_money_earned, last_updated'
          )
          .in('user_id', userIds),
        supabase.from('user_roles').select('user_id, role').in('user_id', userIds),
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
        /** Array of user objects with profiles, stats, and roles */
        users: users || [],
        /** Total number of users matching the search */
        totalCount: count || 0,
        /** Total number of pages */
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
    staleTime: 10000,
  });
}

/**
 * Hook to fetch paginated error logs with filtering
 *
 * Returns error logs with optional filtering by error type and status.
 *
 * @param {UseAdminErrorsParams} params - Filter and pagination options
 * @returns {UseQueryResult} Query result with errors array and pagination info
 *
 * @example
 * ```tsx
 * function ErrorLogViewer() {
 *   const [errorType, setErrorType] = useState<string>();
 *   const [page, setPage] = useState(1);
 *
 *   const { data, isLoading } = useAdminErrors({ errorType, page });
 *
 *   return (
 *     <>
 *       <ErrorTypeFilter value={errorType} onChange={setErrorType} />
 *       <ErrorTable errors={data?.errors || []} />
 *     </>
 *   );
 * }
 * ```
 */
export function useAdminErrors({
  errorType,
  status,
  page = 1,
  pageSize = 20,
}: UseAdminErrorsParams = {}) {
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
      let countQuery = supabase.from('error_logs').select('id', { count: 'exact', head: true });

      if (errorType) {
        countQuery = countQuery.eq('error_type', errorType);
      }

      if (status) {
        countQuery = countQuery.eq('status', status);
      }

      const { count } = await countQuery;

      return {
        /** Array of error log entries */
        errors: data || [],
        /** Total number of errors matching filters */
        totalCount: count || 0,
        /** Total number of pages */
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
    staleTime: 10000,
  });
}

/**
 * Hook to fetch error trends over the last 7 days
 *
 * Returns daily error counts grouped by error type for trend analysis
 * and visualization in charts.
 *
 * @returns {UseQueryResult} Query result with daily error data for charts
 *
 * @example
 * ```tsx
 * function ErrorTrendsChart() {
 *   const { data: trends } = useAdminErrorTrends();
 *
 *   return (
 *     <LineChart data={trends}>
 *       <Line dataKey="total" name="Total Errors" />
 *       <Line dataKey="uncaught_error" name="Uncaught" />
 *       <Line dataKey="network_error" name="Network" />
 *     </LineChart>
 *   );
 * }
 * ```
 */
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
        displayDate: new Date(date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        ...counts,
      }));
    },
    staleTime: 60000,
  });
}

/**
 * Hook to fetch paginated authentication attempt logs
 *
 * Returns logs of login attempts including successes, failures,
 * and access denied events.
 *
 * @param {number} page - Page number (1-indexed)
 * @param {number} pageSize - Number of results per page
 * @returns {UseQueryResult} Query result with auth logs and pagination info
 *
 * @example
 * ```tsx
 * function AuthLogsTable() {
 *   const [page, setPage] = useState(1);
 *   const { data } = useAdminAuthLogs(page, 20);
 *
 *   return <LogsTable logs={data?.logs || []} />;
 * }
 * ```
 */
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
        /** Array of authentication attempt logs */
        logs: data || [],
        /** Total number of auth logs */
        totalCount: count || 0,
        /** Total number of pages */
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
    staleTime: 10000,
  });
}

/**
 * Hook to fetch paginated admin activity logs
 *
 * Returns logs of admin actions for audit trail and accountability.
 *
 * @param {number} page - Page number (1-indexed)
 * @param {number} pageSize - Number of results per page
 * @returns {UseQueryResult} Query result with activity logs and pagination info
 *
 * @example
 * ```tsx
 * function ActivityLogViewer() {
 *   const [page, setPage] = useState(1);
 *   const { data } = useAdminActivityLogs(page);
 *
 *   return (
 *     <Table>
 *       {data?.logs.map(log => (
 *         <TableRow key={log.id}>
 *           <TableCell>{log.action_type}</TableCell>
 *           <TableCell>{log.action_description}</TableCell>
 *         </TableRow>
 *       ))}
 *     </Table>
 *   );
 * }
 * ```
 */
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
        /** Array of admin activity logs */
        logs: data || [],
        /** Total number of activity logs */
        totalCount: count || 0,
        /** Total number of pages */
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
    staleTime: 10000,
  });
}

/**
 * Hook to fetch paginated player activity logs
 *
 * Returns logs of player actions (friend requests, trades, etc.)
 * with optional filtering by activity type.
 *
 * @param {UseAdminPlayerActivityParams} params - Filter and pagination options
 * @returns {UseQueryResult} Query result with player activity logs
 *
 * @example
 * ```tsx
 * function PlayerActivityViewer() {
 *   const { data } = useAdminPlayerActivityLogs({
 *     activityType: 'friend_request_sent',
 *     page: 1
 *   });
 *
 *   return <ActivityTable logs={data?.logs || []} />;
 * }
 * ```
 */
export function useAdminPlayerActivityLogs({
  activityType,
  page = 1,
  pageSize = 20,
}: UseAdminPlayerActivityParams = {}) {
  return useQuery({
    queryKey: ['admin-player-activity', activityType, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from('player_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (activityType) {
        query = query.eq('activity_type', activityType);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get count with same filters
      let countQuery = supabase
        .from('player_activity_log')
        .select('id', { count: 'exact', head: true });

      if (activityType) {
        countQuery = countQuery.eq('activity_type', activityType);
      }

      const { count } = await countQuery;

      return {
        /** Array of player activity logs */
        logs: data || [],
        /** Total number of logs matching filter */
        totalCount: count || 0,
        /** Total number of pages */
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
    staleTime: 10000,
  });
}

/**
 * Hook to fetch storage bucket statistics
 *
 * Returns file counts for each storage bucket (photo-gallery, cat-portraits).
 *
 * @returns {UseQueryResult} Query result with storage stats per bucket
 *
 * @example
 * ```tsx
 * function StorageOverview() {
 *   const { data: buckets } = useAdminStorageStats();
 *
 *   return (
 *     <div>
 *       {buckets?.map(bucket => (
 *         <div key={bucket.bucket}>
 *           {bucket.bucket}: {bucket.count} files
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAdminStorageStats() {
  return useQuery({
    queryKey: ['admin-storage-stats'],
    queryFn: async () => {
      const buckets = ['photo-gallery', 'cat-portraits'] as const;

      const stats = await Promise.all(
        buckets.map(async (bucket) => {
          try {
            const { data, error } = await supabase.storage.from(bucket).list('', { limit: 1000 });

            if (error) throw error;
            return {
              /** Bucket name */
              bucket,
              /** Number of files in bucket */
              count: data?.length ?? 0,
              /** Operation status */
              status: 'ok' as const,
            };
          } catch {
            return {
              bucket,
              count: 0,
              status: 'error' as const,
            };
          }
        })
      );

      return stats;
    },
    staleTime: 60000,
  });
}

/**
 * Hook to fetch row counts for all database tables
 *
 * Returns counts for all tables grouped by category (core, social,
 * challenges, progression, leaderboards, logging, content).
 *
 * @returns {UseQueryResult} Query result with table stats grouped by category
 *
 * @example
 * ```tsx
 * function DatabaseOverview() {
 *   const { data } = useAdminAllTableStats();
 *
 *   return (
 *     <div>
 *       <p>Total Tables: {data?.totalTables}</p>
 *       <p>Total Rows: {data?.totalRows}</p>
 *       {Object.entries(data?.grouped || {}).map(([category, tables]) => (
 *         <CategorySection key={category} tables={tables} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAdminAllTableStats() {
  return useQuery({
    queryKey: ['admin-all-table-stats'],
    queryFn: async () => {
      // Define all tables grouped by category
      const tableGroups = {
        core: ['profiles', 'game_saves', 'player_stats', 'user_roles'],
        social: ['player_friends', 'cat_gifts', 'trade_offers', 'push_subscriptions'],
        challenges: [
          'weekly_challenges',
          'player_challenge_progress',
          'player_challenge_stats',
          'coop_challenges',
          'coop_challenge_invites',
          'daily_objectives_progress',
        ],
        progression: [
          'daily_login_rewards',
          'battle_pass_progress',
          'gallery_photos',
          'retired_cats',
        ],
        leaderboards: [
          'leaderboard_rewards',
          'leaderboard_snapshots',
          'rank_history',
          'rewards_processing_log',
        ],
        logging: [
          'error_logs',
          'admin_activity_log',
          'auth_attempts_log',
          'player_activity_log',
          'ai_usage_log',
        ],
        content: ['announcements'],
      };

      // Flatten for querying
      const allTables = Object.entries(tableGroups).flatMap(([category, tables]) =>
        tables.map((table) => ({ table, category }))
      );

      // Query all tables in parallel
      // Using type assertion here since we're dynamically querying multiple tables
      const results = await Promise.all(
        allTables.map(async ({ table, category }) => {
          try {
            const { count, error } = await supabase
              .from(table as 'profiles')
              .select('*', { count: 'exact', head: true });

            return {
              table,
              category,
              count: error ? null : (count ?? 0),
              status: error ? 'error' : 'ok',
            };
          } catch {
            return { table, category, count: null, status: 'error' };
          }
        })
      );

      // Group results by category for display
      const grouped = Object.keys(tableGroups).reduce(
        (acc, category) => {
          acc[category] = results.filter((r) => r.category === category);
          return acc;
        },
        {} as Record<string, typeof results>
      );

      return {
        /** Table stats grouped by category */
        grouped,
        /** All table stats in flat array */
        all: results,
        /** Total number of tables */
        totalTables: results.length,
        /** Total row count across all tables */
        totalRows: results.reduce((sum, r) => sum + (r.count ?? 0), 0),
      };
    },
    staleTime: 30000,
  });
}

/**
 * Hook to monitor live activity in the last 5 minutes
 *
 * Returns counts of recent saves, errors, trades, and gifts.
 * Auto-refreshes every 30 seconds for real-time monitoring.
 *
 * @returns {UseQueryResult} Query result with live activity counts
 *
 * @example
 * ```tsx
 * function LiveActivityMonitor() {
 *   const { data } = useAdminLiveActivity();
 *
 *   return (
 *     <div className="grid grid-cols-4 gap-4">
 *       <LiveStat label="Recent Saves" value={data?.recentSaves} />
 *       <LiveStat label="Recent Errors" value={data?.recentErrors} />
 *       <LiveStat label="Recent Trades" value={data?.recentTrades} />
 *       <LiveStat label="Recent Gifts" value={data?.recentGifts} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useAdminLiveActivity() {
  return useQuery({
    queryKey: ['admin-live-activity'],
    queryFn: async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const [savesResult, errorsResult, tradesResult, giftsResult] = await Promise.all([
        supabase
          .from('game_saves')
          .select('id', { count: 'exact', head: true })
          .gte('last_played_at', fiveMinutesAgo),
        supabase
          .from('error_logs')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', fiveMinutesAgo),
        supabase
          .from('trade_offers')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', fiveMinutesAgo),
        supabase
          .from('cat_gifts')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', fiveMinutesAgo),
      ]);

      return {
        /** Game saves in last 5 minutes */
        recentSaves: savesResult.count ?? 0,
        /** Errors in last 5 minutes */
        recentErrors: errorsResult.count ?? 0,
        /** Trades in last 5 minutes */
        recentTrades: tradesResult.count ?? 0,
        /** Gifts in last 5 minutes */
        recentGifts: giftsResult.count ?? 0,
        /** Timestamp of this query */
        timestamp: new Date().toISOString(),
      };
    },
    refetchInterval: 30000,
  });
}

/**
 * Hook to fetch weekly challenge analytics
 *
 * Returns detailed analytics for each challenge including participation,
 * completion rates, and difficulty breakdown.
 *
 * @returns {UseQueryResult} Query result with challenge analytics
 *
 * @example
 * ```tsx
 * function ChallengeAnalytics() {
 *   const { data } = useAdminChallengeAnalytics();
 *
 *   return (
 *     <div>
 *       <h2>Overall: {data?.summary.overallCompletionRate.toFixed(1)}% completion</h2>
 *       {data?.challenges.map(c => (
 *         <ChallengeCard
 *           key={c.id}
 *           name={c.name}
 *           completionRate={c.completionRate}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAdminChallengeAnalytics() {
  return useQuery({
    queryKey: ['admin-challenge-analytics'],
    queryFn: async () => {
      const [challengesResult, progressResult] = await Promise.all([
        supabase.from('weekly_challenges').select('*'),
        supabase.from('player_challenge_progress').select('*'),
      ]);

      const challenges = challengesResult.data || [];
      const progress = progressResult.data || [];

      // Calculate analytics per challenge
      const challengeAnalytics = challenges.map((challenge) => {
        const participants = progress.filter((p) => p.challenge_id === challenge.id);
        const completedCount = participants.filter((p) => p.completed).length;
        const totalParticipants = participants.length;
        const avgProgress =
          totalParticipants > 0
            ? participants.reduce((sum, p) => sum + (p.current_progress || 0), 0) /
              totalParticipants
            : 0;

        return {
          id: challenge.id,
          name: challenge.name,
          emoji: challenge.emoji,
          difficulty: challenge.difficulty || 'medium',
          targetValue: challenge.target_value,
          isActive: challenge.is_active,
          totalParticipants,
          completedCount,
          completionRate: totalParticipants > 0 ? (completedCount / totalParticipants) * 100 : 0,
          avgProgress,
          avgProgressPercent:
            challenge.target_value > 0 ? (avgProgress / challenge.target_value) * 100 : 0,
        };
      });

      // Summary stats
      const totalChallenges = challenges.length;
      const activeChallenges = challenges.filter((c) => c.is_active).length;
      const totalParticipations = progress.length;
      const totalCompletions = progress.filter((p) => p.completed).length;
      const overallCompletionRate =
        totalParticipations > 0 ? (totalCompletions / totalParticipations) * 100 : 0;

      // Stats by difficulty
      const difficultyStats = ['easy', 'medium', 'hard', 'expert'].map((diff) => {
        const diffChallenges = challengeAnalytics.filter((c) => c.difficulty === diff);
        const diffParticipants = diffChallenges.reduce((sum, c) => sum + c.totalParticipants, 0);
        const diffCompleted = diffChallenges.reduce((sum, c) => sum + c.completedCount, 0);
        return {
          difficulty: diff,
          challengeCount: diffChallenges.length,
          participants: diffParticipants,
          completions: diffCompleted,
          completionRate: diffParticipants > 0 ? (diffCompleted / diffParticipants) * 100 : 0,
        };
      });

      return {
        /** Per-challenge analytics */
        challenges: challengeAnalytics,
        /** Summary statistics */
        summary: {
          totalChallenges,
          activeChallenges,
          totalParticipations,
          totalCompletions,
          overallCompletionRate,
        },
        /** Stats broken down by difficulty */
        difficultyStats,
      };
    },
  });
}

/**
 * Hook to fetch user retention analytics
 *
 * Returns DAU/WAU/MAU metrics, login streak distribution, and
 * overall engagement statistics.
 *
 * @returns {UseQueryResult} Query result with retention metrics
 *
 * @example
 * ```tsx
 * function RetentionDashboard() {
 *   const { data } = useAdminRetentionAnalytics();
 *
 *   return (
 *     <div>
 *       <MetricCard label="DAU" value={data?.dau} percent={data?.dauPercent} />
 *       <MetricCard label="WAU" value={data?.wau} percent={data?.wauPercent} />
 *       <MetricCard label="MAU" value={data?.mau} percent={data?.mauPercent} />
 *       <StreakChart data={data?.streakDistribution} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useAdminRetentionAnalytics() {
  return useQuery({
    queryKey: ['admin-retention-analytics'],
    queryFn: async () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [totalUsersResult, dauResult, wauResult, mauResult, loginRewardsResult] =
        await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase
            .from('game_saves')
            .select('id', { count: 'exact', head: true })
            .gte('last_played_at', oneDayAgo),
          supabase
            .from('game_saves')
            .select('id', { count: 'exact', head: true })
            .gte('last_played_at', sevenDaysAgo),
          supabase
            .from('game_saves')
            .select('id', { count: 'exact', head: true })
            .gte('last_played_at', thirtyDaysAgo),
          supabase.from('daily_login_rewards').select('*'),
        ]);

      const loginData = loginRewardsResult.data || [];
      const totalUsers = totalUsersResult.count ?? 0;
      const dau = dauResult.count ?? 0;
      const wau = wauResult.count ?? 0;
      const mau = mauResult.count ?? 0;

      // Calculate streak distribution
      const streakDistribution = [
        { range: '1 day', count: loginData.filter((l) => (l.current_streak ?? 0) === 1).length },
        {
          range: '2-3 days',
          count: loginData.filter(
            (l) => (l.current_streak ?? 0) >= 2 && (l.current_streak ?? 0) <= 3
          ).length,
        },
        {
          range: '4-7 days',
          count: loginData.filter(
            (l) => (l.current_streak ?? 0) >= 4 && (l.current_streak ?? 0) <= 7
          ).length,
        },
        {
          range: '8-14 days',
          count: loginData.filter(
            (l) => (l.current_streak ?? 0) >= 8 && (l.current_streak ?? 0) <= 14
          ).length,
        },
        {
          range: '15-30 days',
          count: loginData.filter(
            (l) => (l.current_streak ?? 0) >= 15 && (l.current_streak ?? 0) <= 30
          ).length,
        },
        { range: '30+ days', count: loginData.filter((l) => (l.current_streak ?? 0) > 30).length },
      ];

      const avgStreak =
        loginData.length > 0
          ? loginData.reduce((sum, l) => sum + (l.current_streak ?? 0), 0) / loginData.length
          : 0;
      const maxStreak = loginData.reduce((max, l) => Math.max(max, l.longest_streak ?? 0), 0);

      return {
        /** Daily active users */
        dau,
        /** Weekly active users */
        wau,
        /** Monthly active users */
        mau,
        /** Total registered users */
        totalUsers,
        /** DAU as percentage of total users */
        dauPercent: totalUsers > 0 ? (dau / totalUsers) * 100 : 0,
        /** WAU as percentage of total users */
        wauPercent: totalUsers > 0 ? (wau / totalUsers) * 100 : 0,
        /** MAU as percentage of total users */
        mauPercent: totalUsers > 0 ? (mau / totalUsers) * 100 : 0,
        /** Login streak distribution for charts */
        streakDistribution,
        /** Average login streak */
        avgStreak,
        /** Maximum login streak across all users */
        maxStreak,
        /** Total login count across all users */
        totalLogins: loginData.reduce((sum, l) => sum + (l.total_logins ?? 0), 0),
      };
    },
  });
}
