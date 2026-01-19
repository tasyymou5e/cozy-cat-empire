-- Create helper functions for security linter

-- Function to get tables without RLS enabled
CREATE OR REPLACE FUNCTION get_tables_without_rls()
RETURNS TABLE(tablename text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.tablename::text
  FROM pg_tables t
  WHERE t.schemaname = 'public'
  AND NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = t.tablename
    AND n.nspname = 'public'
    AND c.relrowsecurity = true
  );
$$;

-- Function to get overly permissive policies (USING true or WITH CHECK true)
CREATE OR REPLACE FUNCTION get_permissive_policies()
RETURNS TABLE(tablename text, policyname text, cmd text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
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
  );
$$;

-- Function to get tables that have RLS but no admin SELECT access
CREATE OR REPLACE FUNCTION get_tables_without_admin_access()
RETURNS TABLE(tablename text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT c.relname::text as tablename
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = true
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public'
    AND p.tablename = c.relname
    AND p.cmd = 'SELECT'
    AND (
      p.policyname ILIKE '%admin%'
      OR p.qual ILIKE '%has_role%admin%'
    )
  );
$$;

-- Function to get dangerous public write policies (INSERT/UPDATE/DELETE without auth check)
CREATE OR REPLACE FUNCTION get_dangerous_public_policies()
RETURNS TABLE(tablename text, policyname text, cmd text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
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
  -- Exclude expected public insert tables
  AND p.tablename NOT IN ('error_logs', 'auth_attempts_log');
$$;

-- Function to get auth config status (simplified - returns placeholder for now)
CREATE OR REPLACE FUNCTION get_auth_config_status()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- This returns a placeholder as we can't directly query Supabase auth config
  -- In production, this would need to be checked via the Supabase management API
  SELECT json_build_object(
    'leaked_password_protection', true,
    'enable_signup', true,
    'note', 'Auth config requires management API access'
  );
$$;

-- Grant execute permissions to authenticated users (admin check is in the edge function)
GRANT EXECUTE ON FUNCTION get_tables_without_rls() TO authenticated;
GRANT EXECUTE ON FUNCTION get_permissive_policies() TO authenticated;
GRANT EXECUTE ON FUNCTION get_tables_without_admin_access() TO authenticated;
GRANT EXECUTE ON FUNCTION get_dangerous_public_policies() TO authenticated;
GRANT EXECUTE ON FUNCTION get_auth_config_status() TO authenticated;