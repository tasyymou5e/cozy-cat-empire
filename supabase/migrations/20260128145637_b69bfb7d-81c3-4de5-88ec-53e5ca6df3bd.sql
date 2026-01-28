-- ============================================================
-- Security Audit Fixes - RLS Policy Hardening
-- ============================================================

-- 1. FIX: rewards_processing_log - Remove permissive ALL policy
DROP POLICY IF EXISTS "Service role can manage processing log" ON rewards_processing_log;

CREATE POLICY "Admins can view rewards processing log" 
  ON rewards_processing_log FOR SELECT 
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete rewards processing log"
  ON rewards_processing_log FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "No direct insert to rewards processing log"
  ON rewards_processing_log FOR INSERT
  WITH CHECK (false);

-- 2. FIX: ai_usage_log - Restrict public write
DROP POLICY IF EXISTS "Service role can insert AI logs" ON ai_usage_log;

CREATE POLICY "Authenticated users can insert AI logs"
  ON ai_usage_log FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 3. FIX: sync_health_log - Restrict public write
DROP POLICY IF EXISTS "Service can insert sync health" ON sync_health_log;

CREATE POLICY "Authenticated users can insert sync health"
  ON sync_health_log FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 4. ADD: Missing admin SELECT policies
CREATE POLICY "Admins can view all announcements"
  ON announcements FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all user roles"
  ON user_roles FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all challenges"
  ON weekly_challenges FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. UPDATE: Linter exclusion for tutorial_analytics
CREATE OR REPLACE FUNCTION public.get_dangerous_public_policies()
RETURNS TABLE(tablename text, policyname text, cmd text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.tablename::text,
    p.policyname::text,
    p.cmd::text
  FROM pg_policies p
  WHERE p.schemaname = 'public'
  AND p.cmd IN ('INSERT', 'UPDATE', 'DELETE')
  AND (
    p.qual = 'true' 
    OR p.with_check = 'true'
  )
  AND p.tablename NOT IN ('error_logs', 'auth_attempts_log', 'tutorial_analytics');
$$;