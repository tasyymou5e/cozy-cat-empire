-- Shared secret used by scheduled jobs (pg_cron) to authenticate against the
-- in-app job endpoints. Readable only by service_role / superuser.
CREATE TABLE public.job_cron_secret (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.job_cron_secret TO service_role;

ALTER TABLE public.job_cron_secret ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies: no client role may read or write this table.

INSERT INTO public.job_cron_secret (id) VALUES (true) ON CONFLICT (id) DO NOTHING;