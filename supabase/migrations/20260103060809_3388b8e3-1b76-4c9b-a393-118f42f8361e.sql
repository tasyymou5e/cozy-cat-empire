-- Create AI usage log table for tracking AI API calls
CREATE TABLE public.ai_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  function_name text NOT NULL,
  model text NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'error', 'rate_limited', 'credits_depleted')),
  tokens_used integer,
  execution_time_ms integer,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

-- Admins can view all AI logs
CREATE POLICY "Admins can view AI logs"
ON public.ai_usage_log FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow service role/edge functions to insert logs
CREATE POLICY "Service role can insert AI logs"
ON public.ai_usage_log FOR INSERT
WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_ai_usage_log_created_at ON public.ai_usage_log(created_at DESC);
CREATE INDEX idx_ai_usage_log_function_name ON public.ai_usage_log(function_name);
CREATE INDEX idx_ai_usage_log_status ON public.ai_usage_log(status);