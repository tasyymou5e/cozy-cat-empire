-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can insert errors" ON public.error_logs;

-- Create a more restrictive policy for authenticated users only
CREATE POLICY "Authenticated users can insert errors"
  ON public.error_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);