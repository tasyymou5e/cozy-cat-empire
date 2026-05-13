import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

let _portraitCorsHeaders: Record<string, string>;

// Rate limit: 10 portraits per user per hour
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 10;

interface CatData {
  id: string;
  name: string;
  breed: string;
  personality: string;
  appearance?: {
    furColor?: string;
    pattern?: string;
    patternColor?: string;
    eyeColor?: string;
    hairLength?: string;
    facialFeature?: string;
  };
  costume?: {
    id: string;
    name: string;
    emoji: string;
    category: string;
  };
}

// ============================================================================
// STYLE PROMPTS - Consistent art styles
// ============================================================================

const KAWAII_STYLE_PROMPT = `
Style: Cute kawaii cartoon cat portrait in the style of Studio Ghibli meets modern mobile game art.
- Soft rounded features with large expressive eyes
- Sparkle reflections in the eyes (2-3 small white highlights)
- Small pink nose with subtle shine
- Subtle pink blush marks on cheeks
- Clean cel-shaded look with soft gradients
- Warm cozy lighting from upper left
- Simple soft gradient background (warm cream/pink tones), not distracting
- Head and upper body portrait composition
- Cat facing slightly toward camera (3/4 view)
- Professional digital art quality, ultra-cute expression
- High detail on fur texture with visible individual strands
- 4K resolution, masterpiece quality
`;

const REALISTIC_STYLE_PROMPT = `
Style: Photorealistic digital painting, semi-realistic cat portrait.
- Natural proportions with lifelike features
- Detailed fur rendering with individual strand visibility
- Realistic eye reflections with natural highlights
- Subtle natural blush, no exaggerated kawaii features
- Soft studio lighting with shallow depth of field
- Professional pet photography composition
- Warm neutral background with soft bokeh effect
- Head and upper body portrait, 3/4 view angle
- Natural expressive face, no cartoon exaggeration
- Hyper-detailed fur texture with realistic shading
- 4K resolution, masterpiece quality, photorealistic
`;

type PortraitStyleType = 'realistic' | 'kawaii';

function getStylePrompt(style: PortraitStyleType): string {
  return style === 'realistic' ? REALISTIC_STYLE_PROMPT : KAWAII_STYLE_PROMPT;
}

// ============================================================================
// FUR COLOR DESCRIPTIONS
// ============================================================================

const FUR_DESCRIPTIONS: Record<string, string> = {
  orange: 'warm orange marmalade-colored fur with golden undertones',
  black: 'sleek jet-black fur with a subtle blue sheen in the light',
  white: 'pure snowy white fur with a slight cream tint',
  gray: 'beautiful silvery gray fur with blue undertones',
  brown: 'rich chocolate brown fur with warm chestnut highlights',
  cream: 'soft creamy beige fur like vanilla ice cream',
  ginger: 'bright ginger-red fur with warm copper highlights',
  calico: 'tri-colored calico fur with patches of orange, black, and white',
};

// ============================================================================
// PATTERN DESCRIPTIONS
// ============================================================================

const PATTERN_DESCRIPTIONS: Record<string, string> = {
  solid: 'solid single-color coat without markings',
  tabby: 'classic tabby pattern with distinctive M-shape on forehead and tiger stripes on body',
  spotted: 'beautiful spotted pattern like a mini leopard with distinct dark spots',
  tuxedo: 'elegant tuxedo pattern with white chest, chin, and paws on dark body',
  bicolor: 'charming two-tone bi-color pattern with clean color separation',
  calico: 'random calico patches of orange, black, and white in artistic arrangement',
};

// ============================================================================
// EYE COLOR DESCRIPTIONS
// ============================================================================

const EYE_DESCRIPTIONS: Record<string, string> = {
  green: 'stunning emerald green eyes that sparkle like jewels',
  blue: 'beautiful sapphire blue eyes as deep as the ocean',
  amber: 'warm amber eyes like golden honey in sunlight',
  gold: 'brilliant golden eyes that gleam like treasure',
  heterochromia: 'mesmerizing heterochromia with one blue eye and one green eye',
  copper: 'rich copper-colored eyes with warm bronze tones',
};

