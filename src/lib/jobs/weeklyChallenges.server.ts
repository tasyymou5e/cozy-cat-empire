import type { SupabaseClient } from '@supabase/supabase-js';

const CHALLENGE_TEMPLATES = [
  // Easy
  { name: 'Show Starter', description: 'Win cat shows to prove your cats are the best!', emoji: '🏆', challenge_type: 'show_wins', target_value: 3, reward_coins: 500, reward_badge: 'Show Novice', difficulty: 'easy' },
  { name: 'Kitten Keeper', description: 'Breed adorable kittens to grow your cat family', emoji: '🐱', challenge_type: 'breed_kittens', target_value: 2, reward_coins: 400, reward_badge: null, difficulty: 'easy' },
  { name: 'Trick Trainer', description: 'Teach your cats new tricks', emoji: '🎪', challenge_type: 'train_tricks', target_value: 5, reward_coins: 350, reward_badge: null, difficulty: 'easy' },
  { name: 'Cat Collector', description: 'Add new cats to your collection', emoji: '📦', challenge_type: 'collect_cats', target_value: 2, reward_coins: 300, reward_badge: null, difficulty: 'easy' },
  // Medium
  { name: 'Champion Circuit', description: 'Dominate the cat show circuit with multiple wins', emoji: '🥇', challenge_type: 'show_wins', target_value: 7, reward_coins: 1000, reward_badge: 'Show Champion', difficulty: 'medium' },
  { name: 'Breeding Master', description: 'Become a skilled cat breeder', emoji: '💕', challenge_type: 'breed_kittens', target_value: 5, reward_coins: 800, reward_badge: 'Breeder', difficulty: 'medium' },
  { name: 'Performance Pro', description: 'Train your cats to perform many tricks', emoji: '⭐', challenge_type: 'train_tricks', target_value: 12, reward_coins: 750, reward_badge: null, difficulty: 'medium' },
  { name: 'Money Maker', description: 'Earn coins through various activities', emoji: '💰', challenge_type: 'earn_money', target_value: 2000, reward_coins: 600, reward_badge: null, difficulty: 'medium' },
  { name: 'Social Butterfly', description: 'Help your cats make friends through socializing', emoji: '🤝', challenge_type: 'socialize', target_value: 10, reward_coins: 700, reward_badge: null, difficulty: 'medium' },
  // Hard
  { name: 'Show Legend', description: 'Prove your cats are legendary show champions', emoji: '👑', challenge_type: 'show_wins', target_value: 15, reward_coins: 2000, reward_badge: 'Show Legend', difficulty: 'hard' },
  { name: 'Cat Empire', description: 'Build a large collection of cats', emoji: '🏰', challenge_type: 'collect_cats', target_value: 8, reward_coins: 1500, reward_badge: 'Cat Lord', difficulty: 'hard' },
  { name: 'Kitten Kingdom', description: 'Breed many kittens to expand your dynasty', emoji: '🍼', challenge_type: 'breed_kittens', target_value: 10, reward_coins: 1800, reward_badge: 'Master Breeder', difficulty: 'hard' },
] as const;

export interface WeeklyChallengesResult {
  success?: true;
  message?: string;
  challenges?: number;
  week_start?: string;
  week_end?: string;
}

function shuffleAndPick<T>(arr: readonly T[], count: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, count);
}

/** Generates this week's challenge set (2 easy, 2 medium, 1 hard) if none exist yet. */
export async function runGenerateWeeklyChallenges(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
): Promise<WeeklyChallengesResult> {
  console.log('Generating weekly challenges...');

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setUTCDate(now.getUTCDate() - now.getUTCDay());
  startOfWeek.setUTCHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 7);

  const { data: existingChallenges } = await supabase
    .from('weekly_challenges')
    .select('id')
    .gte('starts_at', startOfWeek.toISOString())
    .lt('starts_at', endOfWeek.toISOString());

  if (existingChallenges && existingChallenges.length > 0) {
    console.log('Challenges already exist for this week');
    return { message: 'Challenges already exist for this week' };
  }

  await supabase.from('weekly_challenges').update({ is_active: false }).lt('ends_at', now.toISOString());

  const selected = [
    ...shuffleAndPick(
      CHALLENGE_TEMPLATES.filter((c) => c.difficulty === 'easy'),
      2,
    ),
    ...shuffleAndPick(
      CHALLENGE_TEMPLATES.filter((c) => c.difficulty === 'medium'),
      2,
    ),
    ...shuffleAndPick(
      CHALLENGE_TEMPLATES.filter((c) => c.difficulty === 'hard'),
      1,
    ),
  ];

  const challengesToInsert = selected.map((challenge) => ({
    ...challenge,
    starts_at: startOfWeek.toISOString(),
    ends_at: endOfWeek.toISOString(),
    is_active: true,
  }));

  const { data: inserted, error } = await supabase.from('weekly_challenges').insert(challengesToInsert).select();

  if (error) {
    console.error('Error inserting challenges:', error);
    throw error;
  }

  console.log(`Created ${inserted?.length || 0} weekly challenges`);

  return {
    success: true,
    challenges: inserted?.length || 0,
    week_start: startOfWeek.toISOString(),
    week_end: endOfWeek.toISOString(),
  };
}
