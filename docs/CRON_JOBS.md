# Cron Jobs Documentation

## Active Cron Jobs

| Job Name | Schedule | Status |
|----------|----------|--------|
| `generate-weekly-challenges` | Sundays at midnight | ✅ Active |
| `process-leaderboard-rewards` | Daily at 1 AM | ✅ Active |
| `cleanup-error-logs-daily` | Daily at 3 AM | ✅ Active |
| `sync-health-check-10min` | Every 10 minutes | ✅ Active |

---

### sync-health-check-10min

**Schedule:** Every 10 minutes (`*/10 * * * *`)

**Purpose:** Validates data integrity across all active game saves.

**What it does:**
1. Fetches saves played within last 24 hours
2. Validates each save for data integrity issues:
   - Cat count vs space limit
   - Required fields on all cats
   - No duplicate cat IDs
   - Portrait URL validity
3. Logs results to `sync_health_log` table
4. Logs critical issues to `error_logs`

**Edge Function:** `supabase/functions/sync-health-check/index.ts`

**Setup (already scheduled):**
```sql
SELECT cron.schedule(
  'sync-health-check-10min',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url:='https://bkkluziuyystiqkcpbnd.supabase.co/functions/v1/sync-health-check',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer <anon_key>"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);
```

---

### generate-weekly-challenges

**Schedule:** Sundays at midnight (`0 0 * * 0`)

**Purpose:** Auto-generates new weekly challenges for all players.

**Edge Function:** `supabase/functions/generate-weekly-challenges/index.ts`

---

### process-leaderboard-rewards

**Schedule:** Daily at 1 AM (`0 1 * * *`)

**Purpose:** Calculates and distributes leaderboard rewards.

**Edge Function:** `supabase/functions/process-leaderboard-rewards/index.ts`

---

### cleanup-error-logs-daily

**Schedule:** Daily at 3 AM (`0 3 * * *`)

**Purpose:** Cleans up old error logs to prevent database bloat.

**Edge Function:** `supabase/functions/cleanup-error-logs/index.ts`

---

## Manual Triggers

All cron jobs can be manually triggered from:
- Admin Dashboard → Scheduled Jobs page (`/catking/scheduled-jobs`)
- Admin Dashboard → Save Recovery page (`/catking/save-recovery`)
- Direct edge function invocation via curl

## Monitoring

View cron job history in Admin Dashboard:
- `/catking/scheduled-jobs` - Job run history and status
- `/catking/save-recovery` - Sync health logs

## Managing Cron Jobs

### View all scheduled jobs:
```sql
SELECT * FROM cron.job ORDER BY jobid;
```

### View recent job runs:
```sql
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 50;
```

### Unschedule a job:
```sql
SELECT cron.unschedule('job-name-here');
```

## Adding New Cron Jobs

1. Create edge function in `supabase/functions/`
2. Add to `supabase/config.toml` with `verify_jwt = false`
3. Deploy the function
4. Schedule via `cron.schedule()` SQL
5. Document in this file
