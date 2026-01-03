-- Drop the overly permissive policy that allows anyone to insert
DROP POLICY IF EXISTS "Authenticated users can insert errors" ON public.error_logs;
DROP POLICY IF EXISTS "Anyone can insert errors" ON public.error_logs;

-- Create new policy requiring authentication and user_id match
CREATE POLICY "Authenticated users can insert their own errors"
  ON public.error_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);