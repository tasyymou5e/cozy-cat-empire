
# Data Protection & Recovery Enhancement Plan

## Overview

This plan implements three protection measures to prevent cat data loss:

1. **Save Snapshots on Significant Events** - Capture snapshots when portraits are generated or purchases are made
2. **Cat Orphan Detection** - Check for gallery photos referencing missing cats on game load
3. **Portrait URL Persistence Check** - Verify portrait URLs on Empire page load and offer auto-repair

---

## Feature 1: Enhanced Save Snapshots

### Current State
The `useCloudSave.ts` hook already creates auto snapshots on every save. We need to add **event-triggered snapshots** with a specific type label for significant events.

### 1.1 - Update Edge Function: generate-cat-portrait

After successful portrait generation, trigger a snapshot with type `portrait_generated`.

**File:** `supabase/functions/generate-cat-portrait/index.ts`

**Changes:**
- After successful portrait upload (around line 684), insert a snapshot into `save_snapshots` table
- Use the Supabase client to create a tagged snapshot with `snapshot_type: 'portrait_generated'`

```typescript
// After portrait is generated, create a recovery snapshot
await supabase.from('save_snapshots').insert({
  user_id: userId,
  snapshot_type: 'portrait_generated',
  cat_count: -1, // Will be updated by game on next save
  cat_names: [cat.name],
  day: -1,
  money: -1,
  game_state_hash: `portrait_${cat.id}_${Date.now()}`,
});
```

### 1.2 - New Hook: useEventSnapshots

**File:** `src/hooks/useEventSnapshots.ts`

Create a hook to trigger snapshots on significant in-game events:

```typescript
export function useEventSnapshots(userId: string | undefined, state: GameState) {
  const createEventSnapshot = useCallback(async (eventType: string, metadata?: Record<string, any>) => {
    if (!userId) return;
    
    await supabase.from('save_snapshots').insert({
      user_id: userId,
      snapshot_type: eventType, // 'purchase', 'cat_sale', 'breeding_success', etc.
      cat_count: state.cats.length,
      cat_names: state.cats.map(c => c.name),
      day: state.day,
      money: state.money,
      game_state_hash: generateHash(state, metadata),
    });
  }, [userId, state]);

  return { createEventSnapshot };
}
```

### 1.3 - Integrate Snapshots into Game Actions

**File:** `src/hooks/game/useCatManagement.ts`

Add snapshot triggers to significant actions:
- `sellCat` → snapshot before sale
- `adoptCat` / `addCat` → snapshot after adoption

**File:** `src/hooks/game/useBreeding.ts`

- `breedCats` success → snapshot after kitten is born

**File:** `src/hooks/game/useCostumes.ts`

- Costume purchase → snapshot before purchase

---

## Feature 2: Cat Orphan Detection

### 2.1 - New Hook: useOrphanDetection

**File:** `src/hooks/useOrphanDetection.ts`

Checks for gallery photos that reference cat IDs not in the current save:

```typescript
export interface OrphanedCat {
  catId: string;
  catName: string;
  portraitUrl?: string;
  galleryPhotoCount: number;
  lastSeen: string;
}

export function useOrphanDetection(userId: string | undefined, currentCatIds: string[]) {
  const [orphanedCats, setOrphanedCats] = useState<OrphanedCat[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const checkForOrphans = useCallback(async () => {
    if (!userId) return;
    setIsChecking(true);

    // 1. Get all gallery photos for this user
    const { data: galleryPhotos } = await supabase
      .from('gallery_photos')
      .select('cat_id, cat_name')
      .eq('user_id', userId);

    // 2. Get AI portraits from ai_usage_log
    const { data: aiLogs } = await supabase
      .from('ai_usage_log')
      .select('metadata')
      .eq('user_id', userId)
      .eq('function_name', 'generate-cat-portrait')
      .eq('status', 'success');

    // 3. Find cat IDs referenced in gallery but not in current save
    const galleryCatIds = new Set(galleryPhotos?.map(p => p.cat_id) || []);
    const currentCatIdSet = new Set(currentCatIds);
    
    const orphans: OrphanedCat[] = [];
    galleryCatIds.forEach(catId => {
      if (!currentCatIdSet.has(catId)) {
        // Find portrait URL from AI logs
        const logEntry = aiLogs?.find(l => l.metadata?.cat_id === catId);
        const photo = galleryPhotos?.find(p => p.cat_id === catId);
        
        orphans.push({
          catId,
          catName: photo?.cat_name || 'Unknown',
          portraitUrl: logEntry?.metadata?.portrait_url,
          galleryPhotoCount: galleryPhotos?.filter(p => p.cat_id === catId).length || 0,
          lastSeen: logEntry?.metadata?.created_at || 'Unknown',
        });
      }
    });

    setOrphanedCats(orphans);
    setIsChecking(false);
  }, [userId, currentCatIds]);

  return { orphanedCats, isChecking, checkForOrphans };
}
```

