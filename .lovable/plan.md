
# Fix Missing Cats and Data Integrity for eric@wccgroup.net

## Problem Summary

Investigation reveals a **critical data discrepancy**: The user reports cats named Chester, Mittens, Felix, Milo, Smokey as "AI rendered" but these cats **do not exist in the database**. The current save contains 11 different cats (Pepper, Max, Whiskers, Cookie, Luna, Ginger, Dumbledore, Gandalf, Biscuit, Bella, Muffin), none of which have AI portraits.

### Root Cause Possibilities
1. Data loss during a previous save operation
2. Browser localStorage out of sync with cloud
3. Multiple browser sessions with conflicting data
4. A race condition that overwrote newer data with older state

## Implementation Plan

### Phase 1: Immediate Data Recovery Attempt

Create an edge function to check for backup data sources:

**New File: `supabase/functions/recover-lost-cats/index.ts`**

This function will:
- Query the `player_activity_log` for any cat-related events mentioning the missing names
- Check error_logs for save failures that might indicate when data was lost
- Search cat-portraits bucket for any files with matching cat names/IDs
- Return a recovery report with any found references

### Phase 2: Add Save History Tracking

Create a new table to track save snapshots for recovery purposes:

```sql
CREATE TABLE public.save_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  snapshot_type TEXT NOT NULL, -- 'auto', 'manual', 'migration'
  cat_count INTEGER NOT NULL,
  cat_names TEXT[] NOT NULL,
  day INTEGER NOT NULL,
  money INTEGER NOT NULL,
  game_state_hash TEXT NOT NULL, -- Quick comparison hash
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient user lookups
CREATE INDEX idx_save_snapshots_user ON save_snapshots(user_id, created_at DESC);

-- RLS: Users can view their own snapshots, admins can see all
ALTER TABLE save_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own snapshots" ON save_snapshots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all snapshots" ON save_snapshots
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
```

### Phase 3: Enhanced Cloud Save Protection

**Modify: `src/hooks/useCloudSave.ts`**

Add snapshot creation before each save:
- Before saving, record a snapshot of current state
- Keep last 10 snapshots per user (auto-prune older ones)
- Include cat names array for easy searching

```typescript
// Before cloudSave upsert, insert snapshot
const catNames = gameState.cats.map(c => c.name);
const stateHash = generateStateHash(gameState);

await supabase.from('save_snapshots').insert({
  user_id: userId,
  snapshot_type: 'auto',
  cat_count: gameState.cats.length,
  cat_names: catNames,
  day: gameState.day,
  money: gameState.money,
  game_state_hash: stateHash,
});

// Prune old snapshots (keep last 10)
await supabase
  .from('save_snapshots')
  .delete()
  .eq('user_id', userId)
  .lt('created_at', tenSnapshotsAgoTimestamp);
```

### Phase 4: Sync Health Check Cron Job

**New File: `supabase/functions/sync-health-check/index.ts`**

Runs every 10 minutes to:
1. Scan all active game saves (played within last 24 hours)
2. Validate data integrity:
   - Cat count vs space limit
   - Required fields present on all cats
   - No duplicate cat IDs
   - portraitUrl validity (if set, URL should exist in storage)
3. Log discrepancies to `error_logs` with type `sync_health`
4. Alert if critical issues found (cat count suddenly drops to 0)

**Cron Schedule (pg_cron):**
```sql
SELECT cron.schedule(
  'sync-health-check-10min',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url:='https://bkkluziuyystiqkcpbnd.supabase.co/functions/v1/sync-health-check',
    headers:=jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    ),
    body:='{}'::jsonb
  );
  $$
);
```

### Phase 5: Create Sync Health Log Table

```sql
CREATE TABLE public.sync_health_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  saves_checked INTEGER NOT NULL DEFAULT 0,
  saves_with_issues INTEGER NOT NULL DEFAULT 0,
  total_issues INTEGER NOT NULL DEFAULT 0,
  issue_summary JSONB DEFAULT '{}',
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Admin only
ALTER TABLE sync_health_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view sync health" ON sync_health_log
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service can insert sync health" ON sync_health_log
  FOR INSERT WITH CHECK (true);
```

### Phase 6: Documentation

**New File: `docs/CAT_DATA_SYNC.md`**

Contents:
1. Overview of cat data flow (cloud save → game state → rendering)
2. Save snapshot system for recovery
3. Sync health check monitoring
4. Troubleshooting guide for data loss
5. Admin recovery procedures

**New File: `docs/CRON_JOBS.md`**

Contents:
1. List of all active cron jobs
2. Schedule and purpose for each
3. Monitoring setup
4. Manual trigger instructions

### Phase 7: Admin Dashboard Integration

**Modify: `src/pages/admin/AdminDashboard.tsx`**

Add sync health status card showing:
- Last 24h health check results
- Any users with flagged issues
- Quick link to detailed logs

**New File: `src/pages/admin/AdminSaveRecovery.tsx`**

Recovery tool for admins to:
- View user's save snapshots history
- Compare snapshots to find when cats disappeared
- Restore from a previous snapshot if available

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/recover-lost-cats/index.ts` | **Create** | Attempt data recovery for specific user |
| `supabase/functions/sync-health-check/index.ts` | **Create** | 10-minute cron job for integrity checks |
| `src/hooks/useCloudSave.ts` | **Modify** | Add snapshot creation before saves |
| `src/pages/admin/AdminSaveRecovery.tsx` | **Create** | Admin tool for save recovery |
| `src/pages/admin/AdminDashboard.tsx` | **Modify** | Add sync health status card |
| `docs/CAT_DATA_SYNC.md` | **Create** | Data sync documentation |
| `docs/CRON_JOBS.md` | **Create** | Cron job documentation |

## Database Changes

| Table | Action | Description |
|-------|--------|-------------|
| `save_snapshots` | **Create** | Store save history for recovery |
| `sync_health_log` | **Create** | Log sync check results |

## Immediate Action for User

Unfortunately, the cats Chester, Mittens, Felix, Milo, Smokey cannot be recovered because they don't exist in any database records. The user will need to re-acquire these cats through normal gameplay.

However, once this system is implemented:
- Future data loss can be detected within 10 minutes
- Save snapshots will allow rolling back to previous states
- Admin tools will enable recovery from snapshots

## Security Considerations

- Sync health check runs with service role (no user context needed)
- Admin-only access to sync health logs and recovery tools
- Snapshots don't store full game state (only metadata) to save storage
- Rate limiting on recovery endpoints to prevent abuse
