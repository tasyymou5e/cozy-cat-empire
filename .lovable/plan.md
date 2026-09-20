# Move the scheduled jobs and alerts into the app

## First, one correction

Your background jobs and alert emails are **not** broken by publishing. They live on the
backend and keep running on their own schedule whether or not you publish. So nothing is
at risk today.

What *is* worth doing is what you asked for: bringing the jobs that are plain
database work into the app itself, so there is one place to read and change them.

## What moves, and what stays

Move (5 — all plain database/email work):

| Job | Runs |
|---|---|
| Data health check | every 10 minutes |
| Reward payouts | daily, 1 AM |
| Error log cleanup | daily, 3 AM |
| Weekly challenge generation | Sundays, midnight |
| Failure alert email to admins | when a job fails, or on demand |

Stay where they are (12): cat portraits, empire scenes, auth backgrounds, the AI cat
advisor, push notifications, password resets, account deletion, portrait credits, save
recovery, the security scanner, name checks, test reports. These need capabilities the
app's own server can't provide (image generation with streaming, push-message signing,
account administration), so moving them would break them.

## How it works

Each moved job becomes an endpoint inside the app, protected by the same shared secret
the current jobs already use. The schedule keeps calling on the same clock — only the
address it calls changes.

## Order of work (important)

Because the new endpoints only exist on your live site *after* you publish, the switch
happens in two passes:

1. I build the 5 endpoints and leave the current jobs untouched and running.
2. You publish.
3. I point the schedules at the new addresses and confirm each one runs — reward
   payouts, cleanup, health check, and challenge generation — then remove the old
   copies.

Nothing has a gap: the old jobs run right up until the moment the schedule flips.

## Technical detail

- New server routes under `src/routes/api/public/jobs/*`: `sync-health-check`,
  `process-leaderboard-rewards`, `cleanup-error-logs`, `generate-weekly-challenges`,
  `send-admin-alert`.
- Each handler verifies `x-function-secret` against `FUNCTION_SECRET_TOKEN` with a
  length-checked constant-time compare before any work, validates its body with Zod, and
  loads `supabaseAdmin` via `await import("@/integrations/supabase/client.server")`
  inside the handler.
- Logic is ported as-is (same tables, same log rows, same result shapes) so the admin
  Scheduled Jobs page keeps reading the same history.
- `AdminScheduledJobs.tsx` / `AdminSaveRecovery.tsx` manual-trigger buttons switch from
  `supabase.functions.invoke(...)` to `fetch` against the new routes with the secret
  header.
- `pg_cron` entries are re-pointed (step 3) to
  `https://project--e8e83e8c-0c77-43d8-8d1e-9f913ade2ac9.lovable.app/api/public/jobs/*`
  via `run_sql`, then the 5 old functions and their `config.toml` blocks are deleted.
- `docs/CRON_JOBS.md` and the migration classification artifact are updated to match.
