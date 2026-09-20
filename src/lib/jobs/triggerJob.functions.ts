import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const JobNameSchema = z.enum([
  'sync-health-check',
  'process-leaderboard-rewards',
  'cleanup-error-logs',
  'generate-weekly-challenges',
]);

const TestAlertSchema = z.object({
  job_name: z.string().min(1).max(200),
  job_id: z.number().int(),
  status: z.string().min(1).max(50),
  error_message: z.string().max(5000).default(''),
  start_time: z.string(),
  end_time: z.string(),
  is_test: z.boolean().optional().default(false),
});

/**
 * Runs a scheduled job on demand. Admin-only: the caller's role is verified
 * with the user-scoped client before any privileged work happens.
 */
export const triggerScheduledJob = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { job: z.infer<typeof JobNameSchema> }) =>
    z.object({ job: JobNameSchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc('has_role', {
      _user_id: context.userId,
      _role: 'admin',
    });
    if (roleError) throw new Error(roleError.message);
    if (!isAdmin) throw new Error('Forbidden');

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

    switch (data.job) {
      case 'sync-health-check': {
        const { runSyncHealthCheck } = await import('./syncHealthCheck.server');
        return await runSyncHealthCheck(supabaseAdmin);
      }
      case 'process-leaderboard-rewards': {
        const { runProcessLeaderboardRewards } = await import('./leaderboardRewards.server');
        return await runProcessLeaderboardRewards(supabaseAdmin);
      }
      case 'cleanup-error-logs': {
        const { runCleanupErrorLogs } = await import('./cleanupErrorLogs.server');
        return await runCleanupErrorLogs(supabaseAdmin);
      }
      case 'generate-weekly-challenges': {
        const { runGenerateWeeklyChallenges } = await import('./weeklyChallenges.server');
        return await runGenerateWeeklyChallenges(supabaseAdmin);
      }
    }
  });

/** Sends a failure/test alert email to all admins. Admin-only. */
export const sendAdminAlertNow = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.input<typeof TestAlertSchema>) => TestAlertSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc('has_role', {
      _user_id: context.userId,
      _role: 'admin',
    });
    if (roleError) throw new Error(roleError.message);
    if (!isAdmin) throw new Error('Forbidden');

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { runSendAdminAlert } = await import('./adminAlert.server');
    return await runSendAdminAlert(supabaseAdmin, data);
  });
