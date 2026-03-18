import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
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
// Env & Schema
// ============================================================================

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing required env vars: RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
}

const resend = new Resend(RESEND_API_KEY);

const RequestSchema = z.object({
  job_name: z.string().min(1).max(200),
  job_id: z.number().int(),
  status: z.string().min(1).max(50),
  error_message: z.string().max(5000).default(""),
  start_time: z.string(),
  end_time: z.string(),
  is_test: z.boolean().optional().default(false),
});

serve(async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { job_name, job_id, status, error_message, start_time, end_time, is_test } = parsed.data;
    console.log(`[send-admin-alert] Processing alert for job: ${job_name}, status: ${status}`);

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { data: adminRoles, error: rolesError } = await supabase
      .from("user_roles").select("user_id").eq("role", "admin");
    if (rolesError) { console.error("[send-admin-alert] Error fetching admin roles:", rolesError); throw rolesError; }
    if (!adminRoles || adminRoles.length === 0) {
      return new Response(JSON.stringify({ message: "No admins to notify" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const adminIds = adminRoles.map((r) => r.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles").select("email").in("id", adminIds).not("email", "is", null);
    if (profilesError) { console.error("[send-admin-alert] Error fetching admin profiles:", profilesError); throw profilesError; }

    const adminEmails = profiles?.map((p) => p.email).filter(Boolean) as string[];
    if (adminEmails.length === 0) {
      return new Response(JSON.stringify({ message: "No admin emails found" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`[send-admin-alert] Sending alert to ${adminEmails.length} admin(s)`);

    const startFormatted = new Date(start_time).toLocaleString("en-US", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" });
    const endFormatted = end_time ? new Date(end_time).toLocaleString("en-US", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" }) : "N/A";

    const subject = is_test ? `🧪 Test Alert: Cron Job Notification System` : `🚨 Cron Job Failed: ${job_name}`;
    const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:${is_test?'#3b82f6':'#ef4444'};color:white;padding:20px;border-radius:8px 8px 0 0}.content{background:#f9fafb;padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px}.detail{margin:12px 0}.label{font-weight:600;color:#6b7280}.value{margin-top:4px;padding:8px 12px;background:white;border-radius:4px;font-family:monospace}.error{background:#fef2f2;border-left:3px solid #ef4444;padding:12px;margin:16px 0}.button{display:inline-block;background:#3b82f6;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin-top:16px}.footer{margin-top:20px;font-size:12px;color:#9ca3af}</style></head><body><div class="container"><div class="header"><h1 style="margin:0;font-size:20px;">${is_test?'🧪 Test Alert':'🚨 Job Failure Alert'}</h1><p style="margin:8px 0 0 0;opacity:0.9;">Cat Farm Admin Notification</p></div><div class="content">${is_test?'<p>This is a test alert to verify the notification system is working correctly.</p>':'<p>A scheduled job has failed and may require your attention.</p>'}<div class="detail"><div class="label">Job Name</div><div class="value">${job_name}</div></div><div class="detail"><div class="label">Job ID</div><div class="value">${job_id}</div></div><div class="detail"><div class="label">Status</div><div class="value" style="color:${status==='failed'?'#ef4444':'#22c55e'};">${status.toUpperCase()}</div></div><div class="detail"><div class="label">Started</div><div class="value">${startFormatted} UTC</div></div><div class="detail"><div class="label">Ended</div><div class="value">${endFormatted} UTC</div></div>${error_message?`<div class="error"><div class="label">Error Message</div><div style="margin-top:8px;font-family:monospace;font-size:13px;word-break:break-word;">${error_message}</div></div>`:''}<a href="https://lovable.dev" class="button">View Dashboard</a><div class="footer"><p>This is an automated message from Cat Farm's job monitoring system.</p></div></div></div></body></html>`;

    const emailResponse = await resend.emails.send({
      from: "Cat Farm Alerts <onboarding@resend.dev>",
      to: adminEmails,
      subject,
      html: htmlContent,
    });

    console.log("[send-admin-alert] Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, recipients: adminEmails.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[send-admin-alert] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
