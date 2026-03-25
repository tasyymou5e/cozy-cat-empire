

# Fix All Testing Gaps + Admin Test Dashboard

## Phase 1: Fix Build Error (immediate)

Remove `interactionCount` from mock data in `src/lib/__tests__/relationshipUtils.test.ts` — that property doesn't exist on `CatRelationship`.

## Phase 2: Create Missing Test Files (~25 hooks)

Create test files for all untested hooks:
- `useClub`, `useCoopChallenges`, `useCollectionProgress`, `useLuckyWheel`
- `useSpecializations`, `useMilestones`, `useMiniGameTrigger`, `useRelationshipReminders`
- `useTabUnlocks`, `useWelcomeBack`, `useGamificationAnalytics`, `usePlayerPrestige`
- `usePrestige`, `usePrefetch`, `useHaptics`, `useKeyboardShortcuts`
- `useGameEvents`, `useGameMessages`, `useDailyWizard`, `useWeeklyEvents`
- `useAICatAdvisor`, `usePortraitReconciliation`, `usePortraitStatus`, `usePortraitStyle`
- `useAuthBackground`, `useAuthSounds`

Each test will follow the existing pattern: mock Supabase, use `renderHook`, test initialization and key behaviors.

## Phase 3: Create `test_reports` Database Table

```sql
CREATE TABLE test_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  run_by UUID NOT NULL,
  total_tests INTEGER NOT NULL DEFAULT 0,
  passed INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  skipped INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER,
  results JSONB NOT NULL DEFAULT '[]',
  environment TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE test_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage test reports"
  ON test_reports FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));
```

## Phase 4: Create Admin Test Dashboard Page

New file: `src/pages/admin/AdminTestDashboard.tsx`

Features:
- Lists all test files discovered in the codebase (hardcoded manifest)
- Shows last run results from `test_reports` table
- "Run Tests" button that executes tests client-side via Vitest browser API and saves results
- Summary cards: total tests, pass rate, coverage by category
- Filterable results table with pass/fail/skip per test file
- Historical run comparison chart

## Phase 5: Add Route

Add `/catking/tests` route in `App.tsx` pointing to `AdminTestDashboard` wrapped in `AdminRoute`.

## Phase 6: Edge Function for Saving Test Results

Create `supabase/functions/save-test-report/index.ts`:
- Accepts POST with test results JSON
- Validates admin JWT
- Inserts into `test_reports` table
- Returns saved report ID

## Technical Details

- **Test runner approach**: Since Vitest runs at build time (not in browser), the dashboard will display a static manifest of test files with their last-known results. The "Run Tests" action will invoke `supabase.functions.invoke('save-test-report')` after tests complete via CI or manual `npx vitest run`.
- **Test file manifest**: A generated `src/test/testManifest.ts` file listing all test file paths and categories for the dashboard to render.
- **No CI/CD workflow file**: GitHub Actions config is outside Lovable's scope, but the edge function + DB table enable CI to POST results.

## Files Changed/Created

| Action | File |
|--------|------|
| Edit | `src/lib/__tests__/relationshipUtils.test.ts` — remove `interactionCount` |
| Create | ~25 new test files in `src/hooks/__tests__/` |
| Create | `src/pages/admin/AdminTestDashboard.tsx` |
| Create | `src/test/testManifest.ts` |
| Create | `supabase/functions/save-test-report/index.ts` |
| Edit | `src/App.tsx` — add `/catking/tests` route |
| Migration | `test_reports` table + RLS |

