import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
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

const RecoveryRequestSchema = z.object({
  userId: z.string().uuid(),
  catNames: z.array(z.string().max(100)).max(50).default([]),
});

interface RecoveryResult {
  success: boolean;
  userId: string;
  currentCats: string[];
  searchedNames: string[];
  activityLogReferences: Array<{
    activity_type: string;
    activity_description: string;
    created_at: string;
    metadata: unknown;
  }>;
  errorLogReferences: Array<{
    error_type: string;
    error_message: string;
    created_at: string;
  }>;
  portraitBucketFiles: string[];
  snapshotHistory: Array<{
    snapshot_type: string;
    cat_count: number;
    cat_names: string[];
    day: number;
    created_at: string;
  }>;
  recommendations: string[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify caller is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body: RecoveryRequest = await req.json();
    const { userId, catNames = [] } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result: RecoveryResult = {
      success: true,
      userId,
      currentCats: [],
      searchedNames: catNames,
      activityLogReferences: [],
      errorLogReferences: [],
      portraitBucketFiles: [],
      snapshotHistory: [],
      recommendations: [],
    };

    // 1. Get current cats from game_saves
    const { data: saveData } = await supabase
      .from('game_saves')
      .select('game_state')
      .eq('user_id', userId)
      .maybeSingle();

    if (saveData?.game_state) {
      const gameState = saveData.game_state as { cats?: Array<{ name: string }> };
      result.currentCats = (gameState.cats || []).map(c => c.name);
    }

    // 2. Search player_activity_log for cat-related events
    const searchPattern = catNames.length > 0 
      ? catNames.join('|') 
      : '.*';
    
    const { data: activityLogs } = await supabase
      .from('player_activity_log')
      .select('activity_type, activity_description, created_at, metadata')
      .eq('user_id', userId)
      .or(`activity_type.eq.cat_bred,activity_type.eq.show_win,activity_type.eq.gift_sent,activity_type.eq.gift_received,activity_type.eq.trade_completed`)
      .order('created_at', { ascending: false })
      .limit(100);

    if (activityLogs) {
      result.activityLogReferences = activityLogs.filter(log => {
        if (catNames.length === 0) return true;
        const desc = (log.activity_description || '').toLowerCase();
        const meta = JSON.stringify(log.metadata || {}).toLowerCase();
        return catNames.some(name => 
          desc.includes(name.toLowerCase()) || meta.includes(name.toLowerCase())
        );
      });
    }

    // 3. Search error_logs for save failures
    const { data: errorLogs } = await supabase
      .from('error_logs')
      .select('error_type, error_message, created_at')
      .eq('user_id', userId)
      .or('error_type.eq.auto_save_error,error_type.eq.cloud_save_error,error_type.eq.sync_health')
      .order('created_at', { ascending: false })
      .limit(50);

    if (errorLogs) {
      result.errorLogReferences = errorLogs;
    }

    // 4. List portrait files in cat-portraits bucket for this user
    const { data: portraitFiles } = await supabase.storage
      .from('cat-portraits')
      .list(userId, { limit: 100 });

    if (portraitFiles) {
      result.portraitBucketFiles = portraitFiles.map(f => f.name);
    }

    // 5. Get save snapshot history
    const { data: snapshots } = await supabase
      .from('save_snapshots')
      .select('snapshot_type, cat_count, cat_names, day, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (snapshots) {
      result.snapshotHistory = snapshots;
    }

    // 6. Generate recommendations
    const missingCats = catNames.filter(name => 
      !result.currentCats.some(current => 
        current.toLowerCase() === name.toLowerCase()
      )
    );

    if (missingCats.length > 0) {
      result.recommendations.push(
        `Missing cats: ${missingCats.join(', ')}`
      );

      // Check if any activity logs mention the missing cats
      const foundInActivity = missingCats.filter(name =>
        result.activityLogReferences.some(log =>
          log.activity_description?.toLowerCase().includes(name.toLowerCase())
        )
      );

      if (foundInActivity.length > 0) {
        result.recommendations.push(
          `Found references in activity log for: ${foundInActivity.join(', ')}. Cats may have been traded, gifted, or lost during a sync issue.`
        );
      }

      // Check snapshots for when cats were present
      const snapshotsWithMissing = result.snapshotHistory.filter(snap =>
        missingCats.some(name =>
          snap.cat_names.some(sn => sn.toLowerCase() === name.toLowerCase())
        )
      );

      if (snapshotsWithMissing.length > 0) {
        result.recommendations.push(
          `Found snapshots containing missing cats. Latest: ${snapshotsWithMissing[0].created_at} with ${snapshotsWithMissing[0].cat_count} cats.`
        );
        result.recommendations.push(
          'Recovery may be possible by restoring from a snapshot.'
        );
      } else {
        result.recommendations.push(
          'No snapshots found containing these cats. Data may have been lost before snapshot system was implemented.'
        );
      }

      // Check for save errors around the time cats were lost
      if (result.errorLogReferences.length > 0) {
        result.recommendations.push(
          `Found ${result.errorLogReferences.length} save-related errors. Review for potential data loss causes.`
        );
      }

      // Check portrait bucket
      const portraitsForMissing = missingCats.filter(name =>
        result.portraitBucketFiles.some(file =>
          file.toLowerCase().includes(name.toLowerCase())
        )
      );

      if (portraitsForMissing.length > 0) {
        result.recommendations.push(
          `Found portrait files for: ${portraitsForMissing.join(', ')}. Cats existed at some point.`
        );
      }
    } else if (catNames.length > 0) {
      result.recommendations.push('All searched cats are present in current save.');
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Recovery function error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
