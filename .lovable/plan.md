

# Fix Lost Cats Detection and Recovery

## Root Causes Found

Three bugs prevent orphan recovery from working:

1. **Stale closure in setTimeout**: After cloud load, `checkForOrphans` is called via `setTimeout`, but it captures the pre-load version of `currentCatIds` (empty array). This means either all gallery cats appear as orphans (false positives) or the check runs with wrong data.

2. **Recovery assigns new IDs**: `addReceivedCat` generates a brand-new ID for recovered cats (line 331 of `useCatManagement.ts`). The gallery photos still reference the original `cat_id`, so recovered cats lose their gallery link and will be detected as orphans again on next load.

3. **No space = silent failure**: If the user's farm is full, `addReceivedCat` silently rejects cats with a toast but the recovery dialog still closes as if successful.

## Plan

### 1. Fix stale closure in cloud handlers
**File**: `src/hooks/handlers/useCloudHandlers.ts`

Replace the `setTimeout` approach with a ref-based trigger. After `loadFromData` completes, set a flag that triggers orphan detection on the next render cycle (when `currentCatIds` is correct).

### 2. Add `addRecoveredCat` action that preserves original ID
**File**: `src/hooks/game/useCatManagement.ts`

Create a new `addRecoveredCat(cat: Cat)` function that keeps the original `cat.id` instead of generating a new one. This ensures gallery photos remain linked.

Export it through `src/hooks/game/types.ts` and `src/hooks/game/index.ts`.

### 3. Use `addRecoveredCat` in orphan recovery handler
**File**: `src/hooks/handlers/useCloudHandlers.ts`

Update `handleRecoverOrphans` to call `actions.addRecoveredCat` instead of `actions.addReceivedCat`.

### 4. Handle space constraints in recovery dialog
**File**: `src/components/game/OrphanRecoveryDialog.tsx`

Accept a `availableSpace` prop and show a warning when selected cats exceed available space. Disable the recover button if no space.

### Technical Details

```text
Current flow (broken):
  cloudLoad → loadFromData → setTimeout(checkForOrphans, 1000)
                                  ↑ captures stale currentCatIds = []
  
Fixed flow:
  cloudLoad → loadFromData → set shouldCheckOrphans = true
  next render → currentCatIds updated → useEffect triggers checkForOrphans
```

For ID preservation:
```text
Current: addReceivedCat → new ID → gallery cat_id mismatch → re-detected as orphan
Fixed:   addRecoveredCat → keeps original ID → gallery stays linked
```

