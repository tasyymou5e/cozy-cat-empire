import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

function buildPrompt(cat: CatData): string {
  const { breed, personality, appearance, costume } = cat;
  
  const furColor = appearance?.furColor || 'orange';
  const pattern = appearance?.pattern || 'solid';
  const eyeColor = appearance?.eyeColor || 'green';
  const hairLength = appearance?.hairLength || 'short';
  const facialFeature = appearance?.facialFeature;
  
  // Map personality to expression
  const expressionMap: Record<string, string> = {
    lazy: 'sleepy and content with half-closed eyes',
    playful: 'excited and mischievous with wide bright eyes',
    affectionate: 'warm and loving with soft gentle eyes',
    independent: 'proud and confident with a dignified expression',
    curious: 'alert and inquisitive with wide attentive eyes',
    shy: 'sweet and timid with gentle downcast eyes',
  };
  
  const expression = expressionMap[personality] || 'cute and friendly';
  
  // Build breed name
  const breedNames: Record<string, string> = {
    'stray': 'domestic shorthair',
    'tabby': 'tabby',
    'persian': 'Persian',
    'siamese': 'Siamese',
    'maine-coon': 'Maine Coon',
    'british-shorthair': 'British Shorthair',
    'ragdoll': 'Ragdoll',
    'bengal': 'Bengal',
  };
  
  const breedName = breedNames[breed] || breed;
  
  let prompt = `A cute, adorable portrait of a ${breedName} cat with ${furColor} ${pattern} fur, beautiful ${eyeColor} eyes, and a ${hairLength} coat. The cat has a ${expression}. `;
  
  if (facialFeature) {
    const featureDescriptions: Record<string, string> = {
      scar: 'The cat has a small distinguished scar on its face.',
      eyepatch: 'The cat has a charming dark patch over one eye.',
      grumpy: 'The cat has adorably grumpy facial features.',
      cute_blush: 'The cat has rosy pink cheeks giving it an extra cute appearance.',
    };
    prompt += featureDescriptions[facialFeature] || '';
  }
  
  // Add costume description if equipped
  if (costume) {
    const costumeDescriptions: Record<string, string> = {
      'party_hat': 'wearing a colorful party hat',
      'top_hat': 'wearing an elegant black top hat',
      'crown': 'wearing a golden royal crown',
      'wizard_hat': 'wearing a mystical purple wizard hat with stars',
      'sweater': 'wearing a cozy knitted sweater',
      'tuxedo': 'wearing an elegant black tuxedo',
      'superhero': 'wearing a flowing superhero cape',
      'pirate': 'dressed as a pirate with an eyepatch',
      'bow_tie': 'wearing a cute bow tie',
      'sunglasses': 'wearing cool sunglasses',
      'necklace': 'wearing a pearl necklace',
      'scarf': 'wearing a silk scarf',
      'angel_wings': 'with beautiful white angel wings',
      'dragon': 'in a fierce dragon costume',
      'astronaut': 'in a space suit helmet',
      'unicorn': 'with a magical unicorn horn',
      'vip_bronze_collar': 'wearing a distinguished bronze VIP collar',
      'vip_silver_cape': 'wearing an elegant silver VIP cape',
      'vip_gold_crown': 'wearing a magnificent golden VIP crown',
    };
    prompt += (costumeDescriptions[costume.id] || `wearing ${costume.name}`) + '. ';
  }
  
  prompt += 'Digital illustration style, soft warm studio lighting, detailed fluffy fur texture, cozy warm-toned background, cat facing the camera, ultra cute and expressive, professional pet portrait, high quality, 4K detail.';
  
  return prompt;
}

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
    // Allow request on error to avoid blocking users
    return { allowed: true, remaining: maxRequests, resetAt: new Date(Date.now() + windowMs) };
  }

  const requestCount = count || 0;
  const remaining = Math.max(0, maxRequests - requestCount);
  const allowed = requestCount < maxRequests;
  const resetAt = new Date(Date.now() + windowMs);

  console.log(`Rate limit check for ${userId}: ${requestCount}/${maxRequests} requests in window`);

  return { allowed, remaining, resetAt };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const MODEL = 'google/gemini-2.5-flash-image-preview';
  const FUNCTION_NAME = 'generate-cat-portrait';

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let userId: string | null = null;
  let catMetadata: Record<string, any> = {};

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

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

      // Check for insufficient credits
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

    const { cat } = await req.json() as { cat: CatData };
    
    if (!cat || !cat.id) {
      throw new Error('Cat data is required');
    }

    catMetadata = { cat_id: cat.id, cat_name: cat.name, breed: cat.breed };
    console.log(`Generating portrait for cat: ${cat.name} (${cat.id})`);
    
    const prompt = buildPrompt(cat);
    console.log('Generated prompt:', prompt);

    // Call Lovable AI to generate image
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
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

    // Upload to Supabase Storage
    const fileName = `${cat.id}-${Date.now()}.${imageType}`;
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
    await logAIUsage(supabase, userId, FUNCTION_NAME, MODEL, 'error', Date.now() - startTime, catMetadata, error instanceof Error ? error.message : 'Unknown error');
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
