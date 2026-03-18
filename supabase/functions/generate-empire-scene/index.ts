import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

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

// Cost in coins for empire render
const EMPIRE_RENDER_COST = 20000;

interface CatAppearance {
  furColor?: string;
  pattern?: string;
  eyeColor?: string;
  hairLength?: string;
  facialFeatures?: string[];
}

interface Cat {
  id: string;
  name: string;
  breed: string;
  personality: string;
  appearance?: CatAppearance;
  portraitUrl?: string;
}

interface RenderRequest {
  houseSize: "apartment" | "house" | "mansion" | "farm";
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  season: "spring" | "summer" | "autumn" | "winter";
  cats: Cat[];
  catCostumes: Record<string, string>;
  gameDay: number;
  customPrompt?: string;
}

// Dwelling tier descriptions for prompt building
const TIER_DESCRIPTIONS: Record<string, string> = {
  apartment: "Warm cozy apartment interior, honey-amber walls, oak hardwood floor, large window showing city skyline, potted monstera plant, knitted blankets on couch, cat tree by window, soft woven rug, bookshelf with trinkets, warm lamp light",
  house: "Bright suburban living room, cream walls, plush carpet, bay window with garden view, stone fireplace with crackling fire, overstuffed sofa, cat tower, potted ferns, sunlight streaming in, family photos on wall",
  mansion: "Grand luxury parlor, pale lavender walls with gold trim, white marble floor, crystal chandelier, marble columns, grand piano, velvet chaise lounge, ornate gold-framed paintings, fresh flower arrangements, tall arched windows",
  farm: "Pastoral countryside scene, rolling emerald hills, bright blue sky with fluffy clouds, red barn in midground, wooden post fences, golden hay bales, old windmill, apple orchard, warm sunlit grass, dirt path",
};

const TIME_LIGHTING: Record<string, string> = {
  morning: "Warm golden morning light from upper left, soft yellow-orange ambient glow, long gentle shadows, fresh dewy atmosphere, light rays through windows",
  afternoon: "Bright natural daylight, clear even lighting, vibrant saturated colors, crisp details, blue sky reflected light",
  evening: "Warm orange-pink sunset lighting, long dramatic shadows, cozy golden hour atmosphere, amber rim lighting on subjects",
  night: "Cool blue-purple moonlight, soft diffused shadows, warm indoor lamp glow, starry sky visible, gentle ambient light",
};

const SEASON_ELEMENTS: Record<string, string> = {
  spring: "Pink cherry blossom petals drifting, tulips in bloom, butterflies, fresh green leaves, soft pastel tones",
  summer: "Bright warm sunshine, sunflowers, lush green foliage, butterflies, vivid saturated colors",
  autumn: "Falling orange and red maple leaves, pumpkins, warm amber and burnt sienna tones, cozy harvest decorations",
  winter: "Gentle snow falling, frost on surfaces, warm cozy indoor lights, evergreen garlands, soft white and blue tones",
};

// Costume render instructions
const COSTUME_DESCRIPTIONS: Record<string, string> = {
  party_hat: "wearing a rainbow striped party hat with pom-pom at jaunty angle",
  top_hat: "wearing a glossy black silk top hat with satin ribbon",
  crown: "wearing a gold royal crown with ruby and sapphire gems",
  wizard_hat: "wearing a purple velvet wizard hat with gold stars and moons",
  sweater: "wearing a cozy cable-knit sweater in autumn colors",
  tuxedo: "wearing an elegant black and white tuxedo with satin bow tie",
  superhero: "wearing a flowing red satin superhero cape with gold clasp",
  pirate: "wearing a pirate costume with black tricorn hat and skull emblem",
  bow_tie: "wearing a colorful polka-dot bow tie at collar",
  sunglasses: "wearing cool aviator sunglasses with reflective lenses",
  necklace: "wearing a classic white pearl necklace",
  scarf: "wearing a luxurious silk scarf wrapped around neck",
  angel_wings: "with ethereal white feathered angel wings glowing softly",
  dragon: "wearing a full green dragon costume with small wings and horns",
  astronaut: "wearing a white astronaut suit with reflective visor helmet",
  unicorn: "with an iridescent rainbow unicorn horn on forehead",
  vip_bronze_collar: "wearing a polished bronze VIP collar with medallion",
  vip_silver_cape: "wearing a silver cape with starlight sparkles",
  vip_gold_crown: "wearing a pure gold crown with diamonds and rubies",
};

