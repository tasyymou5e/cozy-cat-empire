# Recent Changes Summary

## Completed: 2026-01-28

### Security Linter Refinements
- Updated `get_permissive_policies()` to exclude legitimate public INSERT tables
- Updated `get_tables_without_admin_access()` to recognize ALL policies and exclude public tables
- Result: 0 false positive warnings

### Admin Data Sync Fixes
- ProfileEditor now syncs display_name/avatar_emoji to player_stats
- Auto-creates player_stats entry for orphaned profiles
- AdminUsers table shows "—" for missing stats (vs false "0")

### Game Save Repair Improvements
- Refresh button uses isFetching for proper loading state
- New "earnings_mismatch" corruption type detection
- Auto-repair logic for money > totalMoneyEarned cases

---

All changes fully implemented and tested.
