import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-function-secret',
};

const REWARD_STRUCTURE = {
  daily: { 1: { coins: 100, badge: '👑' }, 2: { coins: 50, badge: '🥈' }, 3: { coins: 25, badge: '🥉' } },
  weekly: { 1: { coins: 500, badge: '👑' }, 2: { coins: 250, badge: '🥈' }, 3: { coins: 100, badge: '🥉' } },
  monthly: { 1: { coins: 2000, badge: '👑' }, 2: { coins: 1000, badge: '🥈' }, 3: { coins: 500, badge: '🥉' } },
};

const CATEGORIES = ['wins', 'cats', 'breeding', 'wealth', 'achievements'];
const CATEGORY_COLUMNS: Record<string, string> = {
  wins: 'total_show_wins',
  cats: 'total_cats_owned',
  breeding: 'total_kittens_bred',
  wealth: 'total_money_earned',
  achievements: 'achievements_unlocked',
};

interface PeriodInfo {
  type: 'daily' | 'weekly' | 'monthly';
  end: Date;
}

function getEndedPeriods(): PeriodInfo[] {
  const now = new Date();
  const periods: PeriodInfo[] = [];

  // Daily: end of previous day (midnight UTC)
  const yesterday = new Date(now);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  yesterday.setUTCHours(23, 59, 59, 999);
  periods.push({ type: 'daily', end: yesterday });

  // Weekly: end of previous Sunday (midnight UTC)
  const dayOfWeek = now.getUTCDay();
  if (dayOfWeek === 0) {
    // It's Sunday, check if we've passed midnight
    const lastSunday = new Date(now);
    lastSunday.setUTCDate(lastSunday.getUTCDate() - 7);
    lastSunday.setUTCHours(23, 59, 59, 999);
    periods.push({ type: 'weekly', end: lastSunday });
  } else {
    const lastSunday = new Date(now);
    lastSunday.setUTCDate(lastSunday.getUTCDate() - dayOfWeek);
    lastSunday.setUTCHours(23, 59, 59, 999);
    periods.push({ type: 'weekly', end: lastSunday });
  }

  // Monthly: end of previous month
  const lastMonth = new Date(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999);
  periods.push({ type: 'monthly', end: lastMonth });

  return periods;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify secret token authentication
    const authToken = req.headers.get('X-Function-Secret');
    const expectedToken = Deno.env.get('FUNCTION_SECRET_TOKEN');

    if (!expectedToken) {
      console.error('FUNCTION_SECRET_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!authToken || authToken !== expectedToken) {
      console.error('Invalid or missing function secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting leaderboard rewards processing...');

    const periods = getEndedPeriods();
    let totalRewardsCreated = 0;

    for (const period of periods) {
      const periodEndStr = period.end.toISOString();
      console.log(`Processing ${period.type} period ending ${periodEndStr}`);

      // Check if already processed
      const { data: existingLog } = await supabase
        .from('rewards_processing_log')
        .select('id')
        .eq('period_type', period.type)
        .eq('period_end', periodEndStr)
        .maybeSingle();

      if (existingLog) {
        console.log(`${period.type} period ${periodEndStr} already processed, skipping`);
        continue;
      }

      let periodRewardsCreated = 0;

      for (const category of CATEGORIES) {
        const column = CATEGORY_COLUMNS[category];
        
        // Get top 3 players for this category
        const { data: topPlayers, error: topError } = await supabase
          .from('player_stats')
          .select('user_id')
          .order(column, { ascending: false })
          .limit(3);

        if (topError) {
          console.error(`Error fetching top players for ${category}:`, topError);
          continue;
        }

        if (!topPlayers || topPlayers.length === 0) {
          console.log(`No players found for category ${category}`);
          continue;
        }

        const players = topPlayers as Array<{ user_id: string }>;

        // Create rewards for top 3
        for (let i = 0; i < players.length; i++) {
          const rank = i + 1;
          const player = players[i];
          const rewards = REWARD_STRUCTURE[period.type][rank as 1 | 2 | 3];

          if (!rewards || !player.user_id) continue;

          const { error: insertError } = await supabase
            .from('leaderboard_rewards')
            .insert({
              user_id: player.user_id,
              period_type: period.type,
              period_end: periodEndStr,
              category,
              rank,
              reward_coins: rewards.coins,
              reward_badge: rewards.badge,
            });

          if (insertError) {
            // Might be a duplicate, log but continue
            console.error(`Error creating reward:`, insertError);
          } else {
            periodRewardsCreated++;
            console.log(`Created ${period.type} reward for rank ${rank} in ${category}: ${rewards.coins} coins`);
          }
        }
      }

      // Log that we processed this period
      await supabase
        .from('rewards_processing_log')
        .insert({
          period_type: period.type,
          period_end: periodEndStr,
          rewards_created: periodRewardsCreated,
        });

      totalRewardsCreated += periodRewardsCreated;
      console.log(`Completed ${period.type} period: ${periodRewardsCreated} rewards created`);
    }

    console.log(`Finished processing. Total rewards created: ${totalRewardsCreated}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalRewardsCreated,
        message: `Processed leaderboard rewards. Created ${totalRewardsCreated} new rewards.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing leaderboard rewards:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
