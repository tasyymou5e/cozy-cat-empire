
# Data Protection & Recovery Enhancement - Review & Documentation Update

## Review Summary

I've analyzed the implemented features against the original plan. Here are my findings:

---

## Implementation Status

### Feature 1: Enhanced Save Snapshots

| Component | Status | Notes |
|-----------|--------|-------|
| `useEventSnapshots.ts` | ✅ Complete | Hook created with debouncing, pruning, and typed event types |
| Edge function snapshot | ✅ Complete | `generate-cat-portrait/index.ts` inserts `portrait_generated` snapshot (lines 683-698) |
| Integration into `useCatManagement.ts` | ❌ Not Done | `sellCat`/`addCat` don't call `createEventSnapshot` |
| Integration into `useBreeding.ts` | ❌ Not Done | `breedCats` doesn't call `createEventSnapshot` |
| Integration into `useCostumes.ts` | ❌ Not Done | `buyCostume` doesn't call `createEventSnapshot` |

**Gap**: `createEventSnapshot` is exported from `useCloudHandlers` but never passed to or called from domain hooks.

### Feature 2: Cat Orphan Detection

| Component | Status | Notes |
|-----------|--------|-------|
| `useOrphanDetection.ts` | ✅ Complete | Hook with `checkForOrphans`, `dismissOrphans`, `createRecoveryCat` |
| `OrphanRecoveryDialog.tsx` | ✅ Complete | Full dialog with selection, preview, recover functionality |
| Integration into `useCloudHandlers.ts` | ✅ Complete | Calls `checkForOrphans` after cloud load, exports dialog state |
| **Rendering in CatFarm.tsx** | ❌ Not Done | Dialog props exported but NOT rendered in any component |

**Gap**: `showOrphanDialog`, `orphanedCats`, `handleRecoverOrphans`, and `handleDismissOrphans` are returned from handlers but OrphanRecoveryDialog is never rendered in `CatFarmDialogs.tsx` or `CatFarm.tsx`.

### Feature 3: Portrait URL Persistence Check

| Component | Status | Notes |
|-----------|--------|-------|
| `usePortraitReconciliation.ts` | ✅ Complete | Hook with `reconcilePortraits`, `autoRepairPortraits`, `repairedCount` |
| Integration into `Empire.tsx` | ✅ Complete | Runs on load, auto-repairs, shows toast, triggers save |

---

## Issues to Fix

### Issue 1: OrphanRecoveryDialog Not Rendered

The dialog component exists and all handlers are wired in `useCloudHandlers`, but it's never actually rendered.

**Fix**: Add to `CatFarmDialogs.tsx`:
```tsx
import { OrphanRecoveryDialog } from './OrphanRecoveryDialog';

// Add props:
orphanedCats: OrphanedCat[];
showOrphanDialog: boolean;
onRecoverOrphans: (cats: OrphanedCat[]) => Promise<void>;
onDismissOrphans: () => void;

// Render:
<OrphanRecoveryDialog
  orphanedCats={orphanedCats}
  open={showOrphanDialog}
  onClose={onDismissOrphans}
  onRecover={onRecoverOrphans}
/>
```

Then pass from `CatFarm.tsx` via handlers.

### Issue 2: Event Snapshots Not Wired to Game Actions

The original plan called for snapshots on sell/adopt/breed/purchase but the domain hooks don't have access to `createEventSnapshot`.

**Architecture Challenge**: Domain hooks (`useCatManagement`, `useBreeding`, `useCostumes`) operate at a lower level and don't have access to `useCloudHandlers` which provides `createEventSnapshot`.

**Solution Options**:

A. **Pass snapshot function via dependencies** - Add `createEventSnapshot` to `GameHookDependencies` interface and thread it through.

B. **Call from handler layer** - Wrap game actions at the handler level to create snapshots. Less invasive but requires wrapping every action.

C. **Event-based approach** - Emit events from domain hooks that handlers listen for. More complex.

**Recommended: Option A** - Cleanest integration with existing architecture.

---

