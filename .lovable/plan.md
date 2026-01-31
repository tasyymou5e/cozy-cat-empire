
# Admin Portal User Management - Issue Analysis & Fix Plan

## Executive Summary

**Problem**: When an admin modifies a user's money/inventory through the Admin Portal's User Management feature, the operation appears successful (shows toast "Inventory Updated" and logs to `admin_activity_log`) but the **actual database changes are silently rejected due to missing RLS policies**.

**Affected User**: Rebecca Roos (rebeccaroos@live.com)
- User ID: `7ddf185d-137a-436a-8a55-0c1e5e5d74f1`
- Current Money: $150 (unchanged despite multiple admin modification attempts)
- Admin Activity Log shows 12+ modification attempts from $150 → $20,000/$50,000/$60,000/$80,000

---

## Root Cause Analysis

### The Bug

The `game_saves` table has an **RLS policy gap**:

| Policy | Command | Expression |
|--------|---------|------------|
| "Admins can view all game saves" | SELECT | `has_role(auth.uid(), 'admin'::app_role)` |
| "Users can insert their own saves" | INSERT | `auth.uid() = user_id` |
| "Users can update their own saves" | UPDATE | `auth.uid() = user_id` |
| "Users can view their own saves" | SELECT | `auth.uid() = user_id` |

**Missing**: There is no `UPDATE` policy for admins on `game_saves`.

### Why It Appears Successful

In `PlayerInventoryEditor.tsx` (lines 148-167):

```typescript
const { error } = await supabase
  .from('game_saves')
  .update({ game_state: updatedGameState as Json })
  .eq('user_id', userId);

if (error) throw error;  // ← Only checks for explicit errors

// Activity is logged AFTER the update (which silently failed)
await logActivity({...});

toast({
  title: 'Inventory Updated',  // ← Shows success even though 0 rows updated
  description: 'Player inventory has been modified successfully.',
});
```

**Supabase behavior**: When RLS blocks an UPDATE, it returns `{ error: null, data: null, count: 0 }` - no error is thrown, but zero rows are affected.

---

## Complete Admin User Management Documentation

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN USER MANAGEMENT                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  AdminUsers.tsx                                                  │
│  └── User list with search, pagination, bulk actions             │
│      └── UserDetailModal.tsx                                     │
│          ├── Overview Tab (read-only stats)                      │
│          ├── Inventory Tab                                       │
│          │   └── PlayerInventoryEditor.tsx ⚠️ BROKEN             │
│          │       ├── Money editing          ❌ RLS blocks UPDATE │
│          │       ├── Resources editing      ❌ RLS blocks UPDATE │
│          │       ├── Portrait Credits       ✅ Works (has policy)│
│          │       └── Game Reset             ❌ RLS blocks UPDATE │
│          ├── Profile Tab                                         │
│          │   └── ProfileEditor.tsx          ✅ Works (has policy)│
│          ├── Cats Tab (read-only)                                │
│          ├── Trades Tab (read-only)                              │
│          ├── Gifts Tab (read-only)                               │
│          │   └── AdminGiftCatDialog.tsx     ✅ Works (has policy)│
│          └── Errors Tab (read-only)                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Working Features

| Feature | Table | Why It Works |
|---------|-------|--------------|
| Profile editing | `profiles` | Has admin UPDATE policy |
| Cat gifting | `cat_gifts` | Has admin INSERT/UPDATE policies |
| Portrait credits | `player_portrait_credits` | Has admin ALL policy |
| Role changes | `user_roles` | Has admin INSERT/DELETE policies |
| Suspension | `profiles` | Has admin UPDATE policy |
| User deletion | `profiles` (edge function) | Uses service role |

### Broken Features

| Feature | Table | Why It Fails |
|---------|-------|--------------|
| Money modification | `game_saves` | NO admin UPDATE policy |
| Resources modification | `game_saves` | NO admin UPDATE policy |
| Game reset | `game_saves` | NO admin UPDATE policy |
| Corrupted save repair | `game_saves` | NO admin UPDATE policy |

---

## Fix Plan

### Phase 1: Add Missing RLS Policy (Database)

Add an UPDATE policy for admins on the `game_saves` table:

