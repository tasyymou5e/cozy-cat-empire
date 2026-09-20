/**
 * Shared authentication + response helpers for the scheduled job endpoints
 * under src/routes/api/public/jobs/*.
 *
 * These routes bypass site auth, so every handler MUST verify the shared
 * secret (x-function-secret) before doing any work.
 */

const ALLOWED_ORIGINS: (string | RegExp)[] = [
  'https://cozy-cat-empire.lovable.app',
  /^https:\/\/.*\.lovable\.app$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^https:\/\/.*\.lovableproject\.com$/,
  /^https:\/\/(www\.)?cozycatempire\.com$/,
];

export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.some((o) => (typeof o === 'string' ? o === origin : o.test(origin)));
  return {
    'Access-Control-Allow-Origin': allowed ? origin : 'https://cozy-cat-empire.lovable.app',
    'Access-Control-Allow-Headers': 'authorization, content-type, x-function-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

export function jsonResponse(request: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' },
  });
}

export function preflightResponse(request: Request): Response {
  return new Response(null, { status: 204, headers: getCorsHeaders(request) });
}

/** Length-checked constant-time string compare. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Returns null when the caller is authorized, otherwise the Response to return.
 *
 * Two credentials are accepted, both compared in constant time:
 *  - FUNCTION_SECRET_TOKEN (env) — used by admin manual triggers / legacy callers
 *  - public.job_cron_secret.token (database) — used by pg_cron schedules, which
 *    cannot read worker env vars.
 */
export async function verifyJobSecret(request: Request): Promise<Response | null> {
  const provided = request.headers.get('x-function-secret');
  if (!provided) {
    console.error('[jobs] Missing function secret');
    return jsonResponse(request, { error: 'Unauthorized' }, 401);
  }

  const envSecret = process.env['FUNCTION_SECRET_TOKEN'];
  if (envSecret && timingSafeEqual(provided, envSecret)) return null;

  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data, error } = await supabaseAdmin
      .from('job_cron_secret')
      .select('token')
      .eq('id', true)
      .maybeSingle();
    if (error) throw error;
    if (data?.token && timingSafeEqual(provided, data.token)) return null;
  } catch (err) {
    console.error('[jobs] Failed to load cron secret:', err instanceof Error ? err.message : err);
    return jsonResponse(request, { error: 'Server configuration error' }, 500);
  }

  console.error('[jobs] Invalid function secret');
  return jsonResponse(request, { error: 'Unauthorized' }, 401);
}

