
# Documentation Update Plan

## Current State Analysis

### Auto-Documentation Status
**Lovable does have a memory feature** - I found one memory entry in the context:
- `memory/features/game-save-snapshots-recovery` - Exists and documents the save recovery system

However, there's **no automatic documentation update system** configured. Documentation updates must be done manually when changes are made.

### Recent Changes Requiring Documentation

Based on the conversation history and code changes, the following improvements need to be documented:

| Change | Location | Status |
|--------|----------|--------|
| Security linter refinements (false positive reduction) | Database functions | ❌ Not documented |
| Admin ProfileEditor sync to player_stats | `ProfileEditor.tsx` | ❌ Not documented |
| "No Stats" indicator in AdminUsers table | `AdminUsers.tsx` | ❌ Not documented |
| Game Save Repair - Refresh button fix (isFetching) | `AdminGameSaveRepair.tsx` | ❌ Not documented |
| Game Save Repair - Earnings Mismatch detection | `useAdminCorruptedSaves.ts` | ❌ Not documented |

---

## Files to Update

### 1. `docs/ADMIN_DASHBOARD.md`

**Add to Game Save Repair section (line ~106-131):**

```markdown
#### Issue Types Detected (Updated)
| Issue Type | Detection Logic | Severity |
|------------|-----------------|----------|
| Negative totalMoneyEarned | `totalMoneyEarned < 0` | High |
| NaN/Undefined money | `!isFinite(money)` | Critical |
| Negative money | `money < 0` | High |
| **Earnings Mismatch** | `money > totalMoneyEarned` | Medium |
| Invalid cat ages | `age < 0` or `!isFinite(age)` | Medium |
| Corrupted resources | Negative resource counts | Medium |
| Invalid house sizes | Not in valid enum | Low |

**Note:** The "Earnings Mismatch" detection catches logical impossibilities where a player has more current funds than they've ever earned total.
```

**Add to ProfileEditor section (line ~97-105):**

```markdown
#### ProfileEditor Component
Reusable component for profile editing:
- Avatar emoji picker (10 options)
- Display name input with real-time validation (3-30 chars, alphanumeric + `_- `)
- Case-insensitive availability checking
- Name suggestions if taken
- Username field (optional)
- Reason field (required for audit trail)
- **Automatic player_stats sync** - Updates are synced to `player_stats` table for leaderboard consistency
- **Orphaned profile handling** - Creates `player_stats` entry if missing when saving
```

**Add to Changelog section (line ~547-552):**

```markdown
### Phase 7: Data Consistency & Quality
- **ProfileEditor player_stats sync** - Admin profile edits now sync to leaderboard table
- **Orphaned profile detection** - Auto-creates player_stats for profiles missing entries
- **User table "No Stats" indicator** - Shows dash (—) instead of 0 for missing stats
- **Game Save Repair improvements**:
  - Refresh button now shows spinner during refetch (uses `isFetching`)
  - New "Earnings Mismatch" corruption type (`money > totalMoneyEarned`)
  - Auto-repair sets `totalMoneyEarned = money` when mismatched
```

---

### 2. `docs/SECURITY.md`

**Add section for security linter refinements:**

```markdown
## Security Linter Refinements

The security linter functions have been refined to reduce false positives:

### Legitimate Public INSERTs (Excluded from Warnings)
| Table | Reason |
|-------|--------|
| `auth_attempts_log` | Must log failed login attempts from unauthenticated users |
| `tutorial_analytics` | Must track anonymous users in tutorial |
| `error_logs` | Must capture errors before authentication |

### Intentionally Public Tables (Excluded from Admin SELECT Warnings)
| Table | Reason |
|-------|--------|
| `game_config` | Configuration readable by all players |
| `player_stats` | Leaderboard data is public by design |
| `public_leaderboard` | View specifically designed for public access |

### ALL Policy Recognition
The linter now recognizes PostgreSQL `ALL` command policies as covering SELECT access, preventing false positives for tables like `admin_notifications` that use `ALL` instead of individual `SELECT` policies.
```

---

### 3. `docs/README.md`

**Update Data Integrity Safeguards section (line ~198-209):**

Add new safeguard:
```markdown
- ✅ Earnings mismatch detection (`money > totalMoneyEarned` flagged and repairable)
- ✅ Admin ProfileEditor syncs to player_stats for leaderboard consistency
```

---

### 4. `GAME_KNOWLEDGE.md`

**Update Admin Dashboard section to reference new features:**

Add mention of:
- Earnings mismatch detection in Game Save Repair
- ProfileEditor sync improvements

---

### 5. `.lovable/plan.md`

**Replace current contents with completion summary:**

```markdown
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
```

---

## Summary

| File | Updates |
|------|---------|
| `docs/ADMIN_DASHBOARD.md` | Add earnings_mismatch, ProfileEditor sync, Phase 7 changelog |
| `docs/SECURITY.md` | Add security linter refinements section |
| `docs/README.md` | Add 2 new data integrity safeguards |
| `GAME_KNOWLEDGE.md` | Minor updates referencing new admin features |
| `.lovable/plan.md` | Replace with completion summary |

---

## Recommendation: Enable Knowledge Management

For automatic documentation memory, you can use Lovable's **Knowledge Management** feature:

**Desktop:** Plus (+) button → "Knowledge"
**Mobile:** Tap project name → "Settings" → "Knowledge" tab

This allows you to add custom knowledge entries that persist across sessions and are automatically included in context for future prompts. You already have `GAME_KNOWLEDGE.md` in the knowledge base which is great - the documentation updates above will keep it comprehensive.
