import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// ============================================================================
// CORS
// ============================================================================

const ALLOWED_ORIGINS: (string | RegExp)[] = [
  'https://cozy-cat-empire.lovable.app',
  /^https:\/\/.*\.lovable\.app$/,
  /^http:\/\/localhost(:\d+)?$/,
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.some(o =>
    typeof o === 'string' ? o === origin : o.test(origin)
  );
  return {
    'Access-Control-Allow-Origin': allowed ? origin : 'https://cozy-cat-empire.lovable.app',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[cleanup-logs] Starting cleanup job');

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing required environment variables' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString();

    console.log(`[cleanup-logs] Deleting logs older than ${cutoffDate}`);

    const { data: errorData, error: errorError } = await supabase
      .from('error_logs')
      .delete()
      .lt('created_at', cutoffDate)
      .select('id');

    if (errorError) {
      console.error('[cleanup-logs] error_logs delete error:', errorError);
    }
    const errorCount = errorData?.length || 0;

    const { data: appData, error: appError } = await supabase
      .from('application_logs')
      .delete()
      .lt('created_at', cutoffDate)
      .select('id');

    if (appError) {
      console.error('[cleanup-logs] application_logs delete error:', appError);
    }
    const appCount = appData?.length || 0;

    const { data: activityData, error: activityError } = await supabase
      .from('player_activity_log')
      .delete()
      .lt('created_at', cutoffDate)
      .select('id');

    if (activityError) {
      console.error('[cleanup-logs] player_activity_log delete error:', activityError);
    }
    const activityCount = activityData?.length || 0;

    const totalDeleted = errorCount + appCount + activityCount;
    console.log(`[cleanup-logs] Deleted: ${errorCount} error_logs, ${appCount} application_logs, ${activityCount} activity_logs (total: ${totalDeleted})`);

    return new Response(
      JSON.stringify({
        success: true,
        deleted: {
          error_logs: errorCount,
          application_logs: appCount,
          player_activity_log: activityCount,
          total: totalDeleted,
        },
        cutoff_date: cutoffDate,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[cleanup-logs] Error:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage, timestamp: new Date().toISOString() }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
