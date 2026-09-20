import { createFileRoute } from '@tanstack/react-router';
import { jsonResponse, preflightResponse, verifyJobSecret } from '@/lib/jobs/jobAuth.server';
import { runProcessLeaderboardRewards } from '@/lib/jobs/leaderboardRewards.server';

export const Route = createFileRoute('/api/public/jobs/process-leaderboard-rewards')({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => preflightResponse(request),
      POST: async ({ request }) => {
        const unauthorized = verifyJobSecret(request);
        if (unauthorized) return unauthorized;

        try {
          const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
          const result = await runProcessLeaderboardRewards(supabaseAdmin);
          return jsonResponse(request, result);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          console.error('Error processing leaderboard rewards:', message);
          return jsonResponse(request, { success: false, error: message }, 500);
        }
      },
    },
  },
});