// ============================================================================
// BREED CHARACTERISTICS
// ============================================================================

const BREED_CHARACTERISTICS: Record<string, { face: string; expression: string; fur: string; body: string }> = {
  stray: {
    face: 'natural domestic cat face with alert, street-smart features',
    expression: 'confident and resourceful expression with bright curious eyes',
    fur: 'practical medium-length coat, slightly rugged',
    body: 'lean athletic build of a survivor',
  },
  tabby: {
    face: 'classic tabby face with distinctive M-marking on forehead',
    expression: 'friendly and approachable with warm knowing eyes',
    fur: 'beautiful striped coat with rich pattern detail',
    body: 'well-proportioned medium build',
  },
  persian: {
    face: 'adorable flat-faced Persian with round head, tiny ears, and smushed nose',
    expression: 'regal and slightly haughty expression befitting royalty',
    fur: 'extremely luxurious long-haired coat, incredibly fluffy and soft',
    body: 'stocky cobby body with short legs',
  },
  siamese: {
    face: 'elegant wedge-shaped face with large pointed ears and striking blue eyes',
    expression: 'intelligent and curious expression, almost mysterious',
    fur: 'sleek short coat with distinctive darker points on ears, face, paws, and tail',
    body: 'slender elegant body with long graceful limbs',
  },
  'maine-coon': {
    face: 'majestic large square muzzle with magnificent tufted ears (lynx tips)',
    expression: 'gentle giant expression - friendly, wise, and kind',
    fur: 'spectacular shaggy long fur with distinctive mane around neck like a lion',
    body: 'very large muscular body, the gentle giant of cats',
  },
  'british-shorthair': {
    face: 'round chubby face with adorable chubby cheeks and round copper eyes',
    expression: 'calm, dignified, and slightly reserved British expression',
    fur: 'dense plush short coat that looks incredibly soft and huggable',
    body: 'stocky compact build with chunky paws',
  },
  ragdoll: {
    face: 'sweet face with vivid blue eyes and gentle expression',
    expression: 'docile, relaxed, and absolutely loving expression',
    fur: 'silky semi-long coat with color-point pattern',
    body: 'large floppy body that goes limp when held',
  },
  bengal: {
    face: 'wild exotic face with strong chin and intense eyes',
    expression: 'athletic and mischievous expression, ready for adventure',
    fur: 'stunning leopard-like spotted or marbled coat with glitter effect',
    body: 'muscular athletic build like a mini wild cat',
  },
};

// ============================================================================
// PERSONALITY TO EXPRESSION
// ============================================================================

const PERSONALITY_EXPRESSIONS: Record<string, string> = {
  lazy: 'blissfully sleepy and content expression with half-closed dreamy eyes and peaceful smile',
  playful: 'excited mischievous expression with wide bright sparkling eyes and eager smile',
  affectionate: 'warm loving expression with soft gentle eyes full of adoration',
  independent: 'proud confident expression with dignified slightly aloof gaze',
  curious: 'alert inquisitive expression with wide attentive eyes and perked ears',
  shy: 'sweet timid expression with gentle downcast eyes and subtle blush',
};

// ============================================================================
// FACIAL FEATURE DESCRIPTIONS
// ============================================================================

const FACIAL_FEATURE_DESCRIPTIONS: Record<string, string> = {
  normal: '',
  scar: 'A distinguished small scar on the cheek adds character - battle-worn but still adorable.',
  eyepatch: 'A charming dark patch naturally covers one eye, giving a pirate-like roguish charm.',
  whiskers_long: 'Extra long magnificent whiskers that curve dramatically.',
  grumpy: 'Adorably grumpy expression with furrowed brow - the famous "grumpy cat" look but cute.',
  cute_blush: 'Extra rosy pink blush marks on both cheeks for maximum kawaii cuteness.',
};

// ============================================================================
// COSTUME RENDER INSTRUCTIONS - Detailed placement and style
// ============================================================================

