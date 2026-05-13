
-- sync_health_log: block client inserts entirely; service role bypasses RLS
DROP POLICY IF EXISTS "Admins can insert sync health logs" ON public.sync_health_log;
DROP POLICY IF EXISTS "Authenticated users can insert sync health" ON public.sync_health_log;
CREATE POLICY "Block client inserts on sync_health_log"
ON public.sync_health_log FOR INSERT TO authenticated
WITH CHECK (false);

-- application_logs: allow users to read their own entries
CREATE POLICY "Users can view their own application logs"
ON public.application_logs FOR SELECT TO authenticated
USING (auth.uid() = user_id);
