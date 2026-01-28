
# Security Audit Fix Plan

## Overview

The security linter identified 4 categories of issues. This plan addresses each while maintaining the existing tech stack and ensuring edge functions continue to work (they use service role key which bypasses RLS).

---

## Issue Analysis

### Understanding the Context

| Table | Current Issue | Root Cause | Safe to Restrict? |
|-------|---------------|------------|-------------------|
| `rewards_processing_log` | ALL policy with `USING(true)` | Edge function logging | Yes - service role bypasses RLS |
| `ai_usage_log` | Public INSERT | Edge function logging | Yes - service role bypasses RLS |
| `sync_health_log` | Public INSERT | Edge function logging | Yes - service role bypasses RLS |
| `tutorial_analytics` | Public INSERT | Anonymous user tracking | No - needs public access |
| `auth_attempts_log` | Public INSERT | Login failure logging | No - needs public access (already excluded) |

---

## Solution: Database Migration

### 1. Fix `rewards_processing_log` (Permissive ALL Policy)

**Problem**: `Service role can manage processing log` uses `USING(true)` for ALL operations

**Fix**: Replace with specific policies that deny regular users but allow admin viewing

```sql
-- Drop overly permissive policy
DROP POLICY IF EXISTS "Service role can manage processing log" ON rewards_processing_log;

-- Add admin-only policies (service role bypasses RLS anyway)
CREATE POLICY "Admins can view rewards processing log" 
  ON rewards_processing_log FOR SELECT 
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete rewards processing log"
  ON rewards_processing_log FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Deny regular user INSERT (edge function uses service role, bypasses RLS)
CREATE POLICY "No direct insert to rewards processing log"
  ON rewards_processing_log FOR INSERT
  WITH CHECK (false);
```

### 2. Fix `ai_usage_log` (Public Write)

**Problem**: `Service role can insert AI logs` allows anyone to insert

**Fix**: Restrict to authenticated users minimum (edge function bypasses RLS)

```sql
-- Drop permissive policy
DROP POLICY IF EXISTS "Service role can insert AI logs" ON ai_usage_log;

-- Restrict insert to authenticated users or deny completely
-- Service role from edge functions still bypasses RLS
CREATE POLICY "Authenticated users can insert AI logs"
  ON ai_usage_log FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
```

### 3. Fix `sync_health_log` (Public Write)

**Problem**: `Service can insert sync health` allows anyone to insert

**Fix**: Same approach as ai_usage_log

```sql
-- Drop permissive policy  
DROP POLICY IF EXISTS "Service can insert sync health" ON sync_health_log;

-- Restrict to authenticated (service role bypasses anyway)
CREATE POLICY "Authenticated users can insert sync health"
  ON sync_health_log FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
```

### 4. Add Missing Admin SELECT Policies

For tables flagged as missing admin SELECT access:

```sql
-- announcements: Admin needs to see inactive announcements too
CREATE POLICY "Admins can view all announcements"
  ON announcements FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- user_roles: Admin needs to manage all roles
CREATE POLICY "Admins can view all user roles"
  ON user_roles FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- weekly_challenges: Admin needs to see inactive challenges
CREATE POLICY "Admins can view all challenges"
  ON weekly_challenges FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- rewards_processing_log: Already added above
-- game_config: Already has "Anyone can read" (acceptable)
-- player_stats: Already has "Authenticated users can view leaderboard" (acceptable)
-- admin_notifications: Already has "Admins can manage notifications" for ALL
```

### 5. Update Security Linter Exclusions

**Problem**: `tutorial_analytics` legitimately needs public INSERT for anonymous users

**Fix**: Add to the exclusion list in `get_dangerous_public_policies` function

```sql
-- Update the function to exclude tutorial_analytics
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
  -- Exclude expected public insert tables
  AND p.tablename NOT IN ('error_logs', 'auth_attempts_log', 'tutorial_analytics');
$$;
```

---

## Complete Migration SQL

```sql
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
```

---

## Why This Won't Break the Site

| Component | Reason It Still Works |
|-----------|----------------------|
| **Edge Functions** | Use `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS entirely |
| **Tutorial Analytics** | Kept as public INSERT, excluded from linter |
| **Auth Attempts Log** | Already excluded in linter, unchanged |
| **Admin Dashboard** | New admin SELECT policies enable full visibility |
| **Regular Users** | No change to user-facing features |

---

## Expected Linter Results After Fix

| Issue | Before | After |
|-------|--------|-------|
| Permissive ALL Policies | 1 table | 0 tables |
| Permissive INSERT Policies | 4 tables | 2 tables (auth_attempts_log, tutorial_analytics - legitimate) |
| Missing Admin SELECT | 7 tables | 2 tables (game_config, player_stats - intentionally public) |
| Public Write Policies | 3 tables | 0 tables (tutorial_analytics excluded) |

---

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| New Migration | Create | All RLS policy fixes in single migration |

---

## Technical Notes

1. **Service Role Bypass**: Edge functions using `SUPABASE_SERVICE_ROLE_KEY` bypass all RLS policies, so restricting INSERT policies won't affect them

2. **`auth.role() = 'authenticated'`**: This check ensures the request comes from a logged-in user via the anon key, not an anonymous request

3. **`WITH CHECK (false)`**: This completely blocks INSERT for regular users - only service role can insert

4. **Multiple SELECT Policies**: PostgreSQL RLS allows multiple SELECT policies - they're combined with OR, so adding admin SELECT doesn't remove existing user access
