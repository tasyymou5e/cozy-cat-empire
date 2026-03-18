import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

interface LinterIssue {
  id: string;
  level: "error" | "warn" | "info";
  category: "RLS" | "AUTH" | "POLICY" | "PERMISSIONS";
  title: string;
  description: string;
  tables?: string[];
  recommendation: string;
  docLink?: string;
}

interface LinterResults {
  scannedAt: string;
  scanDurationMs: number;
  totalIssues: number;
  errors: number;
  warnings: number;
  infos: number;
  issues: LinterIssue[];
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    return new Response(
      JSON.stringify({ error: "Server misconfigured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const startTime = Date.now();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: isAdmin } = await userClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const issues: LinterIssue[] = [];

    const { data: tablesWithoutRLS } = await adminClient.rpc("get_tables_without_rls");
    if (tablesWithoutRLS && tablesWithoutRLS.length > 0) {
      issues.push({
        id: "no-rls-enabled",
        level: "error",
        category: "RLS",
        title: "Tables Without RLS Enabled",
        description: `${tablesWithoutRLS.length} table(s) do not have Row Level Security enabled.`,
        tables: tablesWithoutRLS.map((t: { tablename: string }) => t.tablename),
        recommendation: "Enable RLS on all tables containing user data.",
        docLink: "https://supabase.com/docs/guides/auth/row-level-security",
      });
    }

    const { data: permissivePolicies } = await adminClient.rpc("get_permissive_policies");
    if (permissivePolicies && permissivePolicies.length > 0) {
      const groupedByType: Record<string, string[]> = {};
      permissivePolicies.forEach((p: { tablename: string; policyname: string; cmd: string }) => {
        const key = p.cmd || "UNKNOWN";
        if (!groupedByType[key]) groupedByType[key] = [];
        if (!groupedByType[key].includes(p.tablename)) {
          groupedByType[key].push(p.tablename);
        }
      });

      Object.entries(groupedByType).forEach(([cmd, tables]) => {
        issues.push({
          id: `permissive-policy-${cmd.toLowerCase()}`,
          level: cmd === "SELECT" ? "info" : "warn",
          category: "POLICY",
          title: `Permissive ${cmd} Policies (USING true)`,
          description: `${tables.length} table(s) have ${cmd} policies that allow all authenticated users or anyone.`,
          tables,
          recommendation: cmd === "SELECT"
            ? "Verify public SELECT access is intentional for these tables."
            : "Add proper authentication checks to restrict access.",
          docLink: "https://supabase.com/docs/guides/auth/row-level-security",
        });
      });
    }

    const { data: tablesWithoutAdminSelect } = await adminClient.rpc("get_tables_without_admin_access");
    if (tablesWithoutAdminSelect && tablesWithoutAdminSelect.length > 0) {
      issues.push({
        id: "missing-admin-select",
        level: "warn",
        category: "PERMISSIONS",
        title: "Tables Missing Admin SELECT Access",
        description: `${tablesWithoutAdminSelect.length} table(s) have RLS but no explicit admin SELECT policy.`,
        tables: tablesWithoutAdminSelect.map((t: { tablename: string }) => t.tablename),
        recommendation: "Add admin SELECT policies for moderation.",
      });
    }

    const { data: authConfig } = await adminClient.rpc("get_auth_config_status");
    if (authConfig) {
      if (authConfig.leaked_password_protection === false) {
        issues.push({ id: "leaked-password-disabled", level: "warn", category: "AUTH", title: "Leaked Password Protection Disabled", description: "Users can sign up with passwords that have been exposed in data breaches.", recommendation: "Enable leaked password protection.", docLink: "https://supabase.com/docs/guides/auth/auth-password-security" });
      }
      if (authConfig.enable_signup === false) {
        issues.push({ id: "signup-disabled", level: "info", category: "AUTH", title: "New User Signups Disabled", description: "New users cannot create accounts.", recommendation: "Enable signups if you want new users to register." });
      }
    }

    const { data: dangerousPolicies } = await adminClient.rpc("get_dangerous_public_policies");
    if (dangerousPolicies && dangerousPolicies.length > 0) {
      const tables = [...new Set(dangerousPolicies.map((p: { tablename: string }) => p.tablename))];
      issues.push({
        id: "dangerous-public-write",
        level: "error",
        category: "POLICY",
        title: "Public Write Policies Detected",
        description: `${tables.length} table(s) allow INSERT, UPDATE, or DELETE without authentication.`,
        tables: tables as string[],
        recommendation: "Add authentication checks to write policies.",
        docLink: "https://supabase.com/docs/guides/auth/row-level-security",
      });
    }

    const scanDurationMs = Date.now() - startTime;

    const results: LinterResults = {
      scannedAt: new Date().toISOString(),
      scanDurationMs,
      totalIssues: issues.length,
      errors: issues.filter((i) => i.level === "error").length,
      warnings: issues.filter((i) => i.level === "warn").length,
      infos: issues.filter((i) => i.level === "info").length,
      issues,
    };

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Security linter error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
