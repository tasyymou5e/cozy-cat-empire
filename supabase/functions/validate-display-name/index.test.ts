import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/validate-display-name`;

Deno.test("validate-display-name: rejects empty display name", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ displayName: "" }),
  });

  const body = await response.json();
  assertEquals(response.status, 400);
  assertEquals(body.valid, false);
});

Deno.test("validate-display-name: validates good display name format", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ displayName: "TestPlayer_" + Date.now() }),
  });

  const body = await response.json();
  assertEquals(response.status, 200);
  assertEquals(body.valid, true);
  assertExists(body.sanitized);
});

Deno.test("validate-display-name: rejects short names", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ displayName: "ab" }),
  });

  const body = await response.json();
  assertEquals(response.status, 200);
  assertEquals(body.valid, false);
  assertExists(body.error);
});

Deno.test("validate-display-name: blocks profanity", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ displayName: "fuck_player" }),
  });

  const body = await response.json();
  assertEquals(response.status, 200);
  assertEquals(body.valid, false);
  assertEquals(body.profanityViolation, true);
});

Deno.test("validate-display-name: rejects special characters", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ displayName: "Player<script>" }),
  });

  const body = await response.json();
  assertEquals(response.status, 200);
  assertEquals(body.valid, false);
});

Deno.test("validate-display-name: validates username action", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      displayName: "dummy",
      username: "testuser" + Date.now(),
      action: "validate_username",
    }),
  });

  const body = await response.json();
  assertEquals(response.status, 200);
  assertEquals(body.valid, true);
  await response.text().catch(() => {});
});

Deno.test("validate-display-name: handles CORS preflight", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "OPTIONS",
    headers: { "apikey": SUPABASE_ANON_KEY },
  });

  assertEquals(response.status, 200);
  await response.text();
});
