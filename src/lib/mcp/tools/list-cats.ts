import { defineTool, ToolError } from '@lovable.dev/mcp-js';
import { z } from 'zod';
import { supabaseForUser } from '../supabase';

interface SavedCat {
  id?: unknown;
  name?: unknown;
  breed?: unknown;
  personality?: unknown;
  grade?: unknown;
  health?: unknown;
  happiness?: unknown;
  hunger?: unknown;
  showWins?: unknown;
  value?: unknown;
}

const asString = (value: unknown, fallback = '') =>
  typeof value === 'string' ? value : fallback;
const asNumber = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const toCatJson = (cat: SavedCat) => ({
  id: asString(cat.id),
  name: asString(cat.name, 'Unnamed'),
  breed: asString(cat.breed, 'unknown'),
  personality: asString(cat.personality, 'unknown'),
  grade: asNumber(cat.grade),
  health: asNumber(cat.health),
  happiness: asNumber(cat.happiness),
  hunger: asNumber(cat.hunger),
  showWins: asNumber(cat.showWins),
  value: asNumber(cat.value),
});

export default defineTool({
  name: 'list_cats',
  title: 'List cats',
  description:
    "List the cats on the signed-in player's farm, with breed, grade, health, happiness and show wins.",
  inputSchema: {
    limit: z.number().int().min(1).max(200).default(50).describe('Maximum cats to return.'),
    needsCare: z
      .boolean()
      .default(false)
      .describe('Only return cats that are sick, unhappy or hungry.'),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, needsCare }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError('Not authenticated');
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from('game_saves')
      .select('game_state')
      .eq('user_id', ctx.getUserId()!)
      .maybeSingle();

    if (error) throw new ToolError(error.message);
    const rawCats = (data?.game_state as { cats?: SavedCat[] } | null)?.cats;
    if (!Array.isArray(rawCats) || rawCats.length === 0) {
      return { content: [{ type: 'text', text: 'This player has no cats yet.' }] };
    }

    let cats = rawCats.map(toCatJson);
    if (needsCare) {
      cats = cats.filter((c) => c.health < 70 || c.happiness < 50 || c.hunger < 40);
    }
    cats = cats.slice(0, limit);

    const lines = cats.map(
      (c) =>
        `${c.name} — ${c.breed}, grade ${c.grade}, health ${c.health}, happiness ${c.happiness}, hunger ${c.hunger}`
    );

    return {
      content: [
        {
          type: 'text' as const,
          text: lines.length ? lines.join('\n') : 'No cats match that filter.',
        },
      ],
      structuredContent: { cats },
    };
  },
});
