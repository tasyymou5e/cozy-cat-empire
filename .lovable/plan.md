
# Fix: Empire Page Shows 0 Cats Due to Negative totalMoneyEarned

## Root Cause Analysis

### Problem Identified
The user's cloud save has `totalMoneyEarned: -350` (negative value). The validation in `isValidGameState()` uses `isMoneyValue()` which requires values `>= 0`, causing the entire save to be rejected as "corrupted" even though it contains 11 valid cats.

### Evidence Chain
1. **Database shows valid data:**
   - 11 cats on Day 34
   - All cat fields valid (health=100, happiness=97, grade=1-7, decimal ages like 2.33)
   
2. **But `totalMoneyEarned = -350`** (negative)

3. **Validation failure at `isValidGameState()` line 322:**
   ```typescript
   isMoneyValue(value.totalMoneyEarned) &&  // fails for -350
   ```

4. **Result:** `cloudLoad()` returns `{ data: null, error: 'Cloud save data is corrupted' }`

5. **Empire page fallback:** Falls through to localStorage (empty) → shows 0 cats

### Why totalMoneyEarned Became Negative
This likely occurred due to a game logic bug where spending money was incorrectly tracked against `totalMoneyEarned` instead of just `money`. The `totalMoneyEarned` field should only increase (cumulative earnings), never decrease.

---

## Technical Fix

### Change 1: Relax Validation for totalMoneyEarned
Allow negative values for `totalMoneyEarned` in the validator to prevent data loss. The field tracks historical earnings and a negative value, while incorrect, shouldn't block the entire save.

**File:** `src/types/guards.ts`

**Line 322:** Change from:
```typescript
isMoneyValue(value.totalMoneyEarned) &&
```
To:
```typescript
isNumber(value.totalMoneyEarned) &&
```

### Change 2: Fix User's Corrupted Data (Optional)
Run a database update to correct the negative value:
```sql
UPDATE game_saves 
SET game_state = jsonb_set(game_state, '{totalMoneyEarned}', '0')
WHERE user_id = '93dcd753-d511-448d-a4ec-db5f991b08a8';
```

### Change 3: Prevent Future Negative Values (Root Cause Fix)
Audit the code that modifies `totalMoneyEarned` to ensure it only increases, never decreases. Likely culprit is in `useGameCore.ts` or `useResources.ts`.

---

## Implementation Steps

| Step | Description | File | Risk |
|------|-------------|------|------|
| 1 | Relax validation for totalMoneyEarned | `src/types/guards.ts` | Low |
| 2 | Fix corrupted user data | Database update | Low |
| 3 | (Optional) Audit totalMoneyEarned logic | `src/hooks/game/*.ts` | Medium |

---

## Validation After Fix

1. User eric@wccgroup.net should see 11 cats on Empire page
2. Cloud save loads without "corrupted" error
3. No console errors about validation failures
4. Future saves with accidental negative values won't block loading

---

## Summary

This is a **data integrity + validation strictness** issue:
- **Immediate fix:** Relax the validator to accept negative `totalMoneyEarned` (prevents data loss)
- **Data fix:** Correct the user's data to 0 or recalculate proper value
- **Long-term fix:** Ensure `totalMoneyEarned` logic only increments, never decrements
