

# Admin Dashboard Data Sync Issues - Fix Plan

## Issues Identified

### 1. Admin ProfileEditor Missing player_stats Sync

**Location:** `src/components/admin/ProfileEditor.tsx` (lines 314-321)

**Problem:** When an admin updates a user's profile, it only writes to the `profiles` table but does NOT sync `display_name` and `avatar_emoji` to the `player_stats` table. This is inconsistent with the user-facing `usePlayerProfile.ts` which DOES sync both tables.

**Evidence from code:**
```typescript
// ProfileEditor.tsx - ONLY updates profiles table
const { error: updateError } = await supabase
  .from('profiles')
  .update({
    display_name: trimmedName,
    avatar_emoji: avatarEmoji,
    username: trimmedUsername || null,
  })
  .eq('id', userId);
```

vs `usePlayerProfile.ts`:
```typescript
// User's hook syncs BOTH tables
supabase
  .from('player_stats')
  .update({ display_name: displayName, avatar_emoji: avatarEmoji })
  .eq('user_id', userId)
```

### 2. Missing Query Invalidation for User Stats

**Location:** `src/components/admin/ProfileEditor.tsx` (lines 297-302)

**Problem:** After saving, only `admin-user-detail` and `admin-users` queries are invalidated, but `admin-user-stats` is NOT invalidated, causing stale stats data.

### 3. Users Without player_stats Entries

**Database Finding:** User "Toni" (id: `6117ab09...`) has a profile but no `player_stats` entry, which can cause display issues or null errors.

### 4. Missing Null Safety in User Stats Display

**Location:** `src/pages/admin/AdminUsers.tsx` (lines 585-586)

**Current Code:**
```typescript
<TableCell>{user.stats?.total_cats_owned ?? 0}</TableCell>
<TableCell>{user.stats?.total_show_wins ?? 0}</TableCell>
```

This is handled with `??` but should show a distinct indicator when stats are completely missing vs zero.

---

## Solution

### Fix 1: Add player_stats Sync to ProfileEditor

**File:** `src/components/admin/ProfileEditor.tsx`

After updating the profiles table, add sync to player_stats:

```typescript
// After profiles update succeeds (around line 323)
// Sync to player_stats for leaderboard consistency
const { error: statsError } = await supabase
  .from('player_stats')
  .update({ 
    display_name: trimmedName, 
    avatar_emoji: avatarEmoji 
  })
  .eq('user_id', userId);

if (statsError) {
  console.warn('[ProfileEditor] Failed to sync to player_stats:', statsError.message);
  // Non-blocking - continue even if stats sync fails
}
```

### Fix 2: Add player_stats Query Invalidation

**File:** `src/components/admin/ProfileEditor.tsx`

Update the `onSave` callback to also invalidate stats:

```typescript
// In the onSave callback (lines 297-302)
onSave?.();
queryClient.invalidateQueries({ queryKey: ['admin-user-stats', userId] });
```

### Fix 3: Show "No Stats" Indicator in User Table

**File:** `src/pages/admin/AdminUsers.tsx`

Modify the table cells to distinguish between "zero" and "no stats record":

```typescript
<TableCell>
  {user.stats ? (
    user.stats.total_cats_owned
  ) : (
    <span className="text-muted-foreground text-xs">—</span>
  )}
</TableCell>
<TableCell>
  {user.stats ? (
    user.stats.total_show_wins
  ) : (
    <span className="text-muted-foreground text-xs">—</span>
  )}
</TableCell>
```

### Fix 4: Add Auto-Create player_stats Entry (Optional Enhancement)

**File:** `src/components/admin/ProfileEditor.tsx`

When saving a profile, if no player_stats entry exists, create one:

```typescript
// Check if player_stats exists, create if not
const { data: existingStats } = await supabase
  .from('player_stats')
  .select('user_id')
  .eq('user_id', userId)
  .maybeSingle();

if (!existingStats) {
  await supabase.from('player_stats').insert({
    user_id: userId,
    display_name: trimmedName,
    avatar_emoji: avatarEmoji,
  });
} else {
  await supabase
    .from('player_stats')
    .update({ display_name: trimmedName, avatar_emoji: avatarEmoji })
    .eq('user_id', userId);
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/ProfileEditor.tsx` | Add player_stats sync after profile update |
| `src/pages/admin/AdminUsers.tsx` | Improve "no stats" indicator display |

---

## Technical Notes

1. **Why sync is important**: The `player_stats` table is used for global leaderboards. Without sync, a user's display name could appear differently on the leaderboard vs their profile.

2. **Non-blocking sync**: The player_stats sync should be non-blocking (fire-and-forget with warning log) to avoid blocking the admin action if the sync fails.

3. **Backward compatibility**: The fix maintains existing behavior while adding the missing sync, ensuring no breaking changes.

4. **Cache invalidation**: React Query's `staleTime: 10000` means data refreshes every 10 seconds automatically, but explicit invalidation after edits provides immediate UI updates.

