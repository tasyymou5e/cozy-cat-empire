import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();

    // Get auth header and verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the user is an admin
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

    // Check if user is admin
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

    // Use service role for security checks
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const issues: LinterIssue[] = [];

    // 1. Check for tables without RLS enabled
    const { data: tablesWithoutRLS } = await adminClient.rpc("get_tables_without_rls");
    
    if (tablesWithoutRLS && tablesWithoutRLS.length > 0) {
      issues.push({
        id: "no-rls-enabled",
        level: "error",
        category: "RLS",
        title: "Tables Without RLS Enabled",
        description: `${tablesWithoutRLS.length} table(s) do not have Row Level Security enabled, allowing unrestricted access.`,
        tables: tablesWithoutRLS.map((t: { tablename: string }) => t.tablename),
        recommendation: "Enable RLS on all tables containing user data with: ALTER TABLE tablename ENABLE ROW LEVEL SECURITY;",
        docLink: "https://supabase.com/docs/guides/auth/row-level-security",
      });
    }

    // 2. Check for overly permissive policies (USING true)
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

    // 3. Check for tables with policies but missing admin access
    const { data: tablesWithoutAdminSelect } = await adminClient.rpc("get_tables_without_admin_access");

    if (tablesWithoutAdminSelect && tablesWithoutAdminSelect.length > 0) {
      issues.push({
        id: "missing-admin-select",
        level: "warn",
        category: "PERMISSIONS",
        title: "Tables Missing Admin SELECT Access",
        description: `${tablesWithoutAdminSelect.length} table(s) have RLS but no explicit admin SELECT policy.`,
        tables: tablesWithoutAdminSelect.map((t: { tablename: string }) => t.tablename),
        recommendation: "Add admin SELECT policies for moderation: CREATE POLICY \"Admins can view all\" ON table FOR SELECT USING (has_role(auth.uid(), 'admin'));",
      });
    }

    // 4. Check auth configuration
    const { data: authConfig } = await adminClient.rpc("get_auth_config_status");

    if (authConfig) {
      if (authConfig.leaked_password_protection === false) {
        issues.push({
          id: "leaked-password-disabled",
          level: "warn",
          category: "AUTH",
          title: "Leaked Password Protection Disabled",
          description: "Users can sign up with passwords that have been exposed in data breaches.",
          recommendation: "Enable leaked password protection in Auth settings for improved security.",
          docLink: "https://supabase.com/docs/guides/auth/auth-password-security",
        });
      }

      if (authConfig.enable_signup === false) {
        issues.push({
          id: "signup-disabled",
          level: "info",
          category: "AUTH",
          title: "New User Signups Disabled",
          description: "New users cannot create accounts. This may be intentional.",
          recommendation: "Enable signups if you want new users to register.",
        });
      }
    }

    // 5. Check for public INSERT/UPDATE/DELETE policies (dangerous)
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
        recommendation: "Add authentication checks to write policies. Only error_logs and auth_attempts_log should allow public inserts.",
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
