import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-function-secret',
};

// Rate limit: 5 calls per hour (scheduled task shouldn't be called frequently)
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 5;

// In-memory rate limit store
let rateLimitData = { count: 0, windowStart: 0 };

function checkRateLimit(): { allowed: boolean; remaining: number } {
  const now = Date.now();
  
  if ((now - rateLimitData.windowStart) > RATE_LIMIT_WINDOW_MS) {
    rateLimitData = { count: 1, windowStart: now };
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }
  
  if (rateLimitData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }
  
  rateLimitData.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - rateLimitData.count };
}

// Challenge templates
const CHALLENGE_TEMPLATES = [
  // Easy challenges
  {
    name: "Show Starter",
    description: "Win cat shows to prove your cats are the best!",
    emoji: "🏆",
    challenge_type: "show_wins",
    target_value: 3,
    reward_coins: 500,
    reward_badge: "Show Novice",
    difficulty: "easy"
  },
  {
    name: "Kitten Keeper",
    description: "Breed adorable kittens to grow your cat family",
    emoji: "🐱",
    challenge_type: "breed_kittens",
    target_value: 2,
    reward_coins: 400,
    reward_badge: null,
    difficulty: "easy"
  },
  {
    name: "Trick Trainer",
    description: "Teach your cats new tricks",
    emoji: "🎪",
    challenge_type: "train_tricks",
    target_value: 5,
    reward_coins: 350,
    reward_badge: null,
    difficulty: "easy"
  },
  {
    name: "Cat Collector",
    description: "Add new cats to your collection",
    emoji: "📦",
    challenge_type: "collect_cats",
    target_value: 2,
    reward_coins: 300,
    reward_badge: null,
    difficulty: "easy"
  },
  // Medium challenges
  {
    name: "Champion Circuit",
    description: "Dominate the cat show circuit with multiple wins",
    emoji: "🥇",
    challenge_type: "show_wins",
    target_value: 7,
    reward_coins: 1000,
    reward_badge: "Show Champion",
    difficulty: "medium"
  },
  {
    name: "Breeding Master",
    description: "Become a skilled cat breeder",
    emoji: "💕",
    challenge_type: "breed_kittens",
    target_value: 5,
    reward_coins: 800,
    reward_badge: "Breeder",
    difficulty: "medium"
  },
  {
    name: "Performance Pro",
    description: "Train your cats to perform many tricks",
    emoji: "⭐",
    challenge_type: "train_tricks",
    target_value: 12,
    reward_coins: 750,
    reward_badge: null,
    difficulty: "medium"
  },
  {
    name: "Money Maker",
    description: "Earn coins through various activities",
    emoji: "💰",
    challenge_type: "earn_money",
    target_value: 2000,
    reward_coins: 600,
    reward_badge: null,
    difficulty: "medium"
  },
  {
    name: "Social Butterfly",
    description: "Help your cats make friends through socializing",
    emoji: "🤝",
    challenge_type: "socialize",
    target_value: 10,
    reward_coins: 700,
    reward_badge: null,
    difficulty: "medium"
  },
  // Hard challenges
  {
    name: "Show Legend",
    description: "Prove your cats are legendary show champions",
    emoji: "👑",
    challenge_type: "show_wins",
    target_value: 15,
    reward_coins: 2000,
    reward_badge: "Show Legend",
    difficulty: "hard"
  },
  {
    name: "Cat Empire",
    description: "Build a large collection of cats",
    emoji: "🏰",
    challenge_type: "collect_cats",
    target_value: 8,
    reward_coins: 1500,
    reward_badge: "Cat Lord",
    difficulty: "hard"
  },
  {
    name: "Kitten Kingdom",
    description: "Breed many kittens to expand your dynasty",
    emoji: "🍼",
    challenge_type: "breed_kittens",
    target_value: 10,
    reward_coins: 1800,
    reward_badge: "Master Breeder",
    difficulty: "hard"
  }
];

Deno.serve(async (req) => {
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

    // Check rate limit
    const rateLimit = checkRateLimit();
    if (!rateLimit.allowed) {
      console.log('Rate limit exceeded for generate-weekly-challenges');
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          remaining: rateLimit.remaining
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': rateLimit.remaining.toString()
          } 
        }
      );
    }

    console.log('Generating weekly challenges...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calculate week start and end
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const startOfWeek = new Date(now);
    startOfWeek.setUTCDate(now.getUTCDate() - dayOfWeek);
    startOfWeek.setUTCHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 7);

    // Check if challenges already exist for this week
    const { data: existingChallenges } = await supabase
      .from('weekly_challenges')
      .select('id')
      .gte('starts_at', startOfWeek.toISOString())
      .lt('starts_at', endOfWeek.toISOString());

    if (existingChallenges && existingChallenges.length > 0) {
      console.log('Challenges already exist for this week');
      return new Response(
        JSON.stringify({ message: 'Challenges already exist for this week', rateLimitRemaining: rateLimit.remaining }),
        { 
          status: 200, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': rateLimit.remaining.toString()
          } 
        }
      );
    }

    // Deactivate old challenges
    await supabase
      .from('weekly_challenges')
      .update({ is_active: false })
      .lt('ends_at', now.toISOString());

    // Select challenges: 2 easy, 2 medium, 1 hard
    const easyChallenges = CHALLENGE_TEMPLATES.filter(c => c.difficulty === 'easy');
    const mediumChallenges = CHALLENGE_TEMPLATES.filter(c => c.difficulty === 'medium');
    const hardChallenges = CHALLENGE_TEMPLATES.filter(c => c.difficulty === 'hard');

    const shuffleAndPick = <T>(arr: T[], count: number): T[] => {
      const shuffled = [...arr].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    };

    const selectedChallenges = [
      ...shuffleAndPick(easyChallenges, 2),
      ...shuffleAndPick(mediumChallenges, 2),
      ...shuffleAndPick(hardChallenges, 1)
    ];

    // Insert new challenges
    const challengesToInsert = selectedChallenges.map(challenge => ({
      ...challenge,
      starts_at: startOfWeek.toISOString(),
      ends_at: endOfWeek.toISOString(),
      is_active: true
    }));

    const { data: insertedChallenges, error } = await supabase
      .from('weekly_challenges')
      .insert(challengesToInsert)
      .select();

    if (error) {
      console.error('Error inserting challenges:', error);
      throw error;
    }

    console.log(`Created ${insertedChallenges?.length || 0} weekly challenges`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        challenges: insertedChallenges?.length || 0,
        week_start: startOfWeek.toISOString(),
        week_end: endOfWeek.toISOString(),
        rateLimitRemaining: rateLimit.remaining
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': rateLimit.remaining.toString()
        } 
      }
    );
  } catch (error) {
    console.error('Error generating challenges:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
