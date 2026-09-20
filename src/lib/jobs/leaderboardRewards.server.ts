import type { SupabaseClient } from '@supabase/supabase-js';

const REWARD_STRUCTURE = {
  daily: { 1: { coins: 100, badge: '👑' }, 2: { coins: 50, badge: '🥈' }, 3: { coins: 25, badge: '🥉' } },
  weekly: { 1: { coins: 500, badge: '👑' }, 2: { coins: 250, badge: '🥈' }, 3: { coins: 100, badge: '🥉' } },
  monthly: { 1: { coins: 2000, badge: '👑' }, 2: { coins: 1000, badge: '🥈' }, 3: { coins: 500, badge: '🥉' } },
} as const;

const CATEGORIES = ['wins', 'cats', 'breeding', 'wealth', 'achievements'] as const;
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

  const yesterday = new Date(now);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  yesterday.setUTCHours(23, 59, 59, 999);
  periods.push({ type: 'daily', end: yesterday });

  const dayOfWeek = now.getUTCDay();
  const lastSunday = new Date(now);
  lastSunday.setUTCDate(lastSunday.getUTCDate() - (dayOfWeek === 0 ? 7 : dayOfWeek));
  lastSunday.setUTCHours(23, 59, 59, 999);
  periods.push({ type: 'weekly', end: lastSunday });

  const lastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999));
  periods.push({ type: 'monthly', end: lastMonth });

  return periods;
}

export interface LeaderboardRewardsResult {
  success: true;
  totalRewardsCreated: number;
  message: string;
}

/** Creates top-3 rewards for each ended daily/weekly/monthly period, once per period. */
export async function runProcessLeaderboardRewards(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
): Promise<LeaderboardRewardsResult> {
  console.log('Starting leaderboard rewards processing...');

  const periods = getEndedPeriods();
  let totalRewardsCreated = 0;

  for (const period of periods) {
    const periodEndStr = period.end.toISOString();
    console.log(`Processing ${period.type} period ending ${periodEndStr}`);

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
      const column = CATEGORY_COLUMNS[category]!;

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

      for (let i = 0; i < players.length; i++) {
        const rank = (i + 1) as 1 | 2 | 3;
        const player = players[i];
        const rewards = REWARD_STRUCTURE[period.type][rank];
        if (!rewards || !player?.user_id) continue;

        const { error: insertError } = await supabase.from('leaderboard_rewards').insert({
          user_id: player.user_id,
          period_type: period.type,
          period_end: periodEndStr,
          category,
          rank,
          reward_coins: rewards.coins,
          reward_badge: rewards.badge,
        });

        if (insertError) {
          console.error('Error creating reward:', insertError);
        } else {
          periodRewardsCreated++;
        }
      }
    }

    await supabase.from('rewards_processing_log').insert({
      period_type: period.type,
      period_end: periodEndStr,
      rewards_created: periodRewardsCreated,
    });

    totalRewardsCreated += periodRewardsCreated;
    console.log(`Completed ${period.type} period: ${periodRewardsCreated} rewards created`);
  }

  console.log(`Finished processing. Total rewards created: ${totalRewardsCreated}`);

  return {
    success: true,
    totalRewardsCreated,
    message: `Processed leaderboard rewards. Created ${totalRewardsCreated} new rewards.`,
  };
}
