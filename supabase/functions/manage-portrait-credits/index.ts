import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validate env at startup
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}

const PostBodySchema = z.object({
  action: z.enum(['purchase', 'consume']),
});

interface PortraitCredits {
  id: string;
  user_id: string;
  credits_remaining: number;
  total_purchased: number;
  total_used: number;
  last_purchase_at: string | null;
  created_at: string;
  updated_at: string;
}

interface PortraitPackageConfig {
  cost: number;
  portraits: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

  try {
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;

    // GET: Fetch current credits balance
    if (req.method === 'GET') {
      const { data: credits, error: creditsError } = await supabase
        .from('player_portrait_credits')
        .select('*')
        .eq('user_id', userId)
        .single();

      // If no record exists, return defaults
      if (creditsError && creditsError.code === 'PGRST116') {
        return new Response(
          JSON.stringify({
            creditsRemaining: 0,
            totalPurchased: 0,
            totalUsed: 0,
            lastPurchaseAt: null,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (creditsError) {
        console.error('Error fetching credits:', creditsError);
        throw new Error('Failed to fetch credits');
      }

      return new Response(
        JSON.stringify({
          creditsRemaining: credits.credits_remaining,
          totalPurchased: credits.total_purchased,
          totalUsed: credits.total_used,
          lastPurchaseAt: credits.last_purchase_at,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST: Handle purchase or consume actions
    if (req.method === 'POST') {
      const { action } = await req.json();

      if (action === 'purchase') {
        // Fetch portrait package config
        const { data: configData, error: configError } = await supabase
          .from('game_config')
          .select('value')
          .eq('key', 'portrait_package')
          .single();

        if (configError) {
          console.error('Error fetching config:', configError);
          throw new Error('Failed to fetch portrait package configuration');
        }

        const packageConfig = configData.value as PortraitPackageConfig;
        const cost = packageConfig.cost;
        const portraitsToAdd = packageConfig.portraits;

        // Fetch user's current game state to check money
        const { data: gameData, error: gameError } = await supabase
          .from('game_saves')
          .select('game_state')
          .eq('user_id', userId)
          .single();

        if (gameError) {
          console.error('Error fetching game state:', gameError);
          return new Response(
            JSON.stringify({ error: 'No game save found. Please save your game first.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const gameState = gameData.game_state as { money: number; [key: string]: unknown };
        const currentMoney = gameState.money || 0;

        if (currentMoney < cost) {
          return new Response(
            JSON.stringify({ 
              error: 'Insufficient funds',
              required: cost,
              current: currentMoney,
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Deduct money from game state
        const newMoney = currentMoney - cost;
        const updatedGameState = { ...gameState, money: newMoney };

        const { error: updateGameError } = await supabase
          .from('game_saves')
          .update({ 
            game_state: updatedGameState,
            last_played_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (updateGameError) {
          console.error('Error updating game state:', updateGameError);
          throw new Error('Failed to deduct money from game');
        }

        // Update or create portrait credits
        const { data: existingCredits } = await supabase
          .from('player_portrait_credits')
          .select('*')
          .eq('user_id', userId)
          .single();

        let updatedCredits: PortraitCredits;

        if (existingCredits) {
          // Update existing credits
          const { data: updated, error: updateError } = await supabase
            .from('player_portrait_credits')
            .update({
              credits_remaining: existingCredits.credits_remaining + portraitsToAdd,
              total_purchased: existingCredits.total_purchased + portraitsToAdd,
              last_purchase_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .select()
            .single();

          if (updateError) {
            // Rollback money deduction on error
            await supabase
              .from('game_saves')
              .update({ game_state: gameState })
              .eq('user_id', userId);
            throw new Error('Failed to update credits');
          }
          updatedCredits = updated;
        } else {
          // Create new credits record
          const { data: created, error: createError } = await supabase
            .from('player_portrait_credits')
            .insert({
              user_id: userId,
              credits_remaining: portraitsToAdd,
              total_purchased: portraitsToAdd,
              total_used: 0,
              last_purchase_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (createError) {
            // Rollback money deduction on error
            await supabase
              .from('game_saves')
              .update({ game_state: gameState })
              .eq('user_id', userId);
            throw new Error('Failed to create credits');
          }
          updatedCredits = created;
        }

        // Log the purchase in player activity log
        await supabase.from('player_activity_log').insert({
          user_id: userId,
          activity_type: 'portrait_credits_purchase',
          activity_description: `Purchased ${portraitsToAdd} portrait credits for ${cost} coins`,
          metadata: {
            cost,
            portraits_added: portraitsToAdd,
            new_balance: updatedCredits.credits_remaining,
          },
        });

        console.log(`User ${userId} purchased ${portraitsToAdd} portrait credits for ${cost} coins`);

        return new Response(
          JSON.stringify({
            success: true,
            creditsRemaining: updatedCredits.credits_remaining,
            totalPurchased: updatedCredits.total_purchased,
            totalUsed: updatedCredits.total_used,
            cost,
            newMoneyBalance: newMoney,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'consume') {
        // Consume 1 credit
        const { data: credits, error: creditsError } = await supabase
          .from('player_portrait_credits')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (creditsError || !credits || credits.credits_remaining < 1) {
          return new Response(
            JSON.stringify({ 
              error: 'insufficient_credits',
              message: 'You need portrait credits to generate. Purchase a portrait package first.',
              creditsRemaining: credits?.credits_remaining || 0,
            }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: updated, error: updateError } = await supabase
          .from('player_portrait_credits')
          .update({
            credits_remaining: credits.credits_remaining - 1,
            total_used: credits.total_used + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .select()
          .single();

        if (updateError) {
          throw new Error('Failed to consume credit');
        }

        console.log(`User ${userId} consumed 1 portrait credit. Remaining: ${updated.credits_remaining}`);

        return new Response(
          JSON.stringify({
            success: true,
            creditsRemaining: updated.credits_remaining,
            totalUsed: updated.total_used,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "purchase" or "consume".' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in manage-portrait-credits:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
