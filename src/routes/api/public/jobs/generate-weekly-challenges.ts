import { createFileRoute } from '@tanstack/react-router';
import { jsonResponse, preflightResponse, verifyJobSecret } from '@/lib/jobs/jobAuth.server';
import { runGenerateWeeklyChallenges } from '@/lib/jobs/weeklyChallenges.server';

export const Route = createFileRoute('/api/public/jobs/generate-weekly-challenges')({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => preflightResponse(request),
      POST: async ({ request }) => {
        const unauthorized = await verifyJobSecret(request);
        if (unauthorized) return unauthorized;

        try {
          const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
          const result = await runGenerateWeeklyChallenges(supabaseAdmin);
          return jsonResponse(request, result);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          console.error('Error generating challenges:', message);
          return jsonResponse(request, { error: message }, 500);
        }
      },
    },
  },
});
