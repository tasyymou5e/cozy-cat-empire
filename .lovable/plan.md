
# Cloud Save Race Condition Fix

## Problem Analysis

The current system has a race condition where saves can occur before cloud data has loaded, causing data loss:

### Root Cause Chain
```text
1. User logs in
2. Cloud load starts (async operation)
3. BEFORE load completes, one of these happens:
   - Auto-save interval triggers (useAutoSave.ts)
   - User interacts with cat on Empire page (saveGame callback)
   - User navigates to CatCustomization/CatCollection and edits
   - beforeunload event fires (page close/refresh)
4. Save writes fresh/default state to cloud
5. Cloud load finally completes, but too late - data overwritten
6. User's progress is lost
```

### Current Safety Mechanisms
| Location | Protection | Gap |
|----------|------------|-----|
| `useCloudHandlers.ts:100` | Checks `ui.hasLoadedCloud` for interval save | ✅ Works for CatFarm |
| `useCloudHandlers.ts:123` | Checks `ui.hasLoadedCloud` for manual save | ✅ Works for CatFarm |
| `useCloudSave.ts:123` | Blocks empty cats if `day > 1` | ❌ Fails when `day === 1` |
| `Empire.tsx:75-80` | Has own `hasLoadedCloud` state | ❌ Not checked in `saveGame()` |
| `CatCollection.tsx:206` | No check | ❌ Can save before cloud loaded |
| `CatCustomization.tsx:179` | No check | ❌ Can save before cloud loaded |
| `useAutoSave.ts` | No loading gate check | ❌ Can fire during load |

---

## Solution Strategy

### Approach: Multi-Layer Defense

1. **Hook-Level Gate** - Add `hasLoadedCloud` check inside `useCloudSave.cloudSave()` itself
2. **Page-Level Guards** - Add guards in each page's save function
3. **Enhanced Safety Check** - Improve the existing "empty cats" check in `useCloudSave.ts`
4. **Loading State Sharing** - Create a shared loading state for cross-page consistency

---

## Implementation Plan

### Phase 1: Enhance `useCloudSave` Hook (~25 lines)

**File:** `src/hooks/useCloudSave.ts`

Add a new `isLoading` state that tracks whether initial load has occurred, and expose it for callers to check:

```text
Changes:
1. Add `isLoaded` state (default: false)
2. Set `isLoaded = true` after first successful cloudLoad() call
3. Add check in cloudSave() to reject saves when not loaded
4. Improve the safety check to block ANY save on day 1 for logged-in users
   unless explicitly marked as "new user first save"
5. Return `isLoaded` from the hook
```

**New Logic in cloudSave():**
```typescript
// NEW: Block saves if cloud data hasn't been loaded yet
if (!isLoadedRef.current) {
  console.warn('[CloudSync] Blocked save: Cloud data not yet loaded');
  return { success: false, error: 'Cloud data not loaded yet' };
}

// ENHANCED: Block saves on day 1 with 0 cats (likely race condition)
if (gameState.cats.length === 0 && gameState.day === 1 && !options?.isNewUser) {
  console.warn('[CloudSync] Blocked save: Empty state on day 1 suggests race condition');
  return { success: false, error: 'Blocked potential race condition save' };
}
```

### Phase 2: Update Page Components (~15 lines each)

**File:** `src/pages/Empire.tsx`

Add guard to `saveGame` callback:

```typescript
const saveGame = useCallback(async () => {
  // Guard: Only save if cloud data has been loaded
  if (!hasLoadedCloud) {
    console.warn('[Empire] Skipping save - cloud data not loaded');
    return;
  }
  if (user) {
    const relationshipData = relationshipSystem.getRelationshipSaveData();
    await cloudSave(state, kittensBreed, relationshipData);
  }
}, [user, hasLoadedCloud, cloudSave, state, kittensBreed, relationshipSystem]);
```

**File:** `src/pages/CatCollection.tsx`

Add guard to `handlePortraitGenerated`:

```typescript
const handlePortraitGenerated = async (catId: string, portraitUrl: string) => {
  // Guard: Only save if cloud data has been loaded
  if (!hasLoadedCloud) {
    console.warn('[CatCollection] Skipping cloud save - not loaded yet');
    return;
  }
  // ... existing logic
};
```

**File:** `src/pages/CatCustomization.tsx`

Add guard to `handleSave`:

```typescript
const handleSave = async () => {
  if (!selectedCat || !editedAppearance) return;
  // Guard: Only save if cloud data has been loaded
  if (!hasLoadedCloud && user) {
    console.warn('[CatCustomization] Skipping cloud save - not loaded yet');
    return;
  }
  // ... existing logic
};
```

### Phase 3: Update `useAutoSave` Hook (~10 lines)

**File:** `src/hooks/useAutoSave.ts`

The hook already accepts an `enabled` option - callers must pass `hasLoadedCloud` to gate it:

```typescript
// Already has this capability - verify callers use it correctly
const performAutoSave = useCallback(async () => {
  if (!userId || !enabled || isSavingRef.current) return;
  // ...
});
```

Callers using `useAutoSave` must pass:
```typescript
useAutoSave(userId, state, kittensBreed, relationships, {
  enabled: isLoggedIn && hasLoadedCloud, // CRITICAL: Include hasLoadedCloud
});
```

### Phase 4: Add Comprehensive Logging (~5 lines)

Enhance logging to trace save attempts for debugging:

```typescript
console.log('[CloudSync] Save attempt', {
  isLoaded: isLoadedRef.current,
  catsCount: gameState.cats.length,
  day: gameState.day,
  userId: userId?.slice(0, 8) + '...',
});
```

---

## File Summary

| File | Action | Lines Changed |
|------|--------|---------------|
| `src/hooks/useCloudSave.ts` | Modify | ~25 |
| `src/pages/Empire.tsx` | Modify | ~5 |
| `src/pages/CatCollection.tsx` | Modify | ~5 |
| `src/pages/CatCustomization.tsx` | Modify | ~5 |
| **Total** | | ~40 |

---

## Validation Scenarios

After implementation, these scenarios should work correctly:

| Scenario | Expected Behavior |
|----------|-------------------|
| User logs in, auto-save fires during load | Save blocked, warning logged |
| User logs in, clicks cat on Empire before load | Save blocked until load completes |
| User with existing save opens CatCustomization | Loads cloud data first, then allows edits |
| New user creates first cat | Allowed (day 1, but `isNewUser` flag set) |
| Page refresh during gameplay | beforeunload save blocked if load not complete |

---

## Technical Notes

- **Backward Compatibility**: Existing saves unaffected
- **Performance**: No additional network calls
- **Error Recovery**: Failed loads still mark as "loaded" to prevent stuck states
- **Logging**: Enhanced console output for debugging sync issues
