-- Create rewards processing log table to track processed periods
CREATE TABLE public.rewards_processing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_type TEXT NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now(),
  rewards_created INTEGER DEFAULT 0,
  UNIQUE(period_type, period_end)
);

-- Enable RLS
ALTER TABLE public.rewards_processing_log ENABLE ROW LEVEL SECURITY;

-- Only allow the service role to insert/select (for edge function)
CREATE POLICY "Service role can manage processing log"
  ON public.rewards_processing_log
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Enable pg_cron and pg_net extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;