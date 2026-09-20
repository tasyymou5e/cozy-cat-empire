import { createFileRoute } from '@tanstack/react-router';
import { jsonResponse, preflightResponse, verifyJobSecret } from '@/lib/jobs/jobAuth.server';
import { AdminAlertSchema, runSendAdminAlert } from '@/lib/jobs/adminAlert.server';

export const Route = createFileRoute('/api/public/jobs/send-admin-alert')({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => preflightResponse(request),
      POST: async ({ request }) => {
        const unauthorized = await verifyJobSecret(request);
        if (unauthorized) return unauthorized;

        try {
          const parsed = AdminAlertSchema.safeParse(await request.json());
          if (!parsed.success) {
            return jsonResponse(request, { error: 'Invalid request', details: parsed.error.flatten() }, 400);
          }

          const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
          const result = await runSendAdminAlert(supabaseAdmin, parsed.data);
          return jsonResponse(request, result);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          console.error('[send-admin-alert] Error:', message);
          return jsonResponse(request, { error: message }, 500);
        }
      },
    },
  },
});