const COSTUME_RENDER_INSTRUCTIONS: Record<string, { description: string; placement: string; style: string }> = {
  party_hat: {
    description: 'wearing a colorful striped party cone hat',
    placement: 'The hat sits at a jaunty angle on top of the head between the ears',
    style: 'bright rainbow stripes with a fluffy pom-pom on top and elastic chin strap',
  },
  top_hat: {
    description: 'wearing an elegant black top hat',
    placement: 'The top hat sits perfectly balanced on the head',
    style: 'glossy black silk with a sophisticated ribbon band',
  },
  crown: {
    description: 'wearing an ornate golden royal crown',
    placement: 'The crown sits majestically on the head between the ears',
    style: 'shiny metallic gold with red velvet lining and sparkling ruby and sapphire gems',
  },
  wizard_hat: {
    description: 'wearing a tall mystical purple wizard hat',
    placement: 'The wizard hat sits at a slight jaunty angle',
    style: 'deep purple velvet fabric decorated with golden stars and crescent moons, magical sparkles emanating',
  },
  sweater: {
    description: 'wearing a cozy knitted sweater',
    placement: 'The sweater fits snugly around the body and neck',
    style: 'soft cable-knit pattern in warm autumn colors with a cute pattern',
  },
  tuxedo: {
    description: 'wearing an elegant black tuxedo with bow tie',
    placement: 'The tuxedo jacket is properly fitted with lapels visible',
    style: 'classic black and white formal wear with a satin bow tie',
  },
  superhero: {
    description: 'wearing a flowing superhero cape',
    placement: 'The cape fastens at the neck and flows behind dramatically',
    style: 'vibrant red satin cape with a golden emblem clasp',
  },
  pirate: {
    description: 'dressed as a pirate captain',
    placement: 'Wearing a tricorn pirate hat',
    style: 'black tricorn hat with skull and crossbones, rugged pirate aesthetic',
  },
  bow_tie: {
    description: 'wearing an adorable bow tie',
    placement: 'The bow tie sits neatly at the collar area',
    style: 'cute polka-dot or striped pattern in bright cheerful colors',
  },
  sunglasses: {
    description: 'wearing cool stylish sunglasses',
    placement: 'The sunglasses rest perfectly on the nose bridge',
    style: 'trendy aviator or cat-eye style with reflective lenses',
  },
  necklace: {
    description: 'wearing an elegant pearl necklace',
    placement: 'The necklace drapes gracefully around the neck',
    style: 'classic white pearls with a subtle sheen',
  },
  scarf: {
    description: 'wearing a flowing silk scarf',
    placement: 'The scarf is wrapped elegantly around the neck',
    style: 'luxurious silk with artistic pattern, ends flowing gracefully',
  },
  angel_wings: {
    description: 'with beautiful white angel wings',
    placement: 'The wings extend from behind the shoulders',
    style: 'soft fluffy white feathered wings with a golden glow, ethereal and heavenly',
  },
  dragon: {
    description: 'in an adorable dragon costume',
    placement: 'Full body dragon onesie with hood',
    style: 'cute green dragon with small wings, horns on hood, and a tail',
  },
  astronaut: {
    description: 'in a space astronaut suit',
    placement: 'Wearing a round astronaut helmet',
    style: 'white space suit with NASA-style patches, reflective helmet visor',
  },
  unicorn: {
    description: 'with a magical unicorn horn',
    placement: 'A spiraling horn on the forehead between the ears',
    style: 'iridescent pastel rainbow colored spiral horn with magical sparkles',
  },
  vip_bronze_collar: {
    description: 'wearing a distinguished bronze VIP collar',
    placement: 'An ornate collar around the neck',
    style: 'polished bronze metal collar with VIP medallion and subtle shimmer',
  },
  vip_silver_cape: {
    description: 'wearing an elegant silver VIP cape',
    placement: 'A flowing cape fastened at the shoulders',
    style: 'shimmering silver fabric with starlight sparkles and VIP embroidery',
  },
  vip_gold_crown: {
    description: 'wearing a magnificent golden VIP crown',
    placement: 'A grand crown sitting regally on the head',
    style: 'pure gold crown with diamonds and rubies, radiating golden light, ultimate royalty',
  },
};

// ============================================================================
// HAIR LENGTH DESCRIPTIONS
// ============================================================================

