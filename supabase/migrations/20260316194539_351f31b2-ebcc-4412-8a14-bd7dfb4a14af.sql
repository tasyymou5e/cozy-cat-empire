
-- Create Winston-inspired log level type
CREATE TYPE public.log_level AS ENUM ('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly');

-- Create structured application logs table (Winston-style)
CREATE TABLE public.application_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level log_level NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  label TEXT,  -- Winston service/label concept (e.g., 'CloudSync', 'Auth', 'EdgeFunction')
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  user_id UUID,
  source TEXT DEFAULT 'client',  -- 'client', 'edge_function', 'cron', 'system'
  function_name TEXT,  -- edge function name if applicable
  duration_ms INTEGER,
  request_id TEXT,
  stack_trace TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.application_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read all logs
CREATE POLICY "Admins can view all application logs"
ON public.application_logs FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can insert logs (client-side logging)
CREATE POLICY "Authenticated users can insert logs"
ON public.application_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Service role inserts from edge functions handled automatically

-- Admins can delete logs (cleanup)
CREATE POLICY "Admins can delete application logs"
ON public.application_logs FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Indexes for common queries
CREATE INDEX idx_app_logs_level ON public.application_logs (level);
CREATE INDEX idx_app_logs_timestamp ON public.application_logs (timestamp DESC);
CREATE INDEX idx_app_logs_label ON public.application_logs (label);
CREATE INDEX idx_app_logs_source ON public.application_logs (source);
CREATE INDEX idx_app_logs_level_timestamp ON public.application_logs (level, timestamp DESC);

-- Enable realtime for live log viewing
ALTER PUBLICATION supabase_realtime ADD TABLE public.application_logs;
