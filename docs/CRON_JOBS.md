# Cron Jobs Documentation

## Active Cron Jobs

### sync-health-check

**Schedule:** Every 10 minutes (`*/10 * * * *`)

**Purpose:** Validates data integrity across all active game saves.

**What it does:**
1. Fetches saves played within last 24 hours
2. Validates each save for data integrity issues
3. Logs results to `sync_health_log` table
4. Logs critical issues to `error_logs`

**Edge Function:** `supabase/functions/sync-health-check/index.ts`

**Setup (run via SQL):**
```sql
SELECT cron.schedule(
  'sync-health-check-10min',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url:='https://bkkluziuyystiqkcpbnd.supabase.co/functions/v1/sync-health-check',
    headers:=jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <anon_key>'
    ),
    body:='{}'::jsonb
  );
  $$
);
```

## Manual Triggers

All cron jobs can be manually triggered from:
- Admin Dashboard → Save Recovery page
- Direct edge function invocation

## Monitoring

View cron job history in Admin Dashboard:
- `/catking/scheduled-jobs` - Job run history
- `/catking/save-recovery` - Sync health logs

## Adding New Cron Jobs

1. Create edge function in `supabase/functions/`
2. Add to `supabase/config.toml` with `verify_jwt = false`
3. Deploy the function
4. Schedule via `cron.schedule()` SQL
