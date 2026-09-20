import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
});

/**
 * First-admin bootstrap. Public by necessity (the caller has no session yet),
 * but safe: it verifies the supplied credentials by performing a real
 * server-side sign-in, then grants the admin role ONLY when the
 * `user_roles` table contains no admin at all. Once one admin exists,
 * every later call returns { granted: false } and does nothing.
 */
export const bootstrapAdmin = createServerFn({ method: "POST" })
  .inputValidator((data) => credentialsSchema.parse(data))
  .handler(async ({ data }) => {
    const supabaseUrl = process.env["SUPABASE_URL"]!;
    const publishableKey = process.env["SUPABASE_PUBLISHABLE_KEY"]!;

    // Verify the credentials are real before touching roles.
    const { createClient } = await import("@supabase/supabase-js");
    const verifyClient = createClient(supabaseUrl, publishableKey, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const { data: signInData, error: signInError } =
      await verifyClient.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
    if (signInError || !signInData.user) {
      return { granted: false as const, reason: "invalid_credentials" as const };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count, error: countError } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (countError) {
      throw new Error(`Failed to check admin roles: ${countError.message}`);
    }

    if ((count ?? 0) > 0) {
      return { granted: false as const, reason: "admin_exists" as const };
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: signInData.user.id, role: "admin" })
      .select()
      .single();
    if (insertError) {
      throw new Error(`Failed to grant admin role: ${insertError.message}`);
    }

    await supabaseAdmin.from("admin_activity_log").insert({
      admin_user_id: signInData.user.id,
      action_type: "bootstrap_admin",
      action_description: "First admin account bootstrapped via portal sign-up",
      target_user_id: signInData.user.id,
      target_table: "user_roles",
      metadata: { email: data.email },
    });

    return { granted: true as const, roleId: inserted.id };
  });
