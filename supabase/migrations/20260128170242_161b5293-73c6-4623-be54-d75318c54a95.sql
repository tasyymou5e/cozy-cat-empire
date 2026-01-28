-- ============================================================
-- Security Linter Refinement - Reduce False Positives
-- ============================================================

-- 1. Update get_permissive_policies to exclude legitimate public INSERT tables
CREATE OR REPLACE FUNCTION public.get_permissive_policies()
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
  AND (
    p.qual = 'true' 
    OR p.with_check = 'true'
    OR p.qual LIKE '%true%'
  )
  -- Exclude tables that legitimately need public INSERT
  AND NOT (
    p.cmd = 'INSERT' 
    AND p.tablename IN ('auth_attempts_log', 'tutorial_analytics', 'error_logs')
  );
$$;

-- 2. Update get_tables_without_admin_access to recognize ALL policies 
--    and exclude intentionally public tables
CREATE OR REPLACE FUNCTION public.get_tables_without_admin_access()
RETURNS TABLE(tablename text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT c.relname::text as tablename
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = true
  -- Exclude intentionally public tables (admins can read via public policies)
  AND c.relname NOT IN ('game_config', 'player_stats', 'public_leaderboard')
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public'
    AND p.tablename = c.relname
    -- Check for SELECT or ALL command (ALL includes SELECT)
    AND p.cmd IN ('SELECT', 'ALL')
    AND (
      p.policyname ILIKE '%admin%'
      OR p.qual ILIKE '%has_role%admin%'
    )
  );
$$;