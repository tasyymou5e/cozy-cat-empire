import { defineTool, ToolError } from '@lovable.dev/mcp-js';
import { supabaseForUser } from '../supabase';

interface SavedCat {
  id?: unknown;
  name?: unknown;
  breed?: unknown;
  grade?: unknown;
  health?: unknown;
  happiness?: unknown;
  hunger?: unknown;
  showWins?: unknown;
}

interface SavedGameState {
  cats?: SavedCat[];
  money?: number;
  day?: number;
  houseSize?: string;
  acres?: number;
  reputation?: number;
  totalShowWins?: number;
  totalMoneyEarned?: number;
  resources?: Record<string, number>;
}

export default defineTool({
  name: 'get_farm_summary',
  title: 'Get farm summary',
  description:
    "Summary of the signed-in player's cat farm: money, day, housing, cat count, show wins and resources.",
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError('Not authenticated');
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from('game_saves')
      .select('game_state, kittens_bred, last_played_at')
      .eq('user_id', ctx.getUserId()!)
      .maybeSingle();

    if (error) throw new ToolError(error.message);
    if (!data) throw new ToolError('No saved game found for this player yet.');

    const state = (data.game_state ?? {}) as SavedGameState;
    const summary = {
      money: state.money ?? 0,
      day: state.day ?? 0,
      houseSize: state.houseSize ?? 'apartment',
      acres: state.acres ?? 0,
      catCount: Array.isArray(state.cats) ? state.cats.length : 0,
      kittensBred: data.kittens_bred ?? 0,
      totalShowWins: state.totalShowWins ?? 0,
      totalMoneyEarned: state.totalMoneyEarned ?? 0,
      reputation: state.reputation ?? 0,
      resources: state.resources ?? {},
      lastPlayedAt: data.last_played_at ?? null,
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: `Day ${summary.day} · ${summary.catCount} cats · $${summary.money} · ${summary.houseSize} · ${summary.totalShowWins} show wins`,
        },
      ],
      structuredContent: { summary },
    };
  },
});