const HAIR_LENGTH_DESCRIPTIONS: Record<string, string> = {
  short: 'sleek short-haired coat that lies flat and smooth',
  medium: 'fluffy medium-length coat with soft volume',
  fluffy: 'magnificently fluffy long-haired coat that looks incredibly soft and huggable',
};

// ============================================================================
// PROMPT BUILDER
// ============================================================================

function buildPrompt(cat: CatData, style: PortraitStyleType = 'kawaii'): string {
  const { breed, personality, appearance, costume } = cat;
  
  // Get appearance details with fallbacks
  const furColor = appearance?.furColor || 'orange';
  const pattern = appearance?.pattern || 'solid';
  const eyeColor = appearance?.eyeColor || 'green';
  const hairLength = appearance?.hairLength || 'medium';
  const facialFeature = appearance?.facialFeature || 'normal';
  
  // Build breed-specific prompt
  const breedInfo = BREED_CHARACTERISTICS[breed] || BREED_CHARACTERISTICS.tabby;
  
  // Build the prompt parts
  const parts: string[] = [];
  
  // 1. Style foundation
  parts.push(getStylePrompt(style));
  
  // 2. Breed description
  parts.push(`
BREED: A beautiful ${breed.replace('-', ' ')} cat.
- Face: ${breedInfo.face}
- Body: ${breedInfo.body}
`);
  
  // 3. Appearance details
  const furDesc = FUR_DESCRIPTIONS[furColor] || `${furColor} fur`;
  const patternDesc = PATTERN_DESCRIPTIONS[pattern] || pattern;
  const eyeDesc = EYE_DESCRIPTIONS[eyeColor] || `${eyeColor} eyes`;
  const hairDesc = HAIR_LENGTH_DESCRIPTIONS[hairLength] || 'medium-length coat';
  
  parts.push(`
APPEARANCE:
- Fur: ${furDesc} with ${patternDesc}
- Coat: ${hairDesc}
- Eyes: ${eyeDesc}
`);
  
  // 4. Personality expression
  const expression = PERSONALITY_EXPRESSIONS[personality] || 'friendly and cute expression';
  parts.push(`
EXPRESSION: The cat has a ${expression}.
`);
  
  // 5. Facial feature if special
  if (facialFeature && facialFeature !== 'normal') {
    const featureDesc = FACIAL_FEATURE_DESCRIPTIONS[facialFeature];
    if (featureDesc) {
      parts.push(`SPECIAL FEATURE: ${featureDesc}`);
    }
  }
  
  // 6. Costume (IMPORTANT - most prominent)
  if (costume) {
    const costumeInfo = COSTUME_RENDER_INSTRUCTIONS[costume.id] || {
      description: `wearing ${costume.name}`,
      placement: 'worn appropriately',
      style: 'cute and charming',
    };
    
    parts.push(`
COSTUME (VERY IMPORTANT - MUST BE CLEARLY VISIBLE):
The cat is ${costumeInfo.description}.
Placement: ${costumeInfo.placement}.
Style: ${costumeInfo.style}.
The costume must be the focal point after the cat's face, rendered in full detail.
`);
  }
  
  // 7. Quality requirements
  parts.push(`
QUALITY REQUIREMENTS:
- Ultra high resolution 4K detail
- Professional digital art quality
- Soft warm studio lighting
- Every fur strand visible
- Eyes with multiple sparkle reflections
- Absolutely adorable and charming
`);
  
  return parts.join('\n');
}

// ============================================================================
// AI USAGE LOGGING
// ============================================================================

async function logAIUsage(
  supabase: any,
  userId: string | null,
  functionName: string,
  model: string,
  status: 'success' | 'error' | 'rate_limited' | 'credits_depleted',
  executionTimeMs: number,
  metadata: Record<string, any> = {},
  errorMessage?: string
) {
  try {
    await supabase.from('ai_usage_log').insert({
      user_id: userId,
      function_name: functionName,
      model: model,
      status: status,
      execution_time_ms: executionTimeMs,
      error_message: errorMessage,
      metadata: metadata,
    });
  } catch (logError) {
    console.error('Failed to log AI usage:', logError);
  }
}

// ============================================================================
// RATE LIMITING
// ============================================================================

