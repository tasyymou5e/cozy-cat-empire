
-- Fix ai_usage_log: constrain INSERT to own user_id
DROP POLICY IF EXISTS "Authenticated users can insert AI logs" ON public.ai_usage_log;
CREATE POLICY "Authenticated users can insert AI logs"
ON public.ai_usage_log FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()));

-- Fix player_activity_log: allow user to read own entries
CREATE POLICY "Users can view their own activity"
ON public.player_activity_log FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Fix admin_rate_limits: require admin role on UPDATE/DELETE
DROP POLICY IF EXISTS "Admins can delete their own rate limits" ON public.admin_rate_limits;
CREATE POLICY "Admins can delete their own rate limits"
ON public.admin_rate_limits FOR DELETE TO authenticated
USING (auth.uid() = admin_user_id AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update their own rate limits" ON public.admin_rate_limits;
CREATE POLICY "Admins can update their own rate limits"
ON public.admin_rate_limits FOR UPDATE TO authenticated
USING (auth.uid() = admin_user_id AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth.uid() = admin_user_id AND has_role(auth.uid(), 'admin'::app_role));
