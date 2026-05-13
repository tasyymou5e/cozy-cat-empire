
-- tutorial_analytics: require auth, scope user_id
DROP POLICY IF EXISTS "Anyone can insert tutorial analytics" ON public.tutorial_analytics;
CREATE POLICY "Authenticated users can insert tutorial analytics"
  ON public.tutorial_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()));

-- application_logs: scope user_id to caller
DROP POLICY IF EXISTS "Authenticated users can insert logs" ON public.application_logs;
CREATE POLICY "Authenticated users can insert logs"
  ON public.application_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()));

-- sync_health_log: only admins can insert directly; background job uses service role (bypasses RLS)
DROP POLICY IF EXISTS "Authenticated users can insert sync health" ON public.sync_health_log;
CREATE POLICY "Admins can insert sync health"
  ON public.sync_health_log
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
