import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================================
// CORS
// ============================================================================

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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-function-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  };
}

interface Cat {
  id: string; name: string; breed: string; health: number; happiness: number;
  hunger: number; grade: number; age: number; personality: string; value: number;
}

interface GameState {
  cats: Cat[]; money: number; day: number; space: number;
  totalMoneyEarned: number; houseSize: string;
}

interface Issue {
  userId: string; issueType: string; description: string;
  severity: 'critical' | 'warning' | 'info'; catId?: string; catName?: string;
}

interface HealthCheckResult {
  run_at: string; saves_checked: number; saves_with_issues: number;
  total_issues: number;
  issue_summary: { critical: number; warning: number; info: number; by_type: Record<string, number> };
  execution_time_ms: number;
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Require shared secret token (cron job sends this header)
  const expectedToken = Deno.env.get('FUNCTION_SECRET_TOKEN');
  const providedToken = req.headers.get('x-function-secret');
  if (!expectedToken || providedToken !== expectedToken) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: saves, error: savesError } = await supabase
      .from('game_saves').select('user_id, game_state, last_played_at')
      .gte('last_played_at', cutoffDate).limit(500);

    if (savesError) throw new Error(`Failed to fetch saves: ${savesError.message}`);

    const issues: Issue[] = [];
    const savesWithIssues = new Set<string>();

    for (const save of saves || []) {
      const userId = save.user_id;
      const gameState = save.game_state as unknown as GameState;

      if (!gameState || typeof gameState !== 'object') {
        issues.push({ userId, issueType: 'invalid_game_state', description: 'Game state is null or not an object', severity: 'critical' });
        savesWithIssues.add(userId); continue;
      }

      const cats = gameState.cats;
      if (!Array.isArray(cats)) {
        issues.push({ userId, issueType: 'missing_cats_array', description: 'Cats array is missing or invalid', severity: 'critical' });
        savesWithIssues.add(userId); continue;
      }

      const space = gameState.space || 5;
      if (cats.length > space) {
        issues.push({ userId, issueType: 'over_capacity', description: `${cats.length} cats but space is ${space}`, severity: 'warning' });
        savesWithIssues.add(userId);
      }

      if (cats.length === 0 && gameState.day > 1) {
        issues.push({ userId, issueType: 'zero_cats_after_day_1', description: `Day ${gameState.day} with 0 cats`, severity: 'critical' });
        savesWithIssues.add(userId);
      }

      const catIds = cats.map(c => c.id);
      const duplicateIds = catIds.filter((id, index) => catIds.indexOf(id) !== index);
      if (duplicateIds.length > 0) {
        issues.push({ userId, issueType: 'duplicate_cat_ids', description: `Duplicate cat IDs: ${duplicateIds.join(', ')}`, severity: 'warning' });
        savesWithIssues.add(userId);
      }

      for (const cat of cats) {
        if (!cat.id || !cat.name || !cat.breed) {
          issues.push({ userId, issueType: 'missing_cat_fields', description: 'Cat missing required fields', severity: 'warning', catId: cat.id, catName: cat.name });
          savesWithIssues.add(userId);
        }
        if (typeof cat.health === 'number' && (cat.health < 0 || cat.health > 100)) {
          issues.push({ userId, issueType: 'health_out_of_range', description: `Health is ${cat.health}`, severity: 'warning', catId: cat.id, catName: cat.name });
          savesWithIssues.add(userId);
        }
        if (typeof cat.grade === 'number' && (cat.grade < 1 || cat.grade > 20)) {
          issues.push({ userId, issueType: 'grade_out_of_range', description: `Grade is ${cat.grade}`, severity: 'info', catId: cat.id, catName: cat.name });
          savesWithIssues.add(userId);
        }
      }

      if (typeof gameState.money === 'number' && gameState.money < 0) {
        issues.push({ userId, issueType: 'negative_money', description: `Money is ${gameState.money}`, severity: 'warning' });
        savesWithIssues.add(userId);
      }
      if (typeof gameState.totalMoneyEarned === 'number' && gameState.totalMoneyEarned < 0) {
        issues.push({ userId, issueType: 'negative_total_earned', description: `totalMoneyEarned is ${gameState.totalMoneyEarned}`, severity: 'warning' });
        savesWithIssues.add(userId);
      }
    }

    const issueSummary = {
      critical: issues.filter(i => i.severity === 'critical').length,
      warning: issues.filter(i => i.severity === 'warning').length,
      info: issues.filter(i => i.severity === 'info').length,
      by_type: issues.reduce((acc, issue) => { acc[issue.issueType] = (acc[issue.issueType] || 0) + 1; return acc; }, {} as Record<string, number>),
    };

    const executionTime = Date.now() - startTime;
    const result: HealthCheckResult = {
      run_at: new Date().toISOString(), saves_checked: saves?.length || 0,
      saves_with_issues: savesWithIssues.size, total_issues: issues.length,
      issue_summary: issueSummary, execution_time_ms: executionTime,
    };

    await supabase.from('sync_health_log').insert({
      run_at: result.run_at, saves_checked: result.saves_checked,
      saves_with_issues: result.saves_with_issues, total_issues: result.total_issues,
      issue_summary: issueSummary, execution_time_ms: executionTime,
    });

    const criticalIssues = issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      await supabase.from('error_logs').insert(criticalIssues.map(issue => ({
        error_type: 'sync_health', error_message: `${issue.issueType}: ${issue.description}`,
        user_id: issue.userId, metadata: { issueType: issue.issueType, catId: issue.catId, catName: issue.catName, severity: issue.severity },
      })));
    }

    console.log(`Sync health check complete: ${result.saves_checked} saves, ${result.total_issues} issues, ${executionTime}ms`);

    return new Response(JSON.stringify(result), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Sync health check error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
