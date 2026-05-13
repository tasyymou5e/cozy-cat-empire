
# Root Cause: Auto-save is silently blocked on every interval

After tracing the save/load pipeline end-to-end, the reason no progress persists is a **dual-instance bug** in `useCloudSave`, not anything wrong with auth, RLS, or the database.

## How saves are wired today

1. `useCatFarmState` creates **instance A**: `const cloudSave = useCloudSave(auth.user?.id)`
2. `useCloudHandlers` calls `cloudSave.cloudLoad()` on **instance A** → sets `instance A.isLoadedRef = true`. Manual "Save to Cloud" button uses instance A and works.
3. `useCloudHandlers` then calls `useAutoSave(...)`, which internally does `const { cloudSave } = useCloudSave(userId)` → creates **instance B**, a brand-new closure with its own `isLoadedRef = false`.
4. The auto-save interval fires every 60s and calls **instance B**'s `cloudSave(...)`. The first guard inside `useCloudSave.cloudSave` is:
   ```ts
   if (!isLoadedRef.current) {
     log.warn('Blocked save: Cloud data not yet loaded');
     return { success: false, error: 'Cloud data not loaded yet' };
   }
   ```
   Instance B's `cloudLoad` is never called, so `isLoadedRef.current` stays `false` forever and **every auto-save is rejected**.

5. `useAutoSave` retries twice (5s apart), then surfaces the failure as an error toast. After the first cycle the in-memory `lastStateHashRef` is still empty, so the next interval re-tries and re-fails. No row is ever written to `game_saves` from background saves. Players only get a save if they manually click the cloud button — and most users won't.

This also explains the symptom "logging in is new each time": the Supabase session itself does persist (AuthContext uses `localStorage`, `persistSession: true`), but because cloud saves never write, the next session loads the last manually-saved state (often empty / day 1), so it *feels* like a fresh login every time.

## The Fix

Make `useAutoSave` reuse the existing `useCloudSave` instance instead of creating its own. Two minimal options; recommended one is option A:

### Option A (recommended): inject the cloudSave function

Change `useAutoSave`'s signature so the caller passes the already-loaded `cloudSave` callback:

```ts
// useAutoSave.ts
export function useAutoSave(
  userId: string | undefined,
  gameState: GameState,
  kittensBreed: number,
  relationshipData: RelationshipSaveData,
  cloudSaveFn: CloudSaveFn,           // NEW
  options: UseAutoSaveOptions = {}
) {
  // remove: const { cloudSave } = useCloudSave(userId);
  // use cloudSaveFn directly
}
```

Then in `useCloudHandlers.ts`:
```ts
const { stats: autoSaveStats, saveNow } = useAutoSave(
  auth.user?.id, state, kittensBreed,
  relationshipSystem.getRelationshipSaveData(),
  cloudSave.cloudSave,            // pass the loaded instance's fn
  { intervalMs: 60_000, enabled: !!auth.user && ui.hasLoadedCloud, ... }
);
```

This guarantees the same `isLoadedRef` that `cloudLoad` flipped to `true` is the one the auto-save guard reads.

### Option B (smaller diff but weaker): expose a setter

Add `markLoaded()` to `useCloudSave`'s return and call it from `useAutoSave` after mount. Rejected because it leaves two diverging instances of subscription/realtime channels.

## Secondary cleanups (same file, same change set)

- Update `src/hooks/__tests__/useAutoSave.test.ts` to pass a stub `cloudSaveFn` argument matching the new signature (existing mocks already simulate `cloudSave` returning `{ success: true }` — just move them to the new arg).
- Add a one-line debug log when an auto-save is skipped due to `!isLoadedRef.current` so this class of bug can't hide silently again.
- No DB migration, no RLS change, no auth change, no edge function change required.

## Files Changed

| Action | File |
|--------|------|
| Edit | `src/hooks/useAutoSave.ts` — accept `cloudSaveFn` arg, drop internal `useCloudSave` call |
| Edit | `src/hooks/handlers/useCloudHandlers.ts` — pass `cloudSave.cloudSave` into `useAutoSave` |
| Edit | `src/hooks/__tests__/useAutoSave.test.ts` — update test calls to new signature |

## Out of scope (intentionally not touched)

- AuthContext / session persistence — already correct (`persistSession: true`, localStorage, `onAuthStateChange` set up before `getSession`).
- RLS policies on `game_saves` — already correct (verified above).
- Manual save flow, cloud load flow, migration, orphan recovery — all functioning; instance A handles them.
- The `cats.length === 0 && day === 1 && !isNewUser` guard — correct anti-data-loss behavior, leave as is.

## Verification after the fix

1. Log in, watch console for `[CloudSync] Save successful` within 60s of any state change.
2. Confirm a row update in `game_saves` (`last_played_at` advances).
3. Hard refresh → state restores to the latest auto-saved point, not the last manual save.
