

# Fix User Saves - Admin Shows Users but No Game Save

## Problem Analysis

Database inspection reveals two issues:

1. **Some users' game_saves have been overwritten with empty/reset state**. For example, user `jess` has `player_stats.total_cats_owned = 71` but her `game_saves` shows `cats_count = 0, day = 1, money = 185`. The save was overwritten with initial state at some point despite the existing guards.

2. **`player_stats` is only synced during manual cloud saves**, not during auto-saves. The `syncPlayerStats` call lives in `handleCloudSave` (manual button) but is absent from the auto-save flow in `useAutoSave`. So the admin user list (which reads from `player_stats`) shows stale or zero data for users who never manually saved.

3. **Admin user detail modal uses `.single()` for `game_saves`** query (line 54 of `UserDetailModal.tsx`), which throws when no row exists. It catches `PGRST116` but should use `.maybeSingle()`.

## Root Causes

- **Auto-save doesn't sync `player_stats`** - the `onSaveComplete` callback in `useCloudHandlers.ts` does not call `syncPlayerStats`, so user stats in the admin view remain at 0 for most users.
- **Admin user list only reads from `player_stats`** (via `useAdminUsers`), not from `game_saves.game_state`. If `player_stats` is empty/stale, admin sees no meaningful data.
- **Corrupted saves** (day=1, 0 cats on users who had progress) suggest the empty-state guard was bypassed in earlier code versions. These need admin-level repair, not a code fix.

## Plan

### 1. Sync `player_stats` on auto-save success
**File: `src/hooks/handlers/useCloudHandlers.ts`**
- In the `useAutoSave` options `onSaveComplete` callback (~line 125), call `leaderboard.syncPlayerStats(state, kittensBreed, ...)` so stats stay current after every auto-save, not just manual saves.

### 2. Enrich admin user list with `game_saves` data
**File: `src/hooks/admin/useAdminData.ts`**
- In `useAdminUsers`, also fetch from `game_saves` for each page of users (similar to the existing `player_stats` + `user_roles` parallel fetch).
- Add fields: `last_played_at`, `cats_count` (from `jsonb_array_length`), `day`, `money` from `game_state`.
- This ensures the admin list shows real game data even when `player_stats` hasn't been synced.

### 3. Fix `.single()` to `.maybeSingle()` in UserDetailModal
**File: `src/components/admin/UserDetailModal.tsx`**
- Line 54: Change `.single()` to `.maybeSingle()` for the `game_saves` query.
- Line 69: Same for `player_stats` query.
- Remove the `PGRST116` error code checks (no longer needed with `.maybeSingle()`).

### 4. Show game save status in admin user table
**File: `src/pages/admin/AdminUsers.tsx`**
- Add a "Last Played" or "Save Status" column showing data from `game_saves` (from step 2).
- Show a badge like "No Save" for users without a game_saves row, helping admin identify users who haven't saved.

## Files Changed
| File | Change |
|------|--------|
| `src/hooks/handlers/useCloudHandlers.ts` | Sync player_stats on auto-save complete |
| `src/hooks/admin/useAdminData.ts` | Fetch game_saves data alongside profiles |
| `src/components/admin/UserDetailModal.tsx` | Fix `.single()` → `.maybeSingle()` |
| `src/pages/admin/AdminUsers.tsx` | Add save status column |

