

# Security Hardening Plan

Based on the audit, here are the actionable fixes prioritized by impact.

## 1. Restrict CORS to production domains (all 16 edge functions)

Replace `'Access-Control-Allow-Origin': '*'` with a helper that checks the request `Origin` header against an allowlist:
- `https://cozy-cat-empire.lovable.app`
- `https://id-preview--e8e83e8c-0c77-43d8-8d1e-9f913ade2ac9.lovable.app`
- `http://localhost:*` patterns for dev

Create a shared CORS utility approach (inlined in each function since edge functions can't share imports across folders). Each function's `corsHeaders` becomes dynamic based on the incoming `Origin`.

**Files**: All 16 `supabase/functions/*/index.ts`

## 2. Database-backed rate limiting for edge functions

Replace in-memory `Map`/object rate limit stores with queries against the existing `admin_rate_limits` table pattern. Create a new `edge_function_rate_limits` table:

```sql
CREATE TABLE public.edge_function_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,        -- user_id or IP
  function_name text NOT NULL,
  request_count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  UNIQUE(identifier, function_name)
);
ALTER TABLE public.edge_function_rate_limits ENABLE ROW LEVEL SECURITY;
-- Only service role can read/write (edge functions use service role client)
```

Update these functions to use DB-backed limits:
- `send-push-notification` (currently in-memory per-user)
- `process-leaderboard-rewards` (currently in-memory global)
- `generate-cat-portrait` (currently in-memory per-user)

## 3. Add rate limiting to `cat-ai-assistant`

Currently has no rate limit at all. Add DB-backed rate limiting (e.g., 30 requests/user/hour) using the same table from step 2.

**File**: `supabase/functions/cat-ai-assistant/index.ts`

## 4. Add input validation to `process-leaderboard-rewards`

Add Zod schema validation for the request body (currently accepts any JSON without validation).

**File**: `supabase/functions/process-leaderboard-rewards/index.ts`

## Technical Details

### CORS helper (inlined in each function)
```typescript
const ALLOWED_ORIGINS = [
  'https://cozy-cat-empire.lovable.app',
  /^https:\/\/.*\.lovable\.app$/,
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.some(o =>
    typeof o === 'string' ? o === origin : o.test(origin)
  );
  return {
    'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, ...',
  };
}
```

### Rate limit table + query pattern
Edge functions use service role client to upsert into `edge_function_rate_limits`, checking `request_count` against the configured max within the time window. On window expiry, the row resets.

### Summary of changes
| # | Task | Files | Effort |
|---|------|-------|--------|
| 1 | CORS restriction | 16 edge functions | Medium |
| 2 | DB-backed rate limits | 3 edge functions + 1 migration | Medium |
| 3 | AI assistant rate limit | 1 edge function | Low |
| 4 | Leaderboard input validation | 1 edge function | Low |

