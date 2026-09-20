import { createFileRoute } from '@tanstack/react-router';
import { jsonResponse, preflightResponse, verifyJobSecret } from '@/lib/jobs/jobAuth.server';
import { runCleanupErrorLogs } from '@/lib/jobs/cleanupErrorLogs.server';

export const Route = createFileRoute('/api/public/jobs/cleanup-error-logs')({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => preflightResponse(request),
      POST: async ({ request }) => {
        const unauthorized = verifyJobSecret(request);
        if (unauthorized) return unauthorized;

        try {
          const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
          const result = await runCleanupErrorLogs(supabaseAdmin);
          return jsonResponse(request, result);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          console.error('[cleanup-logs] Error:', message);
          return jsonResponse(request, { success: false, error: message, timestamp: new Date().toISOString() }, 500);
        }
      },
    },
  },
});
