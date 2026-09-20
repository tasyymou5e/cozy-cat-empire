import type { SupabaseClient } from '@supabase/supabase-js';

export interface CleanupLogsResult {
  success: true;
  deleted: {
    error_logs: number;
    application_logs: number;
    player_activity_log: number;
    total: number;
  };
  cutoff_date: string;
  timestamp: string;
}

/** Deletes log rows older than 30 days across the three log tables. */
export async function runCleanupErrorLogs(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
): Promise<CleanupLogsResult> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffDate = cutoff.toISOString();

  console.log(`[cleanup-logs] Deleting logs older than ${cutoffDate}`);

  const tables = ['error_logs', 'application_logs', 'player_activity_log'] as const;
  const counts: Record<string, number> = {};

  for (const table of tables) {
    const { data, error } = await supabase.from(table).delete().lt('created_at', cutoffDate).select('id');
    if (error) console.error(`[cleanup-logs] ${table} delete error:`, error);
    counts[table] = data?.length || 0;
  }

  const total = tables.reduce((sum, t) => sum + (counts[t] ?? 0), 0);
  console.log(
    `[cleanup-logs] Deleted: ${counts['error_logs']} error_logs, ${counts['application_logs']} application_logs, ${counts['player_activity_log']} activity_logs (total: ${total})`,
  );

  return {
    success: true,
    deleted: {
      error_logs: counts['error_logs'] ?? 0,
      application_logs: counts['application_logs'] ?? 0,
      player_activity_log: counts['player_activity_log'] ?? 0,
      total,
    },
    cutoff_date: cutoffDate,
    timestamp: new Date().toISOString(),
  };
}
