

# Security Audit Refinement Plan

## Problem Analysis

The security linter is flagging issues that are either legitimate by design or not correctly detecting existing policies:

### Issue 1: Permissive INSERT Policies
| Table | Current Policy | Why It's Legitimate |
|-------|---------------|---------------------|
| `auth_attempts_log` | Anyone can INSERT | Must log failed login attempts from unauthenticated users |
| `tutorial_analytics` | Anyone can INSERT | Must track anonymous users in tutorial |

**Solution:** Update `get_permissive_policies` function to exclude these tables from INSERT warnings.

### Issue 2: Missing Admin SELECT Access
| Table | Current Situation | Why It's Flagged |
|-------|------------------|------------------|
| `admin_notifications` | Has `ALL` policy for admins | Linter only checks `SELECT` command, not `ALL` |
| `game_config` | Has public `SELECT` policy | No explicit admin policy (admins can read via public) |
| `player_stats` | Has public `SELECT` policy | No explicit admin policy (admins can read via public) |

**Solution:** Update `get_tables_without_admin_access` function to:
1. Recognize `ALL` policies as covering SELECT
2. Exclude intentionally public tables

---

## Implementation

### Database Migration

```sql
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
```

---

## Expected Results After Fix

| Warning Category | Before | After |
|-----------------|--------|-------|
| Permissive INSERT Policies | 2 tables | 0 tables |
| Missing Admin SELECT | 3 tables | 0 tables |

---

## Technical Notes

1. **Legitimate Public INSERTs**:
   - `auth_attempts_log` - Logs login failures before authentication
   - `tutorial_analytics` - Tracks anonymous tutorial users
   - `error_logs` - Already excluded in dangerous policies check

2. **Intentionally Public Tables**:
   - `game_config` - Configuration readable by all players
   - `player_stats` - Leaderboard data is public
   - `public_leaderboard` - View specifically designed for public access

3. **ALL Policy Recognition**:
   - PostgreSQL `ALL` command covers SELECT, INSERT, UPDATE, DELETE
   - `admin_notifications` correctly has admin access via ALL policy

---

## Files to Modify

| Type | Description |
|------|-------------|
| Database Migration | Update two SQL functions to reduce false positives |

