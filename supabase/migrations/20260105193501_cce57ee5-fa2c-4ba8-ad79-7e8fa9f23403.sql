-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can insert their own errors" ON public.error_logs;

-- Create new policy allowing both anonymous and authenticated error logging
CREATE POLICY "Anyone can insert error logs"
ON public.error_logs
FOR INSERT
TO public
WITH CHECK (
  -- Allow anonymous users (null user_id)
  user_id IS NULL 
  OR 
  -- Or authenticated users logging their own errors
  auth.uid() = user_id
);