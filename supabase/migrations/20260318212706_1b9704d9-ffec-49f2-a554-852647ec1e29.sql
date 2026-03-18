
CREATE TABLE public.edge_function_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  function_name text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  UNIQUE(identifier, function_name)
);

ALTER TABLE public.edge_function_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access (no public policies = blocked for all clients)
-- Edge functions use SUPABASE_SERVICE_ROLE_KEY which bypasses RLS

-- Add index for fast lookups
CREATE INDEX idx_edge_fn_rate_limits_lookup ON public.edge_function_rate_limits(identifier, function_name);
