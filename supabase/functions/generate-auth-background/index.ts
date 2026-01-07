import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BACKGROUND_KEY = "auth-background-v1.png";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Check if background already exists
    const { data: existingFile } = await supabase.storage
      .from("backgrounds")
      .list("", { search: BACKGROUND_KEY });

    if (existingFile && existingFile.length > 0) {
      const { data: urlData } = supabase.storage
        .from("backgrounds")
        .getPublicUrl(BACKGROUND_KEY);
      
      console.log("Returning existing background:", urlData.publicUrl);
      return new Response(
        JSON.stringify({ url: urlData.publicUrl, cached: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate new background using Lovable AI
    console.log("Generating new background image...");
    
    const prompt = `Create a bright, cheerful, kawaii-style cartoon illustration of a cozy cat farm landscape. 
Features: soft pastel colors with lavender and cream sky, gentle rolling green hills, 
a cute red barn with white trim, white picket fences, colorful flowers scattered around,
and 5-7 adorable cartoon cats playing and relaxing around the farm. 
Style: clean vector illustration, minimal detail, soft gradients, 
warm and inviting atmosphere, suitable as a website background.
The scene should feel light, airy, fun, and child-friendly. No text.
Wide panoramic 16:9 aspect ratio view suitable for a desktop background.
Ultra high resolution.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
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
      JSON.stringify({ url: urlData.publicUrl, cached: false }),
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