### 2.2 - Recovery Dialog Component

**File:** `src/components/game/OrphanRecoveryDialog.tsx`

A dialog that appears when orphaned cats are detected:

```typescript
interface OrphanRecoveryDialogProps {
  orphanedCats: OrphanedCat[];
  open: boolean;
  onClose: () => void;
  onRecover: (catIds: string[]) => Promise<void>;
}

export function OrphanRecoveryDialog({ orphanedCats, open, onClose, onRecover }: OrphanRecoveryDialogProps) {
  // Shows list of orphaned cats with their portraits
  // "Recover Selected" button to add them back to the game
  // "Dismiss" to ignore
}
```

### 2.3 - Integration into Cloud Load Flow

**File:** `src/hooks/handlers/useCloudHandlers.ts`

After successful cloud load, trigger orphan detection:

```typescript
// After loading cloud save successfully
if (data) {
  actions.loadFromData?.(data.game_state, data.kittens_bred, data.relationships);
  
  // Check for orphaned cats
  const catIds = data.game_state.cats.map(c => c.id);
  checkForOrphans(catIds);
}
```

---

## Feature 3: Portrait URL Persistence Check

### 3.1 - New Hook: usePortraitReconciliation

**File:** `src/hooks/usePortraitReconciliation.ts`

Verifies that cats with gallery photos have their `portraitUrl` populated:

```typescript
export interface MissingPortraitCat {
  catId: string;
  catName: string;
  expectedPortraitUrl: string;
}

export function usePortraitReconciliation(
  userId: string | undefined,
  cats: Cat[],
  updateCat: (catId: string, updates: Partial<Cat>) => void
) {
  const [missingPortraits, setMissingPortraits] = useState<MissingPortraitCat[]>([]);

  const reconcilePortraits = useCallback(async () => {
    if (!userId || cats.length === 0) return;

    // 1. Get all successful AI portrait logs for this user
    const { data: aiLogs } = await supabase
      .from('ai_usage_log')
      .select('metadata')
      .eq('user_id', userId)
      .eq('function_name', 'generate-cat-portrait')
      .eq('status', 'success')
      .order('created_at', { ascending: false });

    if (!aiLogs) return;

    // 2. Build a map of cat_id -> latest portrait_url
    const portraitMap = new Map<string, string>();
    aiLogs.forEach(log => {
      const catId = log.metadata?.cat_id;
      const url = log.metadata?.portrait_url;
      if (catId && url && !portraitMap.has(catId)) {
        portraitMap.set(catId, url);
      }
    });

    // 3. Find cats that should have portraits but don't
    const missing: MissingPortraitCat[] = [];
    cats.forEach(cat => {
      const expectedUrl = portraitMap.get(cat.id);
      if (expectedUrl && !cat.portraitUrl) {
        missing.push({
          catId: cat.id,
          catName: cat.name,
          expectedPortraitUrl: expectedUrl,
        });
      }
    });

    setMissingPortraits(missing);
  }, [userId, cats]);

  const autoRepairPortraits = useCallback(async () => {
    for (const missing of missingPortraits) {
      updateCat(missing.catId, { portraitUrl: missing.expectedPortraitUrl });
    }
    setMissingPortraits([]);
  }, [missingPortraits, updateCat]);

  return { missingPortraits, reconcilePortraits, autoRepairPortraits };
}
```