## Documentation Updates Required

### 1. Update `docs/CAT_DATA_SYNC.md`

Add new sections:
- Event-triggered snapshots
- Orphan detection system  
- Portrait reconciliation

### 2. Update `docs/README.md`

Add to Key Files by Feature table:
- `useEventSnapshots.ts`
- `useOrphanDetection.ts`
- `usePortraitReconciliation.ts`
- `OrphanRecoveryDialog.tsx`

Add to Data Integrity Safeguards:
- Event snapshots on portrait/sale/breed
- Orphan detection after cloud load
- Portrait URL auto-repair on Empire load

### 3. Update `docs/HOOKS_ARCHITECTURE.md`

Add new hooks to directory structure and describe integration pattern.

### 4. Update `GAME_KNOWLEDGE.md`

Add Data Protection section covering all three features.

---

## Files to Modify

### Bug Fixes (4 files)

| File | Change |
|------|--------|
| `src/components/game/CatFarmDialogs.tsx` | Add OrphanRecoveryDialog rendering |
| `src/components/game/CatFarm.tsx` | Pass orphan dialog props to CatFarmDialogs |
| `src/hooks/game/types.ts` | Add `createEventSnapshot` to GameHookDependencies |
| `src/hooks/useGameState.ts` | Wire createEventSnapshot through to domain hooks |

### Snapshot Integration (3 files)

| File | Change |
|------|--------|
| `src/hooks/game/useCatManagement.ts` | Call `createEventSnapshot('cat_sold')` before sale, `createEventSnapshot('cat_adopted')` after adoption |
| `src/hooks/game/useBreeding.ts` | Call `createEventSnapshot('breeding_success')` after successful breed |
| `src/hooks/game/useCostumes.ts` | Call `createEventSnapshot('purchase')` after costume purchase |

### Documentation (4 files)

| File | Change |
|------|--------|
| `docs/CAT_DATA_SYNC.md` | Add sections for all 3 features with flow diagrams |
| `docs/README.md` | Add hooks to Key Files, add to Data Integrity Safeguards |
| `docs/HOOKS_ARCHITECTURE.md` | Document new hooks and integration pattern |
| `GAME_KNOWLEDGE.md` | Add Data Protection & Recovery section |

---

## Implementation Order

1. **Fix OrphanRecoveryDialog rendering** (critical - feature is broken)
2. **Wire createEventSnapshot to domain hooks** (medium priority)
3. **Update documentation** (low priority but important)

---

## Technical Details

### OrphanRecoveryDialog Props Interface

```typescript
interface CatFarmDialogsProps {
  // ... existing props ...
  
  // Orphan Recovery (NEW)
  orphanedCats: OrphanedCat[];
  showOrphanDialog: boolean;
  onRecoverOrphans: (cats: OrphanedCat[]) => Promise<void>;
  onDismissOrphans: () => void;
}
```

### GameHookDependencies Update

```typescript
interface GameHookDependencies {
  // ... existing fields ...
  
  /** Create a tagged snapshot for data recovery */
  createEventSnapshot?: (
    eventType: SnapshotEventType, 
    catNames?: string[]
  ) => Promise<void>;
}
```

### Example Snapshot Call in useCatManagement

```typescript
const sellCat = useCallback((catId: string) => {
  setState((prev) => {
    const cat = prev.cats.find((c) => c.id === catId);
    if (!cat) return prev;
    
    // Create snapshot BEFORE selling (for recovery)
    deps.createEventSnapshot?.('cat_sold', [cat.name]);
    
    // ... rest of sell logic ...
  });
}, [deps]);
```

---

## Summary

| Category | Status |
|----------|--------|
| Core hooks created | ✅ 3/3 complete |
| Edge function updated | ✅ Complete |
| UI dialog created | ✅ Complete |
| UI dialog rendered | ❌ Missing |
| Snapshot integration | ❌ Not wired to game actions |
| Documentation | ❌ Not updated |

The implementation is approximately **60% complete**. The hooks and components exist but integration and documentation are missing.
