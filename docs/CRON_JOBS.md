# Cron Jobs Documentation

## Where the jobs live

The five job workloads now run **inside the TanStack Start app** as server routes under
`src/routes/api/public/jobs/*`. Each one:

- verifies the `x-function-secret` header with a length-checked constant-time compare
  against either `FUNCTION_SECRET_TOKEN` (env) or `public.job_cron_secret.token`
  (database row, used by `pg_cron`, which cannot read worker env vars) before doing any
  work,

- validates its request body with Zod (only `send-admin-alert` takes a body),
- loads `supabaseAdmin` inside the handler via
  `await import('@/integrations/supabase/client.server')`.

The job logic itself lives in `src/lib/jobs/*.server.ts` so the HTTP endpoints and the
admin manual triggers share exactly one implementation.

| Job | Schedule | Endpoint | Logic |
|---|---|---|---|
| `sync-health-check-10min` | Every 10 minutes (`*/10 * * * *`) | `/api/public/jobs/sync-health-check` | `src/lib/jobs/syncHealthCheck.server.ts` |
| `process-leaderboard-rewards` | Daily at 1 AM (`0 1 * * *`) | `/api/public/jobs/process-leaderboard-rewards` | `src/lib/jobs/leaderboardRewards.server.ts` |
| `cleanup-error-logs-daily` | Daily at 3 AM (`0 3 * * *`) | `/api/public/jobs/cleanup-error-logs` | `src/lib/jobs/cleanupErrorLogs.server.ts` |
| `generate-weekly-challenges` | Sundays at midnight (`0 0 * * 0`) | `/api/public/jobs/generate-weekly-challenges` | `src/lib/jobs/weeklyChallenges.server.ts` |
| Admin failure/test alert | On job failure or on demand | `/api/public/jobs/send-admin-alert` | `src/lib/jobs/adminAlert.server.ts` |

Base URL for schedules (immutable across renames):
`https://project--e8e83e8c-0c77-43d8-8d1e-9f913ade2ac9.lovable.app`

---

### sync-health-check

Validates data integrity across recently played cloud saves (last 24 h, max 500 saves):
cat count vs. space limit, required cat fields, duplicate cat IDs, health/grade bounds,
negative money. Writes a summary row to `sync_health_log` and critical findings to
`error_logs`.

### process-leaderboard-rewards

For each ended daily/weekly/monthly period, creates top-3 rewards per category
(`wins`, `cats`, `breeding`, `wealth`, `achievements`) in `leaderboard_rewards` and records
the period in `rewards_processing_log` so it is never processed twice.

### cleanup-error-logs

Deletes rows older than 30 days from `error_logs`, `application_logs` and
`player_activity_log`.

### generate-weekly-challenges

If the current week has no challenges yet: deactivates expired ones and inserts a fresh
set (2 easy, 2 medium, 1 hard) into `weekly_challenges`.

### send-admin-alert

Emails every admin (via Resend) about a failed or test job. Requires `RESEND_API_KEY`.

---

## Scheduling / re-pointing

`pg_cron` calls the endpoints and reads the shared secret straight out of the database, so
no secret value is ever written into a schedule definition:

```sql
SELECT cron.schedule(
  'sync-health-check-10min',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--e8e83e8c-0c77-43d8-8d1e-9f913ade2ac9.lovable.app/api/public/jobs/sync-health-check',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-function-secret', (SELECT token FROM public.job_cron_secret WHERE id)
    ),
    body := '{}'::jsonb
  );
  $$
);
```

`public.job_cron_secret` holds a single random token, has RLS enabled with **no policies**
and is granted only to `service_role`, so no client role can read it.

All four schedules point at the in-app endpoints. The endpoints only exist on the live site
once the app is published, so a publish must follow any change to the job auth code.


## Manual triggers

Admins trigger jobs from the dashboard without any shared secret — the UI calls the
admin-gated server functions in `src/lib/jobs/triggerJob.functions.ts`, which verify the
caller's `admin` role via `has_role` before running the job:

- `/catking/scheduled-jobs` — run any of the four jobs, send a test alert email
- `/catking/save-recovery` — run the data health check

## Monitoring

- `/catking/scheduled-jobs` — job run history and status (`cron.job_run_details`)
- `/catking/save-recovery` — sync health logs

## Managing cron jobs

```sql
SELECT * FROM cron.job ORDER BY jobid;                                  -- list
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 50;    -- history
SELECT cron.unschedule('job-name-here');                                -- remove
```

## Adding a new job

1. Add the logic to `src/lib/jobs/<name>.server.ts`.
2. Add a route in `src/routes/api/public/jobs/<name>.ts` that verifies the shared secret.
3. Add it to the admin trigger server function if it needs a manual button.
4. Publish, then schedule via `cron.schedule()`.
5. Document it here.