async function checkRateLimit(
  supabase: any,
  userId: string,
  functionName: string,
  windowMs: number,
  maxRequests: number
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const windowStart = new Date(Date.now() - windowMs);
  
  const { count, error } = await supabase
    .from('ai_usage_log')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('function_name', functionName)
    .eq('status', 'success')
    .gte('created_at', windowStart.toISOString());

  if (error) {
    console.error('Rate limit check error:', error);
    return { allowed: true, remaining: maxRequests, resetAt: new Date(Date.now() + windowMs) };
  }

  const requestCount = count || 0;
  const remaining = Math.max(0, maxRequests - requestCount);
  const allowed = requestCount < maxRequests;
  const resetAt = new Date(Date.now() + windowMs);

  console.log(`Rate limit check for ${userId}: ${requestCount}/${maxRequests} requests in window`);

  return { allowed, remaining, resetAt };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

// Validate env at startup
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const LOVABLE_API_KEY_ENV = Deno.env.get('LOVABLE_API_KEY');
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !LOVABLE_API_KEY_ENV) {
  throw new Error('Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, LOVABLE_API_KEY');
}

const FETCH_TIMEOUT_MS = 60_000;

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  _portraitCorsHeaders = corsHeaders;
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const FUNCTION_NAME = 'generate-cat-portrait';

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

  let userId: string | null = null;
  let catMetadata: Record<string, unknown> = {};

  try {
    // Parse request body first to get quality preference
    const requestBody = await req.json() as { cat: CatData; highQuality?: boolean; style?: PortraitStyleType };
    const { cat, highQuality = false, style = 'kawaii' } = requestBody;
    
    // Select model based on quality preference
    const MODEL = highQuality 
      ? 'google/gemini-3-pro-image-preview' 
      : 'google/gemini-3.1-flash-image-preview';

    // Try to get user ID from auth header
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Check rate limit for authenticated users
    if (userId) {
      const rateLimit = await checkRateLimit(
        supabase,
        userId,
        FUNCTION_NAME,
        RATE_LIMIT_WINDOW_MS,
        RATE_LIMIT_MAX_REQUESTS
      );

      if (!rateLimit.allowed) {
        console.log(`Rate limit exceeded for user ${userId}`);
        await logAIUsage(supabase, userId, FUNCTION_NAME, MODEL, 'rate_limited', Date.now() - startTime, catMetadata, 'Rate limit exceeded');
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded. Please try again later.',
            remaining: rateLimit.remaining,
            resetAt: rateLimit.resetAt.toISOString()
          }),
          { 
            status: 429, 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'X-RateLimit-Remaining': rateLimit.remaining.toString(),
              'X-RateLimit-Reset': rateLimit.resetAt.toISOString()
            } 
          }
        );
      }
    }

    // Check if user has portrait credits before generating
    if (userId) {
      const { data: credits, error: creditsError } = await supabase
        .from('player_portrait_credits')
        .select('credits_remaining, total_used')
        .eq('user_id', userId)
        .single();

      if (creditsError && creditsError.code !== 'PGRST116') {
        console.error('Error checking credits:', creditsError);
      }

      const creditsRemaining = credits?.credits_remaining || 0;

      if (creditsRemaining < 1) {
        console.log(`User ${userId} has insufficient portrait credits: ${creditsRemaining}`);
        await logAIUsage(supabase, userId, FUNCTION_NAME, MODEL, 'error', Date.now() - startTime, catMetadata, 'Insufficient portrait credits');
        return new Response(
          JSON.stringify({ 
            error: 'insufficient_credits',
            message: 'You need portrait credits to generate. Purchase a portrait package first.',
            creditsRemaining: creditsRemaining,
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`User ${userId} has ${creditsRemaining} portrait credits remaining`);
    }
    
    if (!cat || !cat.id) {
      throw new Error('Cat data is required');
    }

    catMetadata = { 
      cat_id: cat.id, 
      cat_name: cat.name, 
      breed: cat.breed,
      personality: cat.personality,
      has_costume: !!cat.costume,
      costume_id: cat.costume?.id,
      high_quality: highQuality,
      portrait_style: style,
    };
    console.log(`Generating ${highQuality ? 'HIGH QUALITY' : 'standard'} ${style} portrait for cat: ${cat.name} (${cat.id})`);
    
    const prompt = buildPrompt(cat, style);
    console.log('Generated prompt:', prompt.substring(0, 500) + '...');

    // Call Lovable AI to generate image
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY_ENV}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        modalities: ['image', 'text'],
      }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    const executionTime = Date.now() - startTime;

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        await logAIUsage(supabase, userId, FUNCTION_NAME, MODEL, 'rate_limited', executionTime, catMetadata, 'Rate limit exceeded');
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        await logAIUsage(supabase, userId, FUNCTION_NAME, MODEL, 'credits_depleted', executionTime, catMetadata, 'AI credits depleted');
        return new Response(JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      await logAIUsage(supabase, userId, FUNCTION_NAME, MODEL, 'error', executionTime, catMetadata, `AI API error: ${aiResponse.status}`);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');
    
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageData) {
      console.error('No image in AI response:', JSON.stringify(aiData));
      await logAIUsage(supabase, userId, FUNCTION_NAME, MODEL, 'error', executionTime, catMetadata, 'No image generated by AI');
      throw new Error('No image generated by AI');
    }

    // Extract base64 data
    const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      throw new Error('Invalid image data format');
    }
    
    const imageType = base64Match[1];
    const base64Data = base64Match[2];
    
    // Convert base64 to Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload to Supabase Storage under the requesting user's folder so storage RLS
    // (user-folder isolation policies) can enforce per-user access.
    const folder = userId ?? 'system';
    const fileName = `${folder}/${cat.id}-${Date.now()}.${imageType}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('cat-portraits')
      .upload(fileName, bytes, {
        contentType: `image/${imageType}`,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      await logAIUsage(supabase, userId, FUNCTION_NAME, MODEL, 'error', Date.now() - startTime, catMetadata, `Upload failed: ${uploadError.message}`);
      throw new Error(`Failed to upload portrait: ${uploadError.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('cat-portraits')
      .getPublicUrl(fileName);

    const portraitUrl = publicUrlData.publicUrl;
    console.log('Portrait uploaded successfully:', portraitUrl);

    // Consume 1 portrait credit after successful generation
    if (userId) {
      const { data: credits } = await supabase
        .from('player_portrait_credits')
        .select('credits_remaining, total_used')
        .eq('user_id', userId)
        .single();

      if (credits && credits.credits_remaining > 0) {
        const { error: consumeError } = await supabase
          .from('player_portrait_credits')
          .update({
            credits_remaining: credits.credits_remaining - 1,
            total_used: credits.total_used + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (consumeError) {
          console.error('Failed to consume portrait credit:', consumeError);
        } else {
          console.log(`Consumed 1 portrait credit for user ${userId}. Remaining: ${credits.credits_remaining - 1}`);
        }
      }
    }

    // Create a recovery snapshot after successful portrait generation
    try {
      await supabase.from('save_snapshots').insert({
        user_id: userId,
        snapshot_type: 'portrait_generated',
        cat_count: -1, // Unknown at edge function level - game will update on next save
        cat_names: [cat.name],
        day: -1, // Unknown at edge function level
        money: -1, // Unknown at edge function level
        game_state_hash: `portrait_${cat.id}_${Date.now()}`,
      });
      console.log(`Created recovery snapshot for portrait generation: ${cat.name}`);
    } catch (snapshotError) {
      console.error('Failed to create recovery snapshot:', snapshotError);
      // Non-critical - continue even if snapshot fails
    }

    // Log successful generation
    await logAIUsage(supabase, userId, FUNCTION_NAME, MODEL, 'success', Date.now() - startTime, { ...catMetadata, portrait_url: portraitUrl });

    return new Response(JSON.stringify({ 
      portraitUrl,
      catId: cat.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating cat portrait:', error);
    const MODEL = 'google/gemini-3.1-flash-image-preview';
    await logAIUsage(supabase, userId, FUNCTION_NAME, MODEL, 'error', Date.now() - startTime, catMetadata, error instanceof Error ? error.message : 'Unknown error');
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