// Breed descriptions for AI
const BREED_TRAITS: Record<string, string> = {
  stray: "street-smart alert expression, lean athletic build",
  tabby: "M-marking on forehead, medium well-proportioned body",
  persian: "flat round face with smushed nose, stocky cobby body, short legs",
  siamese: "wedge-shaped face with large pointed ears, slender elegant limbs",
  "maine-coon": "square muzzle with tufted ears, very large gentle giant body",
  "british-shorthair": "round chubby cheeks, stocky compact body with chunky paws",
  ragdoll: "sweet face with vivid blue eyes, large floppy relaxed body",
  bengal: "wild exotic look with strong chin, muscular athletic build",
};

// Fur color hex values for prompt
const FUR_COLORS: Record<string, string> = {
  orange: "warm marmalade orange with golden undertones",
  black: "jet-black with subtle blue sheen",
  white: "snowy white with cream tint",
  gray: "silvery gray with blue undertones",
  brown: "chocolate brown with chestnut highlights",
  cream: "soft creamy beige like vanilla",
  ginger: "bright ginger-red with copper highlights",
  calico: "tri-colored patches of orange, black, and white",
};

// Pattern descriptions
const PATTERN_DESCRIPTIONS: Record<string, string> = {
  solid: "solid single-color coat",
  tabby: "tabby pattern with M-shape forehead and tiger stripes",
  spotted: "leopard-like dark spots scattered across coat",
  tuxedo: "tuxedo pattern with white chest, chin, and paws on dark body",
  bicolor: "two-tone bicolor with clean color separation",
  calico: "calico with random patches of orange, black, and white",
};

function buildCatDescription(cat: Cat, costumeId?: string, index?: number): string {
  const breed = cat.breed;
  const appearance = cat.appearance || {};
  
  const furColor = appearance.furColor ? (FUR_COLORS[appearance.furColor] || appearance.furColor) : "tabby colored";
  const pattern = appearance.pattern ? (PATTERN_DESCRIPTIONS[appearance.pattern] || appearance.pattern) : "";
  const eyeColor = appearance.eyeColor || "bright";
  const hairLength = appearance.hairLength || "medium";
  const breedTraits = BREED_TRAITS[cat.breed] || "";
  
  const costume = costumeId ? COSTUME_DESCRIPTIONS[costumeId] || "" : "";
  
  // Concise comma-separated tag format
  const parts = [
    `Cat ${(index ?? 0) + 1} "${cat.name}"`,
    breed,
    `${hairLength} fur`,
    furColor,
    pattern,
    `${eyeColor} eyes`,
    breedTraits,
    costume,
  ].filter(Boolean);
  
  return parts.join(", ");
}

// Random variation elements to prevent identical outputs
const CAT_ACTIVITIES = [
  "napping curled up", "grooming itself", "stretching lazily", "watching a butterfly",
  "batting at a dangling toy", "kneading a soft blanket", "yawning widely",
  "perched on a windowsill", "chasing its own tail", "sitting regally upright",
  "rolling on its back playfully", "peeking around a corner curiously",
  "snuggling against a pillow", "gazing out the window dreamily",
  "playing with a ball of yarn", "hiding behind furniture with ears visible",
];

const COMPOSITION_VARIANTS = [
  "slightly low-angle camera looking up, giving cats a majestic feel",
  "eye-level composition with cats naturally scattered throughout",
  "gentle bird's-eye tilt showing the full room layout",
  "three-quarter angle revealing depth and cozy corners",
  "centered symmetrical composition with cats framing the scene",
  "dynamic diagonal composition with natural leading lines",
];

const MOOD_ACCENTS = [
  "dust motes floating in light beams",
  "a gentle breeze rippling curtains",
  "a steaming mug of tea on a side table",
  "soft bokeh light circles in the background",
  "a knitted blanket draped casually over furniture",
  "a small potted succulent on the windowsill",
  "an open book with reading glasses nearby",
  "a decorative ceramic bowl with treats",
  "fairy lights twinkling softly",
  "a watercolor painting on the wall",
];

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

function getSceneActivity(catCount: number): string {
  if (catCount === 0) return "The space is empty and inviting, waiting for its first cat resident";

  // Pick random activities for each cat
  const activities = pickRandom(CAT_ACTIVITIES, Math.min(catCount, 6));
  
  if (catCount === 1) return `The cat is ${activities[0]}`;
  if (catCount <= 3) {
    return `The cats are each doing something different: one is ${activities[0]}, another is ${activities[1]}${activities[2] ? `, and one is ${activities[2]}` : ''}`;
  }
  return `Cats are scattered naturally throughout the scene — ${activities.map((a, i) => `one is ${a}`).join(", ")}. The rest are lounging contentedly in various spots`;
}

