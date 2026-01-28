
# Game Save Repair Tool - Bug Fix Plan

## Issues Identified

### Issue 1: Refresh Button Does Nothing (Visual Feedback)

**Location:** `src/pages/admin/AdminGameSaveRepair.tsx` (lines 105, 197-200)

**Root Cause:** The button uses `isLoading` which only indicates the **initial** load state. When you click the refresh button, `refetch()` is called but `isLoading` stays `false` because data is already in cache. React Query uses `isFetching` for ongoing fetches.

**Current Code:**
```typescript
const { data, isLoading, refetch } = useAdminCorruptedSaves();
// ...
<Button onClick={() => refetch()} disabled={isLoading} variant="outline">
  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
  Refresh
</Button>
```

**Fix:** Add `isFetching` to control the spinner and disable state:
```typescript
const { data, isLoading, isFetching, refetch } = useAdminCorruptedSaves();
// ...
<Button onClick={() => refetch()} disabled={isFetching} variant="outline">
  <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
  Refresh
</Button>
```

---

### Issue 2: Eric's Account Shows Incorrect Funds

**Database Finding:**
| Field | Value |
|-------|-------|
| email | eric@wccgroup.net |
| money | $2,488 |
| totalMoneyEarned | 0 |

**Root Cause:** The `detectCorruption` function only checks if `totalMoneyEarned` is negative or invalid. It does NOT detect the logical impossibility where `money > totalMoneyEarned` (a user cannot have more cash than they've ever earned).

**Location:** `src/hooks/admin/useAdminCorruptedSaves.ts`

**Fix:** Add a new corruption check for this data integrity issue:

1. **Add new corruption type**: `earnings_mismatch`
2. **Detection logic**: If `money > totalMoneyEarned`, flag as issue
3. **Repair logic**: Set `totalMoneyEarned = Math.max(totalMoneyEarned, money)`

---

## Implementation Details

### File 1: `src/pages/admin/AdminGameSaveRepair.tsx`

**Change:** Line 105 - Add `isFetching` to destructuring
**Change:** Lines 197-199 - Use `isFetching` for button state

### File 2: `src/hooks/admin/useAdminCorruptedSaves.ts`

**Changes:**

1. **Line 21-28 (CorruptionType):** Add `'earnings_mismatch'` to the union type

2. **Lines 84-91 (ISSUE_TYPE_ICONS):** Add icon for earnings_mismatch

3. **Lines 93-101 (ISSUE_TYPE_LABELS):** Add label for earnings_mismatch

4. **Lines 84-105 (detectCorruption - after totalMoneyEarned check):** Add new check:
```typescript
// Check money vs totalMoneyEarned consistency
const money = gameState.money;
const totalMoneyEarned = gameState.totalMoneyEarned;
if (
  typeof money === 'number' &&
  typeof totalMoneyEarned === 'number' &&
  money > totalMoneyEarned
) {
  issues.push({
    type: 'earnings_mismatch',
    field: 'totalMoneyEarned',
    currentValue: totalMoneyEarned,
    suggestedValue: money,
    severity: 'medium',
  });
}
```

5. **Lines 209-222 (repairGameState):** Add repair for earnings mismatch:
```typescript
// Fix totalMoneyEarned vs money consistency
const money = repairedState.money as number;
const totalEarned = repairedState.totalMoneyEarned as number;
if (
  typeof money === 'number' &&
  typeof totalEarned === 'number' &&
  money > totalEarned
) {
  changes.push(`totalMoneyEarned: ${totalEarned} → ${money} (adjusted to match current funds)`);
  repairedState.totalMoneyEarned = money;
}
```

6. **Lines 344-354 (CorruptionStats):** Add `earningsMismatch: number` counter

7. **Lines 366-390 (stats counting):** Add case for `earnings_mismatch`

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/admin/AdminGameSaveRepair.tsx` | Add `isFetching` for refresh button state |
| `src/hooks/admin/useAdminCorruptedSaves.ts` | Add `earnings_mismatch` detection and repair |

---

## Expected Results After Fix

| Issue | Before | After |
|-------|--------|-------|
| Refresh button | No spinner, appears broken | Spinner shows during refresh |
| Eric's account | Not flagged, shows $0 total earned | Flagged as "Earnings Mismatch", can be repaired to $2,488 |

---

## Technical Notes

1. **React Query states:**
   - `isLoading` = true only on initial load with no cached data
   - `isFetching` = true whenever a fetch is in progress (including refetch)

2. **Data integrity logic:** If a user has $X in their wallet, they must have earned at least $X total (they can spend money, but can't spend more than they earned)

3. **Repair is non-destructive:** Sets `totalMoneyEarned = money` only when money > totalMoneyEarned, preserving any higher totalMoneyEarned value
