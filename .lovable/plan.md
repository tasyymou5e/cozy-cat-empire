# Admin Dashboard Data Sync Issues - COMPLETED ✅

## Changes Made

### Fix 1: ProfileEditor player_stats Sync ✅
**File:** `src/components/admin/ProfileEditor.tsx`

Added automatic sync to `player_stats` table after profile update:
- Checks if `player_stats` entry exists using `.maybeSingle()`
- Creates new entry if missing (handles orphaned profiles)
- Updates existing entry if present
- Non-blocking with console warnings on failure

### Fix 2: AdminUsers "No Stats" Indicator ✅
**File:** `src/pages/admin/AdminUsers.tsx`

Changed stats display from `?? 0` to show distinct indicator:
- Shows actual value when stats record exists
- Shows "—" (em dash) in muted style when stats record is missing
- Helps admins distinguish between "zero cats" vs "no stats record"

---

## Summary

| Issue | Status |
|-------|--------|
| ProfileEditor missing player_stats sync | ✅ Fixed |
| "No stats" vs "zero" distinction | ✅ Fixed |
| Auto-create player_stats for orphaned profiles | ✅ Fixed |
