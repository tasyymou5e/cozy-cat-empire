

# Cat Farm Data Integrity Audit & Cleanup Plan

## Executive Summary

After a comprehensive code and database audit, I identified **several race condition safeguards already in place**, along with **data sync issues** and **missing monitoring infrastructure** that need attention.

---

## Current State Assessment

### Existing Race Condition Safeguards (Already Working)

| Safeguard | Location | Status |
|-----------|----------|--------|
| `isMounted` ref guards | CatCustomization, CatCollection, Empire, CatRelationships pages | Active |
| `subscribedUserId` capture | usePlayerProfile, useCatGifts, useTrading | Active |
| `isLoadedRef` cloud load gate | useCloudSave | Active |
| `updateQueueRef` serialization | useWeeklyChallenges | Active |
| Empty cats save blocking | useCloudSave lines 155-166 | Active |
| Auto-save loading gate | useCloudHandlers line 109 | Active |

### Data Integrity Issues Found

| Issue | Severity | Affected Records |
|-------|----------|------------------|
| Profile vs Stats display_name mismatch | Medium | 1 user (Admin profile shows "Admin" but player_stats shows "Not BOB") |
| Missing player_stats records | Low | 2 users have profiles but no stats (keira, Rebecca Roos) |
| sync-health-check cron job not scheduled | High | System monitoring not running |
| Empty save_snapshots table | High | Recovery system created but never captured data |
| Empty sync_health_log table | High | Health monitoring never ran |

### Database Table Counts

| Table | Records |
|-------|---------|
| profiles | 5 |
| game_saves | 5 |
| player_stats | 3 (should be 5) |
| save_snapshots | 0 (should have data) |
| sync_health_log | 0 (cron never ran) |

---

## Root Causes Identified

### 1. Sync Health Cron Never Scheduled
The `sync-health-check-10min` cron job was documented but never actually registered with pg_cron. The existing jobs are:
- `generate-weekly-challenges` (Sundays at midnight)
- `process-leaderboard-rewards` (daily at 1 AM)
- `cleanup-error-logs-daily` (daily at 3 AM)

### 2. Save Snapshots Not Being Created
The snapshot insertion code in `useCloudSave.ts` (lines 201-240) uses a fire-and-forget pattern with `.then()`. If the edge function deploy failed or the table wasn't properly created, snapshots would silently fail.

### 3. Profile/Stats Sync Gap
When a profile's display_name is updated via `usePlayerProfile`, it does NOT propagate to `player_stats`. The `syncPlayerStats` function in `useGlobalLeaderboard.ts` only runs during cloud saves, not profile updates.

### 4. Missing Real-time Guards in useFriends
Unlike `useCatGifts` and `useTrading`, the `useFriends` hook (lines 256-287) doesn't capture `subscribedUserId` for real-time subscription guards. This could cause stale data if a user logs out and another logs in quickly.

---

## Implementation Plan

### Phase 1: Activate Monitoring Infrastructure (Priority: Critical)

Schedule the sync-health-check cron job that was created but never activated:

```sql
SELECT cron.schedule(
  'sync-health-check-10min',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url:='https://bkkluziuyystiqkcpbnd.supabase.co/functions/v1/sync-health-check',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJra2x1eml1eXlzdGlxa2NwYm5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNzM3NTcsImV4cCI6MjA4Mjk0OTc1N30.Ru-rZv9TpwaecoHsyypnC3E9hFYQXBfE04-NsT5uucg"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);
```

### Phase 2: Fix Profile-to-Stats Sync

Modify `usePlayerProfile.ts` to trigger a stats sync when profile is updated:

```typescript
// After successful profile update, also update player_stats display_name
const updateProfile = useCallback(async (...) => {
  // ... existing update logic ...
  
  // Sync to player_stats table
  await supabase
    .from('player_stats')
    .update({ display_name: displayName, avatar_emoji: avatarEmoji })
    .eq('user_id', userId);
});
```

### Phase 3: Add Missing Race Condition Guard to useFriends

Add `subscribedUserId` capture pattern to prevent stale real-time updates:

```typescript
useEffect(() => {
  if (!userId) return;
  
  // Capture userId at subscription time
  const subscribedUserId = userId;
  
  const channel = supabase
    .channel(`friends-${userId}`)
    .on('postgres_changes', {...}, () => {
      // Validate user context
      if (subscribedUserId !== userId) {
        console.log('[FriendsSync] Ignoring stale update');
        return;
      }
      fetchFriends();
    })
    // ...
});
```

### Phase 4: Data Cleanup Queries

**Fix display_name mismatch:**
```sql
UPDATE player_stats ps
SET display_name = p.display_name,
    avatar_emoji = p.avatar_emoji
FROM profiles p
WHERE ps.user_id = p.id
AND (ps.display_name != p.display_name OR ps.avatar_emoji != p.avatar_emoji);
```

**Create missing player_stats records:**
```sql
INSERT INTO player_stats (user_id, display_name, avatar_emoji)
SELECT p.id, p.display_name, COALESCE(p.avatar_emoji, '😺')
FROM profiles p
LEFT JOIN player_stats ps ON p.id = ps.user_id
WHERE ps.id IS NULL;
```

### Phase 5: Improve Snapshot Creation Reliability

Add error logging to the snapshot insertion in `useCloudSave.ts`:

```typescript
supabase.from('save_snapshots').insert({...})
  .then(({ error: snapError }) => {
    if (snapError) {
      console.error('[CloudSync] Snapshot insert failed:', snapError.message);
      // Log to error_logs for monitoring
      logErrorToDatabase({
        error_type: 'snapshot_insert_failed',
        error_message: snapError.message,
        user_id: userId,
      });
    }
  });
```

### Phase 6: Add Admin Dashboard Sync Health Widget

Create a dashboard card showing:
- Last sync health check time
- Number of saves with issues
- Quick link to `/catking/save-recovery`

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/usePlayerProfile.ts` | Add player_stats sync on profile update |
| `src/hooks/useFriends.ts` | Add subscribedUserId guard to real-time subscription |
| `src/hooks/useCloudSave.ts` | Add error logging for failed snapshots |
| `src/pages/admin/AdminDashboard.tsx` | Add sync health status card |
| `docs/CRON_JOBS.md` | Update with actual scheduled job list |

---

## Database Operations Required

1. **Schedule sync-health-check cron** (SQL execution)
2. **Fix profile/stats display_name sync** (SQL UPDATE)
3. **Create missing player_stats** (SQL INSERT)

---

## Testing Strategy

1. Deploy sync-health-check edge function (already deployed)
2. Schedule cron job
3. Wait 10 minutes and verify `sync_health_log` gets entries
4. Update a profile and verify `player_stats` updates
5. Create a new user and verify `player_stats` record is created
6. Verify save snapshots are being captured on cloud saves

---

## Long-Term Recommendations

1. **Add a database trigger** to auto-sync profile updates to player_stats
2. **Create an admin alert system** for critical sync health issues
3. **Add snapshot verification** in the auto-save success callback
4. **Consider using database transactions** for multi-table updates

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Cron job overwhelming database | 24-hour lookback window limits scope |
| Profile sync causing duplicate updates | Idempotent UPDATE with WHERE clause |
| Snapshot pruning deleting needed data | Keep 10 per user, sufficient for recovery |

---

## Summary

The codebase has good race condition prevention patterns but the monitoring and cleanup infrastructure created recently was never fully activated. This plan focuses on:

1. Activating the existing monitoring (cron job)
2. Fixing the profile-to-stats sync gap
3. Adding one missing race condition guard
4. Running cleanup queries for existing data
5. Improving error visibility for snapshot failures

