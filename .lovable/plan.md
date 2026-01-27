
# Auto-Save Feature Implementation Plan

## Overview

Enhance the existing auto-save system to automatically save player state every **1 minute** in the background with no user interaction required. This includes comprehensive error logging, status indicators, and a test plan for validation.

---

## Current State Analysis

### Existing Implementation
- **`useAutoSave.ts`**: Hook exists with 5-minute interval, change detection, and safety guards
- **`useCloudHandlers.ts:98-119`**: Manual `setInterval` implementation for 5-minute auto-save
- **Problem**: Two parallel implementations exist; the robust `useAutoSave` hook is not being used

### Gap Identified
The `useAutoSave` hook has better features (change detection, error callbacks, state hashing) but isn't integrated. The manual implementation in `useCloudHandlers.ts` lacks error logging.

---

## Implementation Steps

### Step 1: Enhance `useAutoSave.ts` Hook

**Changes:**
1. Change default interval from 5 minutes to 1 minute (`60 * 1000` ms)
2. Add comprehensive error logging to database
3. Add save status tracking (last save time, save count, error count)
4. Add retry logic for failed saves
5. Improve state hash to include more fields

**File: `src/hooks/useAutoSave.ts`**

```typescript
// Key changes:
const DEFAULT_INTERVAL_MS = 60 * 1000; // 1 minute instead of 5

// Add save statistics tracking
interface AutoSaveStats {
  lastSaveTime: string | null;
  saveCount: number;
  errorCount: number;
  lastError: string | null;
}

// Add retry logic
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 5000;

// Add error logging callback
onSaveError?: (error: Error, retryCount: number) => void;
```

### Step 2: Integrate Error Logging

**Add to `useAutoSave.ts`:**
- Import and use `useErrorLogger` or `logErrorToDatabase`
- Log auto-save failures with context (retry count, state hash, user ID snippet)
- Create new error type: `auto_save_error`

```typescript
import { logErrorToDatabase } from '@/hooks/useErrorLogger';

// On error:
await logErrorToDatabase({
  error_type: 'auto_save_error',
  error_message: `Auto-save failed: ${error.message}`,
  user_id: userId,
  metadata: {
    retryCount,
    stateHash: currentHash,
    catsCount: gameState.cats.length,
    day: gameState.day,
  }
});
```

### Step 3: Replace Manual Implementation in `useCloudHandlers.ts`

**Remove:**
- Lines 98-119: The manual `setInterval` auto-save logic

**Replace with:**
- Integration of the enhanced `useAutoSave` hook
- Pass callbacks for UI updates (syncing indicator, last save time)

**File: `src/hooks/handlers/useCloudHandlers.ts`**

```typescript
import { useAutoSave } from '@/hooks/useAutoSave';

// In useCloudHandlers:
useAutoSave(
  auth.user?.id,
  state,
  kittensBreed,
  relationshipSystem.getRelationshipSaveData(),
  {
    intervalMs: 60 * 1000, // 1 minute
    enabled: !!auth.user && ui.hasLoadedCloud,
    onSaveStart: () => ui.setCloudSyncing(true),
    onSaveComplete: () => {
      ui.setCloudSyncing(false);
      ui.setLastCloudSave(new Date().toISOString());
    },
    onSaveError: (error) => {
      ui.setCloudSyncing(false);
      console.error('[AutoSave] Error:', error);
    },
  }
);
```

### Step 4: Add Visual Status Indicator (Optional Enhancement)

**Update `CompactStatusBar.tsx` or create `AutoSaveIndicator.tsx`:**
- Show last save time
- Show saving spinner when `cloudSyncing` is true
- Show error indicator if recent save failed

---

## Technical Details

### Enhanced State Hash

```typescript
const generateStateHash = (state: GameState, kittens: number): string => {
  return JSON.stringify({
    catsCount: state.cats.length,
    catIds: state.cats.map((c) => c.id).sort(),
    catStates: state.cats.map((c) => `${c.id}:${c.health}:${c.happiness}:${c.hunger}`),
    money: state.money,
    day: state.day,
    kittens,
    achievements: state.achievements.filter((a) => a.unlocked).length,
    resourcesHash: `${state.resources.food}-${state.resources.medicine}-${state.resources.toys}-${state.resources.treats}`,
    reputation: state.reputation,
    totalShowWins: state.totalShowWins,
  });
};
```

### Retry Logic

```typescript
const performAutoSaveWithRetry = async (retryCount = 0) => {
  try {
    const result = await cloudSave(gameState, kittensBreed, relationshipData);
    if (result.success) {
      onSaveComplete?.();
    } else if (retryCount < MAX_RETRIES) {
      setTimeout(() => performAutoSaveWithRetry(retryCount + 1), RETRY_DELAY_MS);
    } else {
      await logError(result.error);
      onSaveError?.(new Error(result.error || 'Save failed'));
    }
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      setTimeout(() => performAutoSaveWithRetry(retryCount + 1), RETRY_DELAY_MS);
    } else {
      await logError(error);
      onSaveError?.(error);
    }
  }
};
```

---

## Test Plan

### Unit Tests: `src/hooks/__tests__/useAutoSave.test.ts`

