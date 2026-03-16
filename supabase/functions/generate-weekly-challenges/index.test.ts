import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const FUNCTION_SECRET = Deno.env.get("FUNCTION_SECRET_TOKEN") || "";
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/generate-weekly-challenges`;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("generate-weekly-challenges: rejects missing auth", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
  });

  const body = await response.json();
  // Should be 401 (no secret) or 500 (no secret configured)
  const validStatuses = [401, 500];
  assertEquals(validStatuses.includes(response.status), true);
  await response.text().catch(() => {});
});

Deno.test("generate-weekly-challenges: handles CORS preflight", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "OPTIONS",
    headers: { "apikey": SUPABASE_ANON_KEY },
  });

  assertEquals(response.status, 200);
  await response.text();
});