```sql
CREATE POLICY "Admins can update game saves"
  ON public.game_saves
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));
```

### Phase 2: Improve Error Detection (Code)

Update `PlayerInventoryEditor.tsx` to verify the update actually succeeded:

**Current code (broken)**:
```typescript
const { error } = await supabase
  .from('game_saves')
  .update({ game_state: updatedGameState as Json })
  .eq('user_id', userId);

if (error) throw error;
```

**Fixed code**:
```typescript
const { error, count } = await supabase
  .from('game_saves')
  .update({ game_state: updatedGameState as Json })
  .eq('user_id', userId)
  .select();  // Returns the updated row(s)

if (error) throw error;
if (!count || count === 0) {
  throw new Error('Update failed - no rows were affected. Check admin permissions.');
}
```

Alternatively, use `.select()` and check if data is returned:
```typescript
const { data, error } = await supabase
  .from('game_saves')
  .update({ game_state: updatedGameState as Json })
  .eq('user_id', userId)
  .select()
  .single();

if (error) throw error;
if (!data) {
  throw new Error('Update blocked - insufficient permissions');
}
```

### Phase 3: Fix Game Reset Function

Apply the same pattern to `handleResetGame` function (lines 274-347).

### Phase 4: Fix Corrupted Saves Repair

Apply the same pattern to `useAdminCorruptedSaves.ts` repair functions.

### Phase 5: Review Other Admin Tables

Consider adding admin UPDATE policies to:
- `daily_objectives_progress` - if admins need to reset objectives
- `player_friends` - if admins need to manage friendships  
- `coop_challenge_invites` - if admins need to manage invites
- `user_roles` - already has INSERT/DELETE, may need UPDATE

---

## Files to Modify

| File | Change |
|------|--------|
| **Database Migration** | Add admin UPDATE policy on `game_saves` |
| `src/components/admin/PlayerInventoryEditor.tsx` | Add row count verification |
| `src/hooks/admin/useAdminCorruptedSaves.ts` | Add row count verification |

---

## Verification Steps

After fix is applied:

1. Open Admin Portal → User Management
2. Search for "Rebecca Roos"
3. Click View (eye icon) to open UserDetailModal
4. Go to "Inventory" tab
5. Change money from 150 to 80000
6. Enter reason and click "Save Changes"
7. Verify toast shows success
8. Close and reopen modal - money should show 80000
9. Check database: `SELECT game_state->>'money' FROM game_saves WHERE user_id = '7ddf185d-137a-436a-8a55-0c1e5e5d74f1'`

---

## Related Tables Needing Admin UPDATE Policies

Based on the RLS analysis, these tables have admin SELECT but no admin UPDATE:

| Table | Needs Policy? | Reason |
|-------|---------------|--------|
| `game_saves` | **YES** | Critical for inventory editing |
| `admin_activity_log` | No | Intentional (audit immutable) |
| `ai_usage_log` | No | Intentional (log immutable) |
| `auth_attempts_log` | No | Intentional (log immutable) |
| `daily_objectives_progress` | Maybe | For objective resets |
| `gallery_photos` | No | Low admin need |
| `leaderboard_snapshots` | No | Historical data |
| `player_activity_log` | No | Intentional (log immutable) |
| `player_friends` | Maybe | For friendship management |
| `coop_challenge_invites` | Maybe | For invite management |
| `push_subscriptions` | No | Low admin need |
| `rank_history` | No | Historical data |
| `retired_cats` | No | Low admin need |
| `rewards_processing_log` | No | Intentional (log immutable) |
| `save_snapshots` | No | Backup data |
| `security_scan_history` | No | Intentional (log immutable) |
| `sync_health_log` | No | Intentional (log immutable) |
| `tutorial_analytics` | No | Intentional (log immutable) |
| `user_roles` | Maybe | For role updates (currently delete+insert) |

---

## Summary

**Root Cause**: Missing RLS UPDATE policy for admins on `game_saves` table.

**Impact**: All money/resource/game reset modifications from admin portal silently fail.

**Fix**: 
1. Add RLS policy: `"Admins can update game saves"` with `has_role(auth.uid(), 'admin'::app_role)`
2. Update code to verify row count after updates
3. Update documentation