function buildEmpirePrompt(request: RenderRequest): string {
  const { houseSize, timeOfDay, season, cats, catCostumes, customPrompt } = request;
  
  const catDescriptions = cats.map((cat, index) => {
    const costume = catCostumes[cat.id];
    return buildCatDescription(cat, costume, index);
  }).join("\n");

  const activity = getSceneActivity(cats.length);
  const composition = pickRandom(COMPOSITION_VARIANTS, 1)[0];
  const moodAccents = pickRandom(MOOD_ACCENTS, 3).join(", ");
  const seed = Math.floor(Math.random() * 99999);

  // Use custom prompt as scene override if provided
  const sceneDescription = customPrompt 
    ? `${customPrompt}. Incorporate elements of: ${TIER_DESCRIPTIONS[houseSize]}`
    : TIER_DESCRIPTIONS[houseSize];

  const prompt = `SCENE: ${sceneDescription}

LIGHTING: ${TIME_LIGHTING[timeOfDay]}

SEASON: ${SEASON_ELEMENTS[season]}

MOOD DETAILS: ${moodAccents}

CATS (${cats.length} total):
${catDescriptions || "No cats — show an inviting empty space"}

ACTIVITY: ${activity}

COMPOSITION: Wide 16:9 panoramic view, ${composition}, depth of field with sharp foreground cats and softly blurred background details, warm rim lighting on cat fur edges, cats naturally placed on furniture and floor throughout the scene.

STYLE: Digital illustration, soft watercolor rendering with clean precise outlines, children's picture book aesthetic, Pixar-quality lighting and color grading, rich detailed textures, professional concept art quality, 4K resolution, masterpiece quality, high detail on fur textures with visible individual strands. Variation seed: ${seed}.

AVOID: Squiggly lines, rough sketches, wobbly linework, abstract patterns, text or letters anywhere in the image, deformed cat anatomy, extra limbs, extra tails, blurry faces, watermarks, signatures, borders, vignettes, cats in the background that were not specified, random floating objects.`;

  return prompt;
}

import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Validate env at startup
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !LOVABLE_API_KEY) {
  throw new Error("Missing required env vars: SUPABASE_URL, SUPABASE_ANON_KEY, LOVABLE_API_KEY");
}

const FETCH_TIMEOUT_MS = 60_000;

const RenderRequestSchema = z.object({
  houseSize: z.enum(["apartment", "house", "mansion", "farm"]),
  timeOfDay: z.enum(["morning", "afternoon", "evening", "night"]),
  season: z.enum(["spring", "summer", "autumn", "winter"]),
  cats: z.array(z.object({
    id: z.string(),
    name: z.string(),
    breed: z.string(),
    personality: z.string(),
    appearance: z.object({
      furColor: z.string().optional(),
      pattern: z.string().optional(),
      eyeColor: z.string().optional(),
      hairLength: z.string().optional(),
      facialFeatures: z.array(z.string()).optional(),
    }).optional(),
    portraitUrl: z.string().optional(),
  })).default([]),
  catCostumes: z.record(z.string()).default({}),
  gameDay: z.number().int().min(1),
  customPrompt: z.string().max(200).optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    // Parse and validate request
    const rawBody = await req.json();
    const parsed = RenderRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { houseSize, timeOfDay, season, cats, catCostumes, gameDay } = parsed.data;
    const request = parsed.data;

    // Build the prompt
    const prompt = buildEmpirePrompt(request);
    console.log("[generate-empire-scene] Built prompt for", houseSize, timeOfDay, season);

    // Call Lovable AI Gateway for image generation
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        modalities: ["image", "text"],
      }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add more credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await aiResponse.text();
      console.error("[generate-empire-scene] AI gateway error:", aiResponse.status, errorText);
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("[generate-empire-scene] No image in response:", JSON.stringify(aiData).slice(0, 500));
      throw new Error("No image generated");
    }

    // Extract base64 data
    const base64Match = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      throw new Error("Invalid image data format");
    }

    const imageFormat = base64Match[1];
    const base64Data = base64Match[2];
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Upload to storage
    const fileName = `${userId}/empire-${Date.now()}.${imageFormat}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("empire-renders")
      .upload(fileName, imageBuffer, {
        contentType: `image/${imageFormat}`,
        upsert: true,
      });

    if (uploadError) {
      console.error("[generate-empire-scene] Upload error:", uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("empire-renders")
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    console.log("[generate-empire-scene] Success! URL:", publicUrl);

    return new Response(
      JSON.stringify({
        success: true,
        empireRenderUrl: publicUrl,
        cost: EMPIRE_RENDER_COST,
        message: `Empire scene rendered successfully!`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[generate-empire-scene] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to generate empire scene",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
