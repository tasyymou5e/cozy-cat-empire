# Cat Data Sync & Recovery System

## Overview

This document describes the cat data synchronization system, snapshot-based recovery, integrity monitoring, and the data protection measures implemented to prevent cat data loss.

## Data Flow

```
Browser localStorage → useCloudSave → game_saves table → Empire rendering
                    ↓
              save_snapshots (for recovery)
```

## Save Snapshots

Every cloud save creates a snapshot in `save_snapshots` table containing:
- `cat_count` - Number of cats at save time
- `cat_names` - Array of cat names for searching
- `day` - Game day at save time
- `money` - Money at save time
- `game_state_hash` - Quick comparison hash
- `snapshot_type` - Type of event that triggered the snapshot

**Retention:** Last 15 snapshots per user are kept.

### Snapshot Types

| Type | Trigger | Purpose |
|------|---------|---------|
| `auto` | Periodic auto-save | Regular checkpoint |
| `portrait_generated` | AI portrait created | Capture state when expensive operation completes |
| `cat_sold` | Cat sold | Pre-sale backup for recovery |
| `cat_adopted` | Cat adopted | Post-adoption confirmation |
| `breeding_success` | Kitten born | Capture new cat data |
| `purchase` | Costume bought | Transaction record |
| `manual_save` | User-initiated save | User preference point |

---

## Event-Triggered Snapshots

### useEventSnapshots Hook

**File:** `src/hooks/useEventSnapshots.ts`

Provides `createEventSnapshot(eventType, catNames?)` to create tagged snapshots on significant events.

**Features:**
- Debouncing (5s default) to prevent rapid duplicate snapshots
- Auto-pruning to keep only the most recent 15 snapshots
- Non-blocking async operation

### Integration Points

Event snapshots are triggered from domain hooks:

| Hook | Event | Trigger Point |
|------|-------|---------------|
| `useCatManagement.ts` | `cat_sold` | Before cat removal |
| `useCatManagement.ts` | `cat_adopted` | After cat added |
| `useBreeding.ts` | `breeding_success` | After kitten created |
| `useCostumes.ts` | `purchase` | After costume bought |
| `generate-cat-portrait` | `portrait_generated` | Edge function after upload |

### Flow Diagram

```
User Action (sell/adopt/breed/purchase)
    ↓
Domain Hook (useCatManagement, useBreeding, etc.)
    ↓
createEventSnapshot(eventType, catNames)
    ↓
INSERT into save_snapshots table
    ↓
Prune old snapshots (keep 15)
```

---

## Cat Orphan Detection

### Overview

Detects cats that exist in gallery photos or AI usage logs but are missing from the current game save. This catches data loss after the fact and offers recovery.

### useOrphanDetection Hook

**File:** `src/hooks/useOrphanDetection.ts`

**Features:**
- Cross-references `gallery_photos` and `ai_usage_log` with current save
- Finds cats with portraits/photos but no longer in save
- Provides recovery function to re-add lost cats

### OrphanRecoveryDialog Component

**File:** `src/components/game/OrphanRecoveryDialog.tsx`

**Features:**
- Shows list of orphaned cats with their portraits
- Multi-select for batch recovery
- Creates placeholder cat data from available metadata
- Injects recovered cats into game state

### Integration

Orphan detection runs automatically after cloud load:

```
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

---

## Portrait URL Persistence Check

### Overview

Verifies that cats with AI-generated portraits have their `portraitUrl` field populated. Auto-repairs missing URLs by cross-referencing the `ai_usage_log`.

### usePortraitReconciliation Hook

**File:** `src/hooks/usePortraitReconciliation.ts`

**Features:**
- Queries `ai_usage_log` for successful portrait generations
- Compares with current cat `portraitUrl` fields
- Auto-repairs missing URLs
- Shows toast notification for repairs
- Triggers save to persist repairs

### Integration (Empire Page)

```typescript
// Empire.tsx - runs on page load
useEffect(() => {
  if (hasLoadedCloud && state.cats.length > 0) {
    reconcilePortraits();
  }
}, [hasLoadedCloud, state.cats.length]);

// Auto-repair when missing portraits found
useEffect(() => {
  if (missingPortraits.length > 0) {
    autoRepairPortraits();
    saveGame(); // Persist the repair
  }
}, [missingPortraits]);
```

---

## Sync Health Check

A cron job runs every 10 minutes to validate data integrity:

### Checks Performed
1. **Cat array validation** - Cats array exists and is valid
2. **Capacity check** - Cat count vs space limit
3. **Zero cats detection** - 0 cats after day 1 = critical
4. **Duplicate IDs** - No duplicate cat IDs
5. **Field validation** - Required fields present
6. **Value ranges** - Health 0-100, grade 1-20
7. **Money validation** - No negative values

### Issue Severities
- **Critical** - Data loss indicators (0 cats, invalid state)
- **Warning** - Data anomalies (over capacity, duplicates)
- **Info** - Minor issues (grade out of range)

---

## Recovery Tools

### Admin Save Recovery Page (`/catking/save-recovery`)

1. Search by user ID and cat names
2. View snapshot history
3. See related errors
4. Check portrait bucket for evidence
5. Get automated recommendations

### Edge Functions

- `recover-lost-cats` - Search for lost cat evidence
- `sync-health-check` - Periodic integrity validation
- `generate-cat-portrait` - Creates `portrait_generated` snapshot

---

## Troubleshooting

### Cats Missing from Empire Page

1. Check if cats exist in `game_saves.game_state.cats`
2. Check if `portraitUrl` is set (fallback to SVG if not)
3. Review `save_snapshots` for when cats disappeared
4. Check `error_logs` for save failures

### Data Loss Prevention

The system prevents saves when:
- Cloud data hasn't loaded yet
- Empty cats array on day > 1
- Day 1 empty state without `isNewUser` flag

---

## Database Tables

### save_snapshots
```sql
CREATE TABLE save_snapshots (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  snapshot_type TEXT NOT NULL,
  cat_count INTEGER NOT NULL,
  cat_names TEXT[] NOT NULL,
  day INTEGER NOT NULL,
  money INTEGER NOT NULL,
  game_state_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ
);
```

### sync_health_log
```sql
CREATE TABLE sync_health_log (
  id UUID PRIMARY KEY,
  run_at TIMESTAMPTZ NOT NULL,
  saves_checked INTEGER NOT NULL,
  saves_with_issues INTEGER NOT NULL,
  total_issues INTEGER NOT NULL,
  issue_summary JSONB,
  execution_time_ms INTEGER
);
```

---

## Related Files

| File | Purpose |
|------|---------|
| `src/hooks/useEventSnapshots.ts` | Event-triggered snapshot creation |
| `src/hooks/useOrphanDetection.ts` | Detect gallery cats missing from save |
| `src/hooks/usePortraitReconciliation.ts` | Auto-repair missing portrait URLs |
| `src/components/game/OrphanRecoveryDialog.tsx` | UI for recovering lost cats |
| `src/hooks/handlers/useCloudHandlers.ts` | Cloud sync and orphan detection integration |
| `supabase/functions/generate-cat-portrait/index.ts` | Creates snapshot after portrait |
