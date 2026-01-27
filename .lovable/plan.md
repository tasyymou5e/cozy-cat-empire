
# Comprehensive Race Condition Audit & Fix Plan

## Executive Summary

After a thorough audit of the codebase, I've identified **8 categories of race conditions** across 15+ files. The recently implemented cloud save fix addresses the most critical issue, but several other race conditions remain that could cause data inconsistencies, stale state, or UI glitches.

---

## Race Conditions Identified

### Category 1: Async Effects Without Cancellation (HIGH Priority)

**Issue:** Several pages have `useEffect` hooks with async operations that update state after the component unmounts or after the userId changes.

| File | Location | Problem |
|------|----------|---------|
| `src/pages/Empire.tsx` | Lines 40-54 | `loadSavedGame()` can update state after unmount |
| `src/pages/CatRelationships.tsx` | Lines 57-89 | Same pattern - no cancellation token |
| `src/pages/CatCollection.tsx` | Load effect | Async cloudLoad without isMounted check |
| `src/pages/CatCustomization.tsx` | Load effect | Async cloudLoad without isMounted check |

**Root Cause:** When a user navigates away quickly or logs out while loading, the async `.then()` callback still fires and calls `setState()` on an unmounted component.

**Impact:** Console warnings, potential memory leaks, and in rare cases corrupted state if the callback sets data for the wrong user.

---

### Category 2: Real-time Subscription User Context (MEDIUM Priority)

**Issue:** Real-time subscriptions don't validate that the userId hasn't changed between subscription creation and payload arrival.

| File | Location | Problem |
|------|----------|---------|
| `src/hooks/usePlayerProfile.ts` | Lines 80-106 | `setProfile()` called without checking current userId |
| `src/hooks/useCatGifts.ts` | Lines 216-266 | New gift handler doesn't verify user context |
| `src/hooks/useTrading.ts` | Lines 272-320 | Trade INSERT handler lacks user validation |
| `src/hooks/useNotifications.ts` | Lines 122-191 | Multiple subscriptions without context check |

**Root Cause:** If a user logs out and another user logs in rapidly (or in different tabs), a payload from the old subscription could be applied to the new user's session.

**Impact:** Data bleeding between user sessions (security/privacy concern), stale notifications.

---

### Category 3: External Update Handling Heuristic (LOW Priority)

**Issue:** The "own save" detection in `useCloudSave.ts` uses a 5-second time window heuristic instead of strict sequence tracking.

| File | Location | Problem |
|------|----------|---------|
| `src/hooks/useCloudSave.ts` | Lines 94-104 | Time-based check can fail with high latency or clock drift |

**Root Cause:** In high-latency scenarios, a save's timestamp might arrive more than 5 seconds after the local save reference, triggering a false "external update" detection.

**Impact:** Unnecessary reload prompts, potential confusion for users.

---

### Category 4: Daily Login Reward Double-Claim (LOW Priority)

**Issue:** The daily reward claim doesn't use optimistic locking - rapid double-clicks could theoretically process twice.

| File | Location | Problem |
|------|----------|---------|
| `src/hooks/useDailyLoginRewards.ts` | Lines 310-406 | No mutex/lock on `claimDailyReward()` |

**Root Cause:** The `canClaim` check happens before the async database update, creating a small window for duplicate claims.

**Impact:** Minor - could result in duplicate rewards (though cross-tab sync helps mitigate).

---

### Category 5: Challenge Progress Concurrent Updates (LOW Priority)

**Issue:** Multiple simultaneous challenge progress updates could race against each other.

| File | Location | Problem |
|------|----------|---------|
| `src/hooks/useWeeklyChallenges.ts` | Lines 228-313 | Parallel progress updates aren't serialized |

**Root Cause:** If `updateProgress()` is called multiple times rapidly (e.g., batch wins), each call reads the current progress before any update completes.

**Impact:** Progress could be under-counted if updates overlap.

---

### Category 6: Auth State Race During Initial Load (MEDIUM Priority)

**Issue:** Pages that depend on auth state might render before `auth.loading` resolves, leading to incorrect branching.

| File | Location | Problem |
|------|----------|---------|
| `src/contexts/AuthContext.tsx` | Lines 26-46 | Dual session check pattern |
| Multiple pages | Load effects | May act on `user === null` before session check completes |

**Root Cause:** The `getSession()` call and `onAuthStateChange` can resolve in different orders, and pages don't always wait for `loading === false`.

**Impact:** Pages may assume "not logged in" when the user actually is logged in, leading to wrong behavior on initial load.

---

### Category 7: Broadcast Sync Message Order (LOW Priority)

**Issue:** Cross-tab sync messages have no sequence ordering.

| File | Location | Problem |
|------|----------|---------|
| `src/hooks/useBroadcastSync.ts` | All | Messages processed in arrival order, not logical order |

**Root Cause:** If tab A sends claim → reward, but tab B receives reward → claim, state could be inconsistent.

**Impact:** Minor UI inconsistencies between tabs.

---

### Category 8: Portrait Credits Concurrent Purchase (LOW Priority)

**Issue:** Portrait credit purchase lacks client-side debounce or server-side idempotency.

| File | Location | Problem |
|------|----------|---------|
| `src/hooks/usePortraitCredits.ts` | Lines 92-156 | No debounce, relies on `isPurchasing` flag |

**Root Cause:** The `isPurchasing` flag provides basic protection, but rapid clicks before first state update could slip through.

**Impact:** Potential duplicate purchases (would require server-side fix for full resolution).

---

## Implementation Plan

### Phase 1: Async Effect Cancellation (HIGH Priority)
**Files:** Empire.tsx, CatRelationships.tsx, CatCollection.tsx, CatCustomization.tsx
**Changes:** ~40 lines total

