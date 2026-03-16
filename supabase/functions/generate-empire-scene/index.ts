import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
}

// Dwelling tier descriptions for prompt building
const TIER_DESCRIPTIONS: Record<string, string> = {
  apartment: `Cozy urban apartment interior with warm amber walls, wood laminate flooring, 
    city skyline visible through a large window, potted plants, cat tree, cozy cat bed, 
    bookshelf, floor cushions, and a radiator for warmth.`,
  house: `Suburban living room with cream-colored walls, soft carpet, bay window with garden view,
    warm fireplace, comfortable couch, cat tower, ottoman, cozy rug, and garden door.`,
  mansion: `Grand luxury parlor with lavender walls, marble flooring, crystal chandelier overhead,
    marble columns, grand piano, velvet chaise lounge, ornate fountain, cat throne,
    and fine art on the walls.`,
  farm: `Outdoor pastoral farmland scene with rolling green hills, bright sky, red barn in background,
    wooden fences, hay bales scattered around, windmill on the horizon, apple trees,
    tractor, and sunny spots on the grass.`,
};

// Time of day lighting descriptions
const TIME_LIGHTING: Record<string, string> = {
  morning: "Warm golden morning light from upper left, soft yellow-orange ambient glow, long shadows, fresh dewy atmosphere",
  afternoon: "Bright natural daylight, clear and even lighting, minimal shadows, vibrant colors",
  evening: "Warm orange-pink sunset lighting, dramatic shadows, cozy golden hour atmosphere",
  night: "Cool blue-purple night lighting, soft moonlight, warm glow from indoor lights, starry atmosphere",
};

// Season descriptions
const SEASON_ELEMENTS: Record<string, string> = {
  spring: "Cherry blossoms falling, tulips blooming, baby chicks, butterflies, fresh green growth",
  summer: "Bright sunshine, sunflowers, butterflies, bees buzzing, lush green foliage",
  autumn: "Falling orange and red leaves, pumpkins, harvest decorations, warm amber tones",
  winter: "Light snow falling, snowman, holiday decorations, cozy warm lights, frost on surfaces",
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

function buildCatDescription(cat: Cat, costumeId?: string): string {
  const breed = BREED_TRAITS[cat.breed] || "cute cat";
  const appearance = cat.appearance || {};
  
  const furColor = appearance.furColor ? FUR_COLORS[appearance.furColor] || appearance.furColor : "tabby colored";
  const pattern = appearance.pattern ? PATTERN_DESCRIPTIONS[appearance.pattern] || appearance.pattern : "";
  const eyeColor = appearance.eyeColor || "bright";
  const hairLength = appearance.hairLength || "medium";
  
  const costume = costumeId ? COSTUME_DESCRIPTIONS[costumeId] || "" : "";
  
  return `"${cat.name}" - a ${hairLength}-haired ${furColor} ${pattern} ${cat.breed} cat with ${eyeColor} eyes, ${breed}${costume ? ", " + costume : ""}`;
}

function buildEmpirePrompt(request: RenderRequest): string {
  const { houseSize, timeOfDay, season, cats, catCostumes } = request;
  
  // Build cat descriptions
  const catDescriptions = cats.map((cat, index) => {
    const costume = catCostumes[cat.id];
    const desc = buildCatDescription(cat, costume);
    const position = `Position ${index + 1}`;
    return `${index + 1}. ${desc}\n   ${position}: naturally placed in the scene`;
  }).join("\n");

  const prompt = `Create a beautiful ${timeOfDay.toUpperCase()} scene in ${season.toUpperCase()} at a cat empire.

SCENE DESCRIPTION:
${TIER_DESCRIPTIONS[houseSize]}

LIGHTING:
${TIME_LIGHTING[timeOfDay]}

SEASONAL ELEMENTS:
${SEASON_ELEMENTS[season]}

CATS IN SCENE (${cats.length} total):
${catDescriptions || "No cats yet - show an inviting empty space"}

STYLE REQUIREMENTS:
- Cute kawaii cartoon scene in the style of Studio Ghibli meets modern mobile game art
- Warm cozy lighting with soft cel-shaded look and gradients
- Large expressive eyes on all cats with sparkle reflections
- Pink noses with subtle shine, blush marks on cheeks
- Professional quality, ultra-cute aesthetic throughout
- Panoramic wide 16:9 aspect ratio composition
- All cats naturally integrated into the scene, interacting with furniture
- 4K resolution, masterpiece quality
- High detail on fur textures with visible individual strands
- Magical whimsical atmosphere with the seasonal elements`;

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

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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

    // Parse request
    const request: RenderRequest = await req.json();
    const { houseSize, timeOfDay, season, cats, catCostumes, gameDay } = request;

    // Validate request
    if (!houseSize || !timeOfDay || !season) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build the prompt
    const prompt = buildEmpirePrompt(request);
    console.log("[generate-empire-scene] Built prompt for", houseSize, timeOfDay, season);

    // Call Lovable AI Gateway for image generation
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
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
