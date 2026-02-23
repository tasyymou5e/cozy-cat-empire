import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { action, ...payload } = await req.json();

    switch (action) {
      case "chat":
        return handleChat(payload, LOVABLE_API_KEY);
      case "name":
        return handleNameGeneration(payload, LOVABLE_API_KEY);
      case "story":
        return handleStoryGeneration(payload, LOVABLE_API_KEY);
      case "tips":
        return handleTipsGeneration(payload, LOVABLE_API_KEY);
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

async function handleChat(
  payload: { messages: { role: string; content: string }[] },
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
  });

  if (!response.ok) {
    return handleGatewayError(response);
  }

  return new Response(response.body, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}

async function handleNameGeneration(
  payload: { breed: string; personality: string; appearance?: Record<string, unknown> },
  apiKey: string
) {
  const prompt = `Generate 6 creative and unique names for a ${payload.breed} cat with a ${payload.personality} personality.${
    payload.appearance
      ? ` The cat has ${payload.appearance.furColor || ""} fur, ${payload.appearance.eyeColor || ""} eyes, and ${payload.appearance.pattern || "solid"} pattern.`
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
  payload: {
    name: string;
    breed: string;
    personality: string;
    grade?: number;
    showWins?: number;
    tricksLearned?: string[];
    appearance?: Record<string, unknown>;
  },
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
  payload: {
    money: number;
    day: number;
    catCount: number;
    space: number;
    houseSize: string;
    resources: Record<string, number>;
    totalShowWins: number;
    acres?: number;
    breedingCooldown?: number;
  },
  apiKey: string
) {
  const prompt = `Analyze this cat farm and provide 3-5 strategic tips:

- Day: ${payload.day}
- Money: $${payload.money}
- Cats: ${payload.catCount}/${payload.space} capacity
- Housing: ${payload.houseSize}${payload.acres ? ` (${payload.acres} acres)` : ""}
- Resources: Food=${payload.resources.food}, Medicine=${payload.resources.medicine}, Toys=${payload.resources.toys}, Treats=${payload.resources.treats}
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