### 3.2 - Empire Page Integration

**File:** `src/pages/Empire.tsx`

Add portrait reconciliation on page load:

```typescript
// After loading game state
const { missingPortraits, reconcilePortraits, autoRepairPortraits } = usePortraitReconciliation(
  user?.id,
  state.cats,
  actions.updateCat
);

// Run reconciliation after load
useEffect(() => {
  if (hasLoadedCloud && state.cats.length > 0) {
    reconcilePortraits();
  }
}, [hasLoadedCloud, state.cats.length, reconcilePortraits]);

// Auto-repair missing portraits
useEffect(() => {
  if (missingPortraits.length > 0) {
    console.log(`[Empire] Auto-repairing ${missingPortraits.length} missing portrait URLs`);
    autoRepairPortraits();
    saveGame(); // Persist the repair
  }
}, [missingPortraits, autoRepairPortraits, saveGame]);
```

---

## Files Summary

### New Files (4 files)

| File | Purpose |
|------|---------|
| `src/hooks/useEventSnapshots.ts` | Trigger snapshots on significant game events |
| `src/hooks/useOrphanDetection.ts` | Detect gallery photos referencing missing cats |
| `src/hooks/usePortraitReconciliation.ts` | Verify and repair missing portrait URLs |
| `src/components/game/OrphanRecoveryDialog.tsx` | UI for recovering lost cats |

### Modified Files (6 files)

| File | Changes |
|------|---------|
| `supabase/functions/generate-cat-portrait/index.ts` | Add snapshot after portrait generation |
| `src/hooks/handlers/useCloudHandlers.ts` | Integrate orphan detection after cloud load |
| `src/hooks/game/useCatManagement.ts` | Add snapshot triggers for sell/adopt |
| `src/hooks/game/useBreeding.ts` | Add snapshot on breeding success |
| `src/pages/Empire.tsx` | Add portrait reconciliation on page load |
| `src/hooks/useCatFarmState.ts` | Add orphan detection to state |

---

## Technical Flow Diagrams

### Snapshot Flow
```text
User Action (portrait/purchase/breed)
    ↓
useEventSnapshots.createEventSnapshot()
    ↓
INSERT into save_snapshots table
    ↓
Background: Prune old snapshots (keep 10)
```

### Orphan Detection Flow
```text
Cloud Load Complete
    ↓
useOrphanDetection.checkForOrphans()
    ↓
Query gallery_photos + ai_usage_log
    ↓
Compare cat IDs with current save
    ↓
If orphans found → Show OrphanRecoveryDialog
    ↓
User selects cats → Inject into game_state
    ↓
Trigger cloud save
```

### Portrait Reconciliation Flow
```text
Empire Page Load
    ↓
usePortraitReconciliation.reconcilePortraits()
    ↓
Query ai_usage_log for portrait URLs
    ↓
Compare with cat.portraitUrl
    ↓
If missing → autoRepairPortraits()
    ↓
Update cats in state
    ↓
Save to cloud
```

---

## Implementation Priority

1. **Portrait Reconciliation** (simplest, immediate value for Empire page)
2. **Orphan Detection** (catches data loss after the fact)
3. **Event Snapshots** (prevents future data loss)

---

## Database Requirements

No new tables needed - uses existing:
- `save_snapshots` (with new `snapshot_type` values: `portrait_generated`, `purchase`, `cat_sold`, `breeding_success`)
- `gallery_photos` (read-only)
- `ai_usage_log` (read-only)

---

## Testing Considerations

- Test orphan detection with a user who has gallery photos but missing cats
- Test portrait reconciliation by manually clearing `portraitUrl` from a cat
- Verify snapshots are created on portrait generation, purchases, and breeding
- Ensure auto-repair doesn't trigger infinite save loops