```text
┌─────────────────────────────────────────────────────────────────┐
│                     useAutoSave Test Suite                      │
├─────────────────────────────────────────────────────────────────┤
│ 1. Interval Behavior                                            │
│    ├── saves at configured interval (1 minute)                  │
│    ├── clears interval on unmount                               │
│    └── restarts interval when interval changes                  │
├─────────────────────────────────────────────────────────────────┤
│ 2. Change Detection                                             │
│    ├── skips save when state unchanged                          │
│    ├── saves when cats added/removed                            │
│    ├── saves when money changes                                 │
│    ├── saves when resources change                              │
│    └── saves when day advances                                  │
├─────────────────────────────────────────────────────────────────┤
│ 3. Guard Conditions                                             │
│    ├── does not save when userId is undefined                   │
│    ├── does not save when enabled is false                      │
│    ├── does not save while another save is in progress          │
│    └── logs skip reason to console                              │
├─────────────────────────────────────────────────────────────────┤
│ 4. Error Handling                                               │
│    ├── retries on failure (up to MAX_RETRIES)                   │
│    ├── logs error to database after max retries                 │
│    ├── calls onSaveError callback                               │
│    └── continues interval after error                           │
├─────────────────────────────────────────────────────────────────┤
│ 5. Callbacks                                                    │
│    ├── calls onSaveStart before save                            │
│    ├── calls onSaveComplete on success                          │
│    └── calls onSaveError on failure                             │
├─────────────────────────────────────────────────────────────────┤
│ 6. Page Lifecycle                                               │
│    ├── attempts save on beforeunload                            │
│    └── cleans up event listeners on unmount                     │
└─────────────────────────────────────────────────────────────────┘
```

### Test Implementation Example

```typescript
// src/hooks/__tests__/useAutoSave.test.ts

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from '../useAutoSave';

// Mock dependencies
vi.mock('../useCloudSave', () => ({
  useCloudSave: vi.fn(() => ({
    cloudSave: vi.fn().mockResolvedValue({ success: true }),
  })),
}));

vi.mock('../useErrorLogger', () => ({
  logErrorToDatabase: vi.fn(),
}));

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should save at configured interval', async () => {
    const onSaveComplete = vi.fn();
    const mockState = { cats: [{ id: '1' }], money: 100, day: 1, ... };

    renderHook(() => useAutoSave(
      'user-123',
      mockState,
      0,
      { relationships: [], events: [] },
      { intervalMs: 60000, enabled: true, onSaveComplete }
    ));

    // Fast-forward 1 minute
    await act(async () => {
      vi.advanceTimersByTime(60000);
    });

    expect(onSaveComplete).toHaveBeenCalledTimes(1);
  });

  it('should skip save when state unchanged', async () => {
    // ... test implementation
  });

  it('should retry on failure', async () => {
    // ... test implementation
  });
});
```

### Integration Test Checklist

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Auto-save on interval | 1. Log in 2. Make changes 3. Wait 1 minute | Save occurs automatically, UI shows sync indicator |
| Skip unchanged state | 1. Log in 2. Wait 1 minute without changes | No save occurs (verified via network tab) |
| Error recovery | 1. Log in 2. Disconnect network 3. Wait for save 4. Reconnect | Error logged, retry succeeds on reconnect |
| Race condition guard | 1. Log in fresh 2. Wait for cloud load 3. First save | Save only occurs after `hasLoadedCloud` is true |
| Page close save | 1. Make changes 2. Close tab | Final save attempted (best effort) |

### Manual QA Validation Steps

1. **Login and Observe**
   - Log in as test user
   - Open browser DevTools → Network tab
   - Verify save request every ~1 minute to `/rest/v1/game_saves`

2. **Verify Change Detection**
   - Wait 1 minute with no changes → No request
   - Add a cat → Wait 1 minute → Request made
   - Feed cats → Wait 1 minute → Request made

3. **Error Logging Verification**
   - Temporarily modify `cloudSave` to fail
   - Wait for save attempt
   - Check `error_logs` table for `auto_save_error` entries

4. **UI Indicator Check**
   - Observe cloud sync icon during save
   - Verify "last saved" timestamp updates

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useAutoSave.ts` | Enhance with 1-min interval, retry logic, error logging, callbacks |
| `src/hooks/handlers/useCloudHandlers.ts` | Remove manual interval, integrate useAutoSave hook |
| `src/hooks/useCatFarmUIState.ts` | Ensure `cloudSyncing` and `lastCloudSave` states exist (already present) |
| `src/hooks/__tests__/useAutoSave.test.ts` | **NEW** - Comprehensive test suite |

---

## Error Logging Schema

Auto-save errors will be logged to the existing `error_logs` table with:

```json
{
  "error_type": "auto_save_error",
  "error_message": "Auto-save failed after 2 retries: Network error",
  "user_id": "uuid",
  "metadata": {
    "retryCount": 2,
    "stateHash": "abc123...",
    "catsCount": 5,
    "day": 15,
    "intervalMs": 60000,
    "lastSuccessfulSave": "2026-01-27T10:00:00Z"
  }
}
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| More frequent saves = more DB writes | Change detection prevents unnecessary saves |
| Network flakiness causes errors | Retry logic with exponential backoff |
| Save during initial load causes data loss | `enabled` flag requires `hasLoadedCloud` |
| Performance impact | State hashing is lightweight; saves are async |

---

## Success Criteria

- [ ] Auto-save occurs every 1 minute when state changes
- [ ] No saves when state is unchanged
- [ ] Errors are logged to `error_logs` with full context
- [ ] UI shows syncing indicator during save
- [ ] All unit tests pass
- [ ] Integration tests verify end-to-end flow
- [ ] No data loss or race conditions in testing
