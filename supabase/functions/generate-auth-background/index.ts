import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

const FETCH_TIMEOUT_MS = 60_000;

// ============================================================================
// Input schema
// ============================================================================

const RequestSchema = z.object({
  forceRegenerate: z.boolean().optional().default(false),
  season: z.enum(["spring", "summer", "autumn", "winter"]).optional(),
}).optional().default({});

// ============================================================================
// Env validation
// ============================================================================

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing required env vars: LOVABLE_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
}

// ============================================================================
// Season prompts
// ============================================================================

type Season = 'spring' | 'summer' | 'autumn' | 'winter';

const SEASONAL_PROMPTS: Record<Season, string> = {
  spring: `Create a bright, cheerful, kawaii-style cartoon cat farm landscape in SPRING.
Features: cherry blossoms, colorful flowers blooming, soft pink and green colors,
butterflies, baby chicks among the flowers.
Pastel colors, gentle rolling hills, cute red barn, white picket fences.
Style: clean vector illustration, minimal detail, soft gradients.
Wide panoramic 16:9 aspect ratio view suitable for a desktop background.
IMPORTANT: Do NOT include any cats, animals, or characters in this scene. Pure landscape only.
Ultra high resolution.`,

  summer: `Create a bright, cheerful, kawaii-style cartoon cat farm landscape in SUMMER.
Features: bright sunny day, sunflowers, blue sky with fluffy clouds,
ice cream stand, colorful bunting, garden sprinklers watering flowers.
Warm golden and green colors, vibrant and joyful.
Style: clean vector illustration, minimal detail, soft gradients.
Wide panoramic 16:9 aspect ratio view suitable for a desktop background.
IMPORTANT: Do NOT include any cats, animals, or characters in this scene. Pure landscape only.
Ultra high resolution.`,

  autumn: `Create a cozy, warm, kawaii-style cartoon cat farm landscape in AUTUMN.
Features: orange and golden leaves, pumpkins, harvest decorations,
leaf piles, apple trees, warm sunset colors.
Cozy barn with haystacks, falling leaves animation feel.
Style: clean vector illustration, minimal detail, soft gradients.
Wide panoramic 16:9 aspect ratio view suitable for a desktop background.
IMPORTANT: Do NOT include any cats, animals, or characters in this scene. Pure landscape only.
Ultra high resolution.`,

  winter: `Create a magical, cozy, kawaii-style cartoon cat farm landscape in WINTER.
Features: gentle snow falling, snowman, warm lights from barn windows,
snowflakes, pine trees with snow, tiny scarves hanging on fence.
Soft blue and white colors with warm orange glows from windows.
Style: clean vector illustration, minimal detail, soft gradients.
Wide panoramic 16:9 aspect ratio view suitable for a desktop background.
IMPORTANT: Do NOT include any cats, animals, or characters in this scene. Pure landscape only.
Ultra high resolution.`
};

const DEFAULT_PROMPT = `Create a bright, cheerful, kawaii-style cartoon illustration of a cozy cat farm landscape. 
Features: soft pastel colors with lavender and cream sky, gentle rolling green hills, 
a cute red barn with white trim, white picket fences, colorful flowers scattered around.
Style: clean vector illustration, minimal detail, soft gradients, 
warm and inviting atmosphere, suitable as a website background.
The scene should feel light, airy, fun, and child-friendly. No text.
Wide panoramic 16:9 aspect ratio view suitable for a desktop background.
IMPORTANT: Do NOT include any cats, animals, or characters in this scene. Pure landscape only.
Ultra high resolution.`;

const getBackgroundKey = (season?: Season) => `auth-background-${season || 'default'}-v2.png`;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Parse and validate request body
    const rawBody = await req.json().catch(() => ({}));
    const parsed = RequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let { forceRegenerate, season } = parsed.data;

    // forceRegenerate is destructive (deletes cached image and burns AI credits) — restrict to admins.
    // Anonymous and non-admin callers always get the cached image.
    if (forceRegenerate) {
      const authHeader = req.headers.get('Authorization');
      let isAdmin = false;
      if (authHeader) {
        try {
          const token = authHeader.replace('Bearer ', '');
          const { data: { user } } = await supabase.auth.getUser(token);
          if (user) {
            const { data: roleRow } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', user.id)
              .eq('role', 'admin')
              .maybeSingle();
            isAdmin = !!roleRow;
          }
        } catch (_e) {
          isAdmin = false;
        }
      }
      if (!isAdmin) {
        console.log('Non-admin caller requested forceRegenerate; ignoring and serving cached image.');
        forceRegenerate = false;
      }
    }

    const BACKGROUND_KEY = getBackgroundKey(season as Season | undefined);
    const prompt = season && SEASONAL_PROMPTS[season as Season] ? SEASONAL_PROMPTS[season as Season] : DEFAULT_PROMPT;

    console.log(`Processing request - Season: ${season}, ForceRegenerate: ${forceRegenerate}, Key: ${BACKGROUND_KEY}`);

    // If force regenerate, delete existing background first
    if (forceRegenerate) {
      console.log("Force regenerate requested, deleting existing background...");
      await supabase.storage
        .from("backgrounds")
        .remove([BACKGROUND_KEY]);
    }

    // Check if background already exists (unless force regenerating)
    if (!forceRegenerate) {
      const { data: existingFile } = await supabase.storage
        .from("backgrounds")
        .list("", { search: BACKGROUND_KEY });

      if (existingFile && existingFile.length > 0) {
        const { data: urlData } = supabase.storage
          .from("backgrounds")
          .getPublicUrl(BACKGROUND_KEY);
        
        console.log("Returning existing background:", urlData.publicUrl);
        return new Response(
          JSON.stringify({ url: urlData.publicUrl, cached: true, season }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Generate new background using Lovable AI
    console.log(`Generating new ${season || 'default'} background image...`);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "API credits depleted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");

    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageData) {
      throw new Error("No image generated from AI");
    }

    // Extract base64 data and convert to binary
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("backgrounds")
      .upload(BACKGROUND_KEY, binaryData, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload background: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("backgrounds")
      .getPublicUrl(BACKGROUND_KEY);

    console.log("Background generated and uploaded:", urlData.publicUrl);

    return new Response(
      JSON.stringify({ url: urlData.publicUrl, cached: false, season }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-auth-background:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
