
# Fix: Empire Page Not Showing Cats for User eric@wccgroup.net

## Root Cause Analysis

**Problem Identified:** The cat age validation is too strict, causing cloud save data to be rejected as "corrupted."

### Evidence Chain:
1. **Database shows 2 cats** for user `eric@wccgroup.net`:
   - `{"age": 2.01, "name": "Gandalf", ...}`
   - `{"age": 3.01, "name": "Bella", ...}`

2. **Age increment logic** (`useGameCore.ts:211`) adds `0.01` to `cat.age` each day, resulting in decimal values.

3. **Type guard failure** (`guards.ts:227`) uses `isNonNegativeInt(value.age)`:
   ```typescript
   function isNonNegativeInt(value: unknown): value is number {
     return isNumber(value) && Number.isInteger(value) && value >= 0;
   }
   ```
   This returns `false` for `2.01` because it's not an integer.

4. **Result:** `isCat()` → `false` → `isValidGameState()` → `false` → `cloudLoad()` returns `{ data: null, error: 'Cloud save data is corrupted' }` → No cats loaded → Empire shows empty state.

---

## Technical Fix

### File: `src/types/guards.ts`

**Change:** Replace the integer check for `age` with a non-negative number check.

```typescript
// BEFORE (line 227):
isNonNegativeInt(value.age) &&

// AFTER:
isNonNegative(value.age) &&
```

Also add a new utility function:

```typescript
/** Check if value is a non-negative number (allows decimals) */
function isNonNegative(value: unknown): value is number {
  return isNumber(value) && value >= 0;
}
```

---

## Implementation Steps

### Step 1: Add `isNonNegative` utility function
Add after line 112 in `guards.ts`:

```typescript
/** Check if value is a non-negative number (allows decimals) */
function isNonNegative(value: unknown): value is number {
  return isNumber(value) && value >= 0;
}
```

### Step 2: Update `isCat` function
Change line 227 from:
```typescript
isNonNegativeInt(value.age) &&
```
to:
```typescript
isNonNegative(value.age) &&
```

---

## Validation

After fix, verify:
- [ ] User `eric@wccgroup.net` can see 2 cats on Empire page
- [ ] Cloud save loads without "corrupted" error
- [ ] Cat age displays correctly (e.g., "2.01 days")
- [ ] Day progression still works (age increments by 0.01)
- [ ] No other pages broken by change

---

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Breaking other validations | Low | Only affects `age` field |
| Backwards compatibility | None | Makes validation more permissive |
| Performance impact | None | Same computation complexity |

---

## Documentation Updates

No documentation changes required - this is a bug fix, not a feature change. The existing documentation correctly describes age as days (which can be fractional).

---

## Summary

This is a **critical bug fix** affecting all users whose cats have aged past their initial integer value. The fix is minimal (2 lines changed) and low-risk.
