import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

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

let _currentCorsHeaders: Record<string, string>;

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const FETCH_TIMEOUT_MS = 30_000;

// ============================================================================
// Input Schemas
// ============================================================================

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(10000),
});

const ChatSchema = z.object({
  action: z.literal("chat"),
  messages: z.array(MessageSchema).min(1).max(50),
});

const NameSchema = z.object({
  action: z.literal("name"),
  breed: z.string().min(1).max(50),
  personality: z.string().min(1).max(50),
  appearance: z.record(z.unknown()).optional(),
});

const StorySchema = z.object({
  action: z.literal("story"),
  name: z.string().min(1).max(100),
  breed: z.string().min(1).max(50),
  personality: z.string().min(1).max(50),
  grade: z.number().int().min(1).max(20).optional(),
  showWins: z.number().int().min(0).optional(),
  tricksLearned: z.array(z.string()).optional(),
  appearance: z.record(z.unknown()).optional(),
});

const TipsSchema = z.object({
  action: z.literal("tips"),
  money: z.number().min(0),
  day: z.number().int().min(1),
  catCount: z.number().int().min(0),
  space: z.number().int().min(1),
  houseSize: z.string().min(1),
  resources: z.record(z.number()),
  totalShowWins: z.number().int().min(0),
  acres: z.number().int().min(0).optional(),
  breedingCooldown: z.number().int().min(0).optional(),
});

const ActionSchema = z.object({
  action: z.enum(["chat", "name", "story", "tips"]),
}).passthrough();

