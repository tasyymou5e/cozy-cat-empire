import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

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

// ============================================================================
// DB-backed rate limiting
// ============================================================================

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 10;

async function checkDbRateLimit(
  supabase: ReturnType<typeof createClient>,
  identifier: string,
  functionName: string,
  windowMs: number,
  maxRequests: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  // Try to get existing record
  const { data: existing } = await supabase
    .from('edge_function_rate_limits')
    .select('id, request_count, window_start')
    .eq('identifier', identifier)
    .eq('function_name', functionName)
    .maybeSingle();

  if (!existing) {
    // No record — create one
    await supabase.from('edge_function_rate_limits').insert({
      identifier, function_name: functionName, request_count: 1, window_start: now.toISOString(),
    });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  const existingWindowStart = new Date(existing.window_start);

  if (existingWindowStart < windowStart) {
    // Window expired — reset
    await supabase.from('edge_function_rate_limits')
      .update({ request_count: 1, window_start: now.toISOString() })
      .eq('id', existing.id);
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (existing.request_count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  // Increment
  await supabase.from('edge_function_rate_limits')
    .update({ request_count: existing.request_count + 1 })
    .eq('id', existing.id);
  return { allowed: true, remaining: maxRequests - (existing.request_count + 1) };
}

// ============================================================================
// Schema & Env
// ============================================================================

const RequestSchema = z.object({
  userId: z.string().uuid("userId must be a valid UUID"),
});

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
  throw new Error("Missing required env vars");
}

// ============================================================================
// Main handler
// ============================================================================

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUser = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !caller) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: hasAdminRole, error: roleError } = await supabaseAdmin.rpc('has_role', {
      _user_id: caller.id,
      _role: 'admin',
    });

    if (roleError || !hasAdminRole) {
      return new Response(
        JSON.stringify({ error: 'Access denied: Admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DB-backed rate limit
    const rateLimit = await checkDbRateLimit(supabaseAdmin, caller.id, 'admin-delete-user', RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.', remaining: rateLimit.remaining }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-RateLimit-Remaining': rateLimit.remaining.toString() } }
      );
    }

    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.issues[0]?.message || "Invalid input" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userId } = parsed.data;

    if (userId === caller.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Admin ${caller.id} deleting user ${userId}`);

    await supabaseAdmin.from('admin_activity_log').insert({
      admin_user_id: caller.id,
      action_type: 'user_deletion',
      action_description: `Deleted user ${userId}`,
      target_user_id: userId,
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'),
      user_agent: req.headers.get('user-agent'),
    });

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Failed to delete profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) {
      console.error('Failed to delete auth user:', authError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete user from authentication' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully deleted user ${userId}`);

    return new Response(
      JSON.stringify({ success: true, rateLimitRemaining: rateLimit.remaining }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-RateLimit-Remaining': rateLimit.remaining.toString() } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
