import { createFileRoute } from '@tanstack/react-router';
import { jsonResponse, preflightResponse, verifyJobSecret } from '@/lib/jobs/jobAuth.server';
import { runSyncHealthCheck } from '@/lib/jobs/syncHealthCheck.server';

export const Route = createFileRoute('/api/public/jobs/sync-health-check')({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => preflightResponse(request),
      POST: async ({ request }) => {
        const unauthorized = await verifyJobSecret(request);
        if (unauthorized) return unauthorized;

        try {
          const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
          const result = await runSyncHealthCheck(supabaseAdmin);
          return jsonResponse(request, result);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          console.error('Sync health check error:', message);
          return jsonResponse(request, { error: message }, 500);
        }
      },
    },
  },
});
