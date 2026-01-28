import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Cat {
  id: string;
  name: string;
  breed: string;
  health: number;
  happiness: number;
  hunger: number;
  grade: number;
  age: number;
  personality: string;
  value: number;
}

interface GameState {
  cats: Cat[];
  money: number;
  day: number;
  space: number;
  totalMoneyEarned: number;
  houseSize: string;
}

interface Issue {
  userId: string;
  issueType: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  catId?: string;
  catName?: string;
}

interface HealthCheckResult {
  run_at: string;
  saves_checked: number;
  saves_with_issues: number;
  total_issues: number;
  issue_summary: {
    critical: number;
    warning: number;
    info: number;
    by_type: Record<string, number>;
  };
  execution_time_ms: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get active game saves (played within last 24 hours)
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: saves, error: savesError } = await supabase
      .from('game_saves')
      .select('user_id, game_state, last_played_at')
      .gte('last_played_at', cutoffDate)
      .limit(500);

    if (savesError) {
      throw new Error(`Failed to fetch saves: ${savesError.message}`);
    }

    const issues: Issue[] = [];
    const savesWithIssues = new Set<string>();

    for (const save of saves || []) {
      const userId = save.user_id;
      const gameState = save.game_state as unknown as GameState;

      if (!gameState || typeof gameState !== 'object') {
        issues.push({
          userId,
          issueType: 'invalid_game_state',
          description: 'Game state is null or not an object',
          severity: 'critical',
        });
        savesWithIssues.add(userId);
        continue;
      }

      const cats = gameState.cats;

      // Check 1: Validate cats array exists
      if (!Array.isArray(cats)) {
        issues.push({
          userId,
          issueType: 'missing_cats_array',
          description: 'Cats array is missing or invalid',
          severity: 'critical',
        });
        savesWithIssues.add(userId);
        continue;
      }

      // Check 2: Cat count vs space limit (warning if over)
      const space = gameState.space || 5;
      if (cats.length > space) {
        issues.push({
          userId,
          issueType: 'over_capacity',
          description: `${cats.length} cats but space is ${space}`,
          severity: 'warning',
        });
        savesWithIssues.add(userId);
      }

      // Check 3: Sudden cat count drop (critical if 0 cats after day 1)
      if (cats.length === 0 && gameState.day > 1) {
        issues.push({
          userId,
          issueType: 'zero_cats_after_day_1',
          description: `Day ${gameState.day} with 0 cats - possible data loss`,
          severity: 'critical',
        });
        savesWithIssues.add(userId);
      }

      // Check 4: Duplicate cat IDs
      const catIds = cats.map(c => c.id);
      const duplicateIds = catIds.filter((id, index) => catIds.indexOf(id) !== index);
      if (duplicateIds.length > 0) {
        issues.push({
          userId,
          issueType: 'duplicate_cat_ids',
          description: `Duplicate cat IDs: ${duplicateIds.join(', ')}`,
          severity: 'warning',
        });
        savesWithIssues.add(userId);
      }

      // Check 5: Invalid cat data
      for (const cat of cats) {
        // Missing required fields
        if (!cat.id || !cat.name || !cat.breed) {
          issues.push({
            userId,
            issueType: 'missing_cat_fields',
            description: `Cat missing required fields`,
            severity: 'warning',
            catId: cat.id,
            catName: cat.name,
          });
          savesWithIssues.add(userId);
        }

        // Health out of range
        if (typeof cat.health === 'number' && (cat.health < 0 || cat.health > 100)) {
          issues.push({
            userId,
            issueType: 'health_out_of_range',
            description: `Health is ${cat.health}`,
            severity: 'warning',
            catId: cat.id,
            catName: cat.name,
          });
          savesWithIssues.add(userId);
        }

        // Grade out of range
        if (typeof cat.grade === 'number' && (cat.grade < 1 || cat.grade > 20)) {
          issues.push({
            userId,
            issueType: 'grade_out_of_range',
            description: `Grade is ${cat.grade}`,
            severity: 'info',
            catId: cat.id,
            catName: cat.name,
          });
          savesWithIssues.add(userId);
        }
      }

      // Check 6: Negative money values
      if (typeof gameState.money === 'number' && gameState.money < 0) {
        issues.push({
          userId,
          issueType: 'negative_money',
          description: `Money is ${gameState.money}`,
          severity: 'warning',
        });
        savesWithIssues.add(userId);
      }

      // Check 7: Negative totalMoneyEarned
      if (typeof gameState.totalMoneyEarned === 'number' && gameState.totalMoneyEarned < 0) {
        issues.push({
          userId,
          issueType: 'negative_total_earned',
          description: `totalMoneyEarned is ${gameState.totalMoneyEarned}`,
          severity: 'warning',
        });
        savesWithIssues.add(userId);
      }
    }

    // Calculate summary
    const issueSummary = {
      critical: issues.filter(i => i.severity === 'critical').length,
      warning: issues.filter(i => i.severity === 'warning').length,
      info: issues.filter(i => i.severity === 'info').length,
      by_type: issues.reduce((acc, issue) => {
        acc[issue.issueType] = (acc[issue.issueType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    const executionTime = Date.now() - startTime;

    const result: HealthCheckResult = {
      run_at: new Date().toISOString(),
      saves_checked: saves?.length || 0,
      saves_with_issues: savesWithIssues.size,
      total_issues: issues.length,
      issue_summary: issueSummary,
      execution_time_ms: executionTime,
    };

    // Log to sync_health_log table
    await supabase.from('sync_health_log').insert({
      run_at: result.run_at,
      saves_checked: result.saves_checked,
      saves_with_issues: result.saves_with_issues,
      total_issues: result.total_issues,
      issue_summary: issueSummary,
      execution_time_ms: executionTime,
    });

    // Log critical issues to error_logs
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      const errorLogs = criticalIssues.map(issue => ({
        error_type: 'sync_health',
        error_message: `${issue.issueType}: ${issue.description}`,
        user_id: issue.userId,
        metadata: {
          issueType: issue.issueType,
          catId: issue.catId,
          catName: issue.catName,
          severity: issue.severity,
        },
      }));

      await supabase.from('error_logs').insert(errorLogs);
    }

    console.log(`Sync health check complete: ${result.saves_checked} saves, ${result.total_issues} issues, ${executionTime}ms`);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Sync health check error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
