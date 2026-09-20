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
 * Read process.env inside the handler (env is injected per request on Workers).
 */
export function verifyJobSecret(request: Request): Response | null {
  const expected = process.env['FUNCTION_SECRET_TOKEN'];
  if (!expected) {
    console.error('[jobs] FUNCTION_SECRET_TOKEN not configured');
    return jsonResponse(request, { error: 'Server configuration error' }, 500);
  }
  const provided = request.headers.get('x-function-secret');
  if (!provided || !timingSafeEqual(provided, expected)) {
    console.error('[jobs] Invalid or missing function secret');
    return jsonResponse(request, { error: 'Unauthorized' }, 401);
  }
  return null;
}