// ============================================================================
// Env validation
// ============================================================================

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
if (!LOVABLE_API_KEY) {
  throw new Error("LOVABLE_API_KEY is not configured — function cannot start");
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// ============================================================================
// System prompt
// ============================================================================

const WHISKERS_SYSTEM_PROMPT = `You are Whiskers, a wise and charming old cat who serves as a game advisor in "Cozy Cat Empire" — a browser-based cat farming game. You speak with cat-themed personality (occasional purrs, meows, and cat wisdom) but remain genuinely helpful.

Key game mechanics you know about:
- Players collect cats of 8 breeds (Stray, Tabby, Persian, Siamese, Maine Coon, British Shorthair, Ragdoll, Bengal)
- Cats have health, happiness, hunger stats (0-100)
- Cat grades (1-20) across tiers: Common, Fine, Rare, Elite, Legendary
- Housing: Apartment (5 cats) → House (10) → Mansion (25) → Farm (50+)
- Resources: Food, Medicine, Toys, Treats
- Features: Breeding, Training tricks, Cat Shows, Relationships, Trading
- Cats can learn tricks: Sit, Paw, Roll Over, Jump, Fetch
- Cat Shows have tiers: Local, Regional, National, International
- Relationships between cats range from Nemesis (-100) to Soul Mates (+100)

Keep responses concise, fun, and actionable. Use emoji sparingly. If asked about something outside the game, gently redirect to game topics.`;

// ============================================================================
// Main handler
// ============================================================================

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  _currentCorsHeaders = corsHeaders;
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate action type
    const body = await req.json();
    const actionResult = ActionSchema.safeParse(body);
    if (!actionResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request", details: actionResult.error.flatten() }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action } = actionResult.data;

    switch (action) {
      case "chat": {
        const parsed = ChatSchema.safeParse(body);
        if (!parsed.success) {
          return new Response(
            JSON.stringify({ error: "Invalid chat payload", details: parsed.error.flatten() }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        return handleChat(parsed.data, LOVABLE_API_KEY);
      }
      case "name": {
        const parsed = NameSchema.safeParse(body);
        if (!parsed.success) {
          return new Response(
            JSON.stringify({ error: "Invalid name payload", details: parsed.error.flatten() }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        return handleNameGeneration(parsed.data, LOVABLE_API_KEY);
      }
      case "story": {
        const parsed = StorySchema.safeParse(body);
        if (!parsed.success) {
          return new Response(
            JSON.stringify({ error: "Invalid story payload", details: parsed.error.flatten() }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        return handleStoryGeneration(parsed.data, LOVABLE_API_KEY);
      }
      case "tips": {
        const parsed = TipsSchema.safeParse(body);
        if (!parsed.success) {
          return new Response(
            JSON.stringify({ error: "Invalid tips payload", details: parsed.error.flatten() }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        return handleTipsGeneration(parsed.data, LOVABLE_API_KEY);
      }
      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (e) {
    console.error("cat-ai-assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ============================================================================
// Action handlers
// ============================================================================

async function handleChat(
  payload: z.infer<typeof ChatSchema>,
  apiKey: string
) {
  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: WHISKERS_SYSTEM_PROMPT },
        ...payload.messages,
      ],
      stream: true,
    }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    return handleGatewayError(response);
  }

  return new Response(response.body, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}

async function handleNameGeneration(
  payload: z.infer<typeof NameSchema>,
  apiKey: string
) {
  const prompt = `Generate 6 creative and unique names for a ${payload.breed} cat with a ${payload.personality} personality.${
    payload.appearance
      ? ` The cat has ${(payload.appearance as Record<string, string>).furColor || ""} fur, ${(payload.appearance as Record<string, string>).eyeColor || ""} eyes, and ${(payload.appearance as Record<string, string>).pattern || "solid"} pattern.`
      : ""
  } Each name should be memorable, fun, and fitting for the cat's characteristics. Include names from various inspirations: mythology, food, nature, pop culture, and wordplay.`;

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: "You are a creative cat naming expert. Generate unique, memorable cat names with brief meanings.",
        },
        { role: "user", content: prompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "suggest_names",
            description: "Return 6 creative cat name suggestions with meanings.",
            parameters: {
              type: "object",
              properties: {
                names: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "The cat name" },
                      meaning: { type: "string", description: "Brief explanation of the name (1 sentence)" },
                    },
                    required: ["name", "meaning"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["names"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "suggest_names" } },
    }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    return handleGatewayError(response);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall?.function?.arguments) {
    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ names: [] }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleStoryGeneration(
  payload: z.infer<typeof StorySchema>,
  apiKey: string
) {
  const tricks = payload.tricksLearned?.length
    ? `They've mastered ${payload.tricksLearned.join(", ")}.`
    : "";
  const wins = payload.showWins ? `They've won ${payload.showWins} cat shows.` : "";
  const gradeText = payload.grade ? `Grade ${payload.grade}/20.` : "";

  const prompt = `Write a creative, heartwarming 2-3 paragraph backstory for a cat named "${payload.name}". They are a ${payload.breed} with a ${payload.personality} personality. ${gradeText} ${wins} ${tricks}

Make it feel like a charming storybook entry. Include how they came to the farm, their quirks, and what makes them special. Keep it under 200 words.`;

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: "You are a creative storyteller who writes charming, whimsical cat backstories for a cozy cat farming game. Write in third person.",
        },
        { role: "user", content: prompt },
      ],
    }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    return handleGatewayError(response);
  }

  const data = await response.json();
  const story = data.choices?.[0]?.message?.content || "";
  return new Response(JSON.stringify({ story }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleTipsGeneration(
  payload: z.infer<typeof TipsSchema>,
  apiKey: string
) {
  const prompt = `Analyze this cat farm and provide 3-5 strategic tips:

- Day: ${payload.day}
- Money: $${payload.money}
- Cats: ${payload.catCount}/${payload.space} capacity
- Housing: ${payload.houseSize}${payload.acres ? ` (${payload.acres} acres)` : ""}
- Resources: Food=${payload.resources.food ?? 0}, Medicine=${payload.resources.medicine ?? 0}, Toys=${payload.resources.toys ?? 0}, Treats=${payload.resources.treats ?? 0}
- Show Wins: ${payload.totalShowWins}
- Breeding Cooldown: ${payload.breedingCooldown || 0} days

Consider: resource management, housing upgrades, breeding strategy, show preparation, and cat care priorities. Prioritize the most impactful advice.`;

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert cat farm strategist. Provide concise, actionable game tips.",
        },
        { role: "user", content: prompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "suggest_tips",
            description: "Return 3-5 prioritized strategic tips for the cat farm.",
            parameters: {
              type: "object",
              properties: {
                tips: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Short tip title" },
                      description: { type: "string", description: "Actionable advice (1-2 sentences)" },
                      priority: { type: "string", enum: ["high", "medium", "low"] },
                    },
                    required: ["title", "description", "priority"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["tips"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "suggest_tips" } },
    }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    return handleGatewayError(response);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall?.function?.arguments) {
    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ tips: [] }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleGatewayError(response: Response) {
  if (response.status === 429) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  if (response.status === 402) {
    return new Response(
      JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
      { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  const text = await response.text();
  console.error("AI gateway error:", response.status, text);
  return new Response(
    JSON.stringify({ error: "AI service temporarily unavailable." }),
    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