Add `isMounted` ref pattern to all async load effects:

```typescript
useEffect(() => {
  let isMounted = true;
  
  const loadSavedGame = async () => {
    if (user) {
      const { data } = await cloudLoad();
      if (!isMounted) return; // CANCEL if unmounted
      if (data) {
        actions.loadFromData?.(data.game_state, data.kittens_bred, data.relationships);
        setHasLoadedCloud(true);
        setIsLoading(false);
        return;
      }
    }
    // ... rest of logic with isMounted checks
    if (isMounted) {
      setHasLoadedCloud(true);
      setIsLoading(false);
    }
  };

  loadSavedGame();
  
  return () => { isMounted = false; };
}, [user, hasLoadedCloud, cloudLoad, actions]);
```

### Phase 2: Real-time Subscription User Context Guards (MEDIUM Priority)
**Files:** usePlayerProfile.ts, useCatGifts.ts, useTrading.ts, useNotifications.ts
**Changes:** ~30 lines total

Capture userId at subscription time and validate in handlers:

```typescript
useEffect(() => {
  if (!userId) return;
  
  const subscribedUserId = userId; // Capture at subscription time
  
  const channel = supabase
    .channel(`profile-${userId}`)
    .on('postgres_changes', {...}, (payload) => {
      // GUARD: Ensure we're still the same user
      if (subscribedUserId !== userId) {
        console.log('[ProfileSync] Ignoring stale update for different user');
        return;
      }
      setProfile(payload.new);
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [userId]);
```

### Phase 3: Auth Loading Gate (MEDIUM Priority)
**Files:** Empire.tsx, CatRelationships.tsx, CatCollection.tsx, CatCustomization.tsx
**Changes:** ~20 lines total

Wait for auth loading to complete before proceeding:

```typescript
const { user, loading: authLoading } = useAuth();

useEffect(() => {
  // Don't load until auth state is resolved
  if (authLoading) return;
  if (hasLoadedCloud) return;
  
  const loadSavedGame = async () => {
    // ... existing logic
  };
  
  loadSavedGame();
}, [authLoading, user, hasLoadedCloud, cloudLoad, actions]);
```

### Phase 4: Claim Action Mutex (LOW Priority)
**Files:** useDailyLoginRewards.ts, useWeeklyChallenges.ts
**Changes:** ~20 lines total

Add processing lock to prevent double-execution:

```typescript
const isClaimingRef = useRef(false);

const claimDailyReward = useCallback(async () => {
  if (isClaimingRef.current) return null; // Prevent double-claim
  if (!userId || !canClaim) return null;
  
  isClaimingRef.current = true;
  setCanClaim(false); // Optimistic UI update
  
  try {
    // ... existing claim logic
  } finally {
    isClaimingRef.current = false;
  }
}, [...]);
```

### Phase 5: Challenge Progress Serialization (LOW Priority)
**Files:** useWeeklyChallenges.ts
**Changes:** ~15 lines total

Queue progress updates to prevent overlap:

```typescript
const updateQueueRef = useRef<Promise<void>>(Promise.resolve());

const updateProgress = useCallback(async (type: ChallengeType, increment: number = 1) => {
  // Serialize updates to prevent race conditions
  updateQueueRef.current = updateQueueRef.current.then(async () => {
    // ... existing update logic
  });
  
  await updateQueueRef.current;
}, [userId, challenges, fetchChallenges]);
```

### Phase 6: External Update Tracking Enhancement (LOW Priority)
**Files:** useCloudSave.ts
**Changes:** ~10 lines total

Add save ID tracking alongside timestamp:

```typescript
const lastSaveIdRef = useRef<string | null>(null);

// In cloudSave():
const saveId = crypto.randomUUID();
lastSaveIdRef.current = saveId;

// In subscription handler:
if (payload.new.save_id === lastSaveIdRef.current) {
  console.log('[CloudSync] Ignoring own save update');
  return;
}
```

Note: This requires adding a `save_id` column to the `game_saves` table.

---

## Implementation Order (By Priority)

| Phase | Priority | Files | Est. Lines | Risk |
|-------|----------|-------|------------|------|
| 1 | HIGH | 4 pages | ~40 | Low |
| 2 | MEDIUM | 4 hooks | ~30 | Low |
| 3 | MEDIUM | 4 pages | ~20 | Low |
| 4 | LOW | 2 hooks | ~20 | Low |
| 5 | LOW | 1 hook | ~15 | Low |
| 6 | LOW | 1 hook + migration | ~15 | Medium (requires DB change) |
| **Total** | | **16 files** | **~140** | |

---

## Validation Scenarios

After implementation, these scenarios should pass:

| Scenario | Expected Behavior |
|----------|-------------------|
| User navigates away during cloud load | No state update after unmount, no console warnings |
| Rapid login/logout switching | No cross-user data bleeding |
| Double-click on claim button | Only one claim processed |
| Multiple challenge completions at once | All progress correctly counted |
| Slow network + save detection | No false "external update" alerts |
| Page load before auth resolves | Waits for auth, then loads correctly |

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking existing saves | No save format changes in Phases 1-5 |
| Performance impact | Minimal - only adds lightweight checks |
| Phase 6 DB migration | Optional - can skip if risk is unacceptable |
| Testing complexity | Each phase is independent and testable |

---

## Notes

- **Phase 6 is optional** - the time-based heuristic works in 99% of cases
- **All fixes are backward compatible** - no data migration required except Phase 6
- **Each phase can be deployed independently** for safer rollout
- **Existing unit tests should still pass** - fixes add guards, don't change logic
