

# Admin Data Repair Utility & totalMoneyEarned Audit

## Overview

This plan creates a comprehensive Game Save Repair utility in the admin dashboard that automatically detects and fixes corrupted game saves, plus audits and safeguards the `totalMoneyEarned` tracking logic.

---

## Part 1: Admin Game Save Repair Tool

### New Page: `/catking/game-repair`

Create a dedicated admin page for detecting and repairing corrupted game saves.

**File:** `src/pages/admin/AdminGameSaveRepair.tsx`

### Features

#### 1. Corruption Detection Dashboard

Display statistics showing saves with issues:

| Issue Type | Detection Logic | Severity |
|------------|-----------------|----------|
| Negative totalMoneyEarned | `totalMoneyEarned < 0` | High |
| NaN/Undefined money values | `!isFinite(money)` | Critical |
| Negative money | `money < 0` | High |
| Invalid cat ages | `age < 0` or `!isFinite(age)` | Medium |
| Missing required fields | Null checks on core fields | High |
| Corrupted resources | Negative resource counts | Medium |
| Invalid house sizes | Not in valid enum | Low |

#### 2. Affected Users Table

Show users with corrupted saves:
- User email (truncated)
- Display name
- Issue type(s) detected
- Last played date
- Quick actions: Preview, Repair, View Details

#### 3. Auto-Repair Functions

**Individual Repair:**
- Click "Repair" on a single user
- Shows preview of changes before applying
- Logs action to `admin_activity_log`

**Bulk Repair:**
- Select multiple users or "Select All"
- "Preview Bulk Repair" shows summary
- "Apply Repairs" with confirmation dialog

#### 4. Repair Logic (Matches `saveMigration.ts:327-383`)

```typescript
interface RepairResult {
  userId: string;
  issuesFound: string[];
  changesApplied: string[];
  success: boolean;
}

function repairGameSave(gameState: unknown): { repairedState: GameState; changes: string[] } {
  const changes: string[] = [];
  
  // Fix totalMoneyEarned
  if (typeof state.totalMoneyEarned !== 'number' || state.totalMoneyEarned < 0) {
    changes.push(`totalMoneyEarned: ${state.totalMoneyEarned} → 0`);
    state.totalMoneyEarned = Math.max(0, state.totalMoneyEarned || 0);
  }
  
  // Fix money
  if (typeof state.money !== 'number' || state.money < 0) {
    changes.push(`money: ${state.money} → ${Math.max(0, state.money || 100)}`);
    state.money = Math.max(0, state.money || 100);
  }
  
  // Fix cat ages (allow decimals, but not negative)
  state.cats = state.cats.map(cat => ({
    ...cat,
    age: typeof cat.age === 'number' && cat.age >= 0 ? cat.age : 0,
    health: Math.max(0, Math.min(100, cat.health || 100)),
    // ... other cat field repairs
  }));
  
  // ... additional repairs following saveMigration.ts patterns
}
```

### UI Layout

```text
┌─────────────────────────────────────────────────────────────────┐
│ 🔧 Game Save Repair Tool                                        │
│ Detect and fix corrupted game saves                             │
├─────────────────────────────────────────────────────────────────┤
│ Statistics Cards:                                               │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐│
│ │ ⚠️ Negative   │ │ 💰 Invalid   │ │ 🐱 Bad Cat   │ │ 📦 Bad   ││
│ │ Earnings     │ │ Money        │ │ Data         │ │ Resources││
│ │     3        │ │     1        │ │     0        │ │     2    ││
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘│
├─────────────────────────────────────────────────────────────────┤
│ Tabs: [All Issues] [Earnings] [Money] [Cats] [Resources]        │
├─────────────────────────────────────────────────────────────────┤
│ Actions: [🔍 Scan All Saves] [✨ Auto-Repair Selected] [Refresh]│
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ☐ | User          | Issues          | Last Played | Actions│ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ ☐ | eric@...      | -$350 earnings  | Jan 27      | 🔧 ✏️  │ │
│ │ ☐ | test@...      | -$50 money      | Jan 26      | 🔧 ✏️  │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 2: Data Hook for Corrupted Saves

### New Hook: `useAdminCorruptedSaves`

**File:** `src/hooks/admin/useAdminCorruptedSaves.ts`

```typescript
interface CorruptedSave {
  userId: string;
  email: string | null;
  displayName: string | null;
  lastPlayedAt: string | null;
  issues: {
    type: 'negative_earnings' | 'invalid_money' | 'bad_cat_data' | 'bad_resources';
    field: string;
    currentValue: unknown;
    suggestedValue: unknown;
  }[];
  gameState: unknown;
}

interface CorruptionStats {
  totalSaves: number;
  corruptedSaves: number;
  negativeEarnings: number;
  invalidMoney: number;
  badCatData: number;
  badResources: number;
}

export function useAdminCorruptedSaves() {
  return useQuery({
    queryKey: ['admin-corrupted-saves'],
    queryFn: async () => {
      // Fetch all game saves with user info
      const { data: saves, error } = await supabase
        .from('game_saves')
        .select(`
          user_id,
          game_state,
          last_played_at,
          profiles!inner(email, display_name)
        `)
        .limit(500);
      
      // Analyze each save for corruption
      const corrupted = saves?.filter(save => {
        const state = save.game_state as Record<string, unknown>;
        return detectCorruption(state).length > 0;
      });
      
      // Calculate stats
      // Return { saves, stats }
    }
  });
}

export function useRepairGameSave() {
  const queryClient = useQueryClient();
  const { logActivity } = useAdminActivityLog();
  
  return useMutation({
    mutationFn: async ({ userId, dryRun = false }) => {
      // Fetch current save
      // Apply repairs
      // If not dryRun, update database
      // Log activity
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-corrupted-saves'] });
    }
  });
}
```

---

## Part 3: totalMoneyEarned Safeguards

### Audit Summary

The audit of the codebase reveals:

| Location | Operation | Status |
|----------|-----------|--------|
| `useResources.ts:252-267` | `addReward()` | ✅ Correct - only adds to earnings |
| `useGameCore.ts:172` | `upgradeHouse()` | ✅ Correct - only deducts from money |
| `useGameCore.ts:323` | `deductMoney()` | ✅ Correct - only deducts from money |
| `useCatManagement.ts:176` | `addCat()` | ✅ Correct - only deducts from money |
| `useCatManagement.ts:210` | `buyFromMarket()` | ✅ Correct - only deducts from money |
| `useResources.ts:100` | `buyResource()` | ✅ Correct - only deducts from money |
| `useCostumes.ts:86` | `buyCostume()` | ✅ Correct - only deducts from money |

**Root Cause of Historical Corruption:** Unknown legacy bug (now fixed). Current code is clean.

### Preventive Safeguards

#### 1. Runtime Validation in `setState`

**File:** `src/hooks/game/useResources.ts` (enhance `addReward`)

Add validation to ensure `totalMoneyEarned` never decreases:

```typescript
const addReward = useCallback(
  (coins: number, resources?: Partial<Resources>) => {
    // Safeguard: Never allow negative coin rewards
    if (coins < 0) {
      console.warn('[addReward] Attempted to add negative coins:', coins);
      return;
    }
    
    setState((prev) => ({
      ...prev,
      money: prev.money + coins,
      // Safeguard: Ensure totalMoneyEarned only increases
      totalMoneyEarned: Math.max(prev.totalMoneyEarned, prev.totalMoneyEarned + coins),
      resources: { /* ... */ },
    }));
  },
  [setState]
);
```

#### 2. Cloud Save Validation

**File:** `src/hooks/useCloudSave.ts` (enhance `cloudSave`)

Add pre-save validation to catch corruption before it persists:

```typescript
const cloudSave = useCallback(async (state: GameState, kittens: number, relationships: unknown) => {
  // Pre-save integrity checks
  const integrityIssues: string[] = [];
  
  if (state.totalMoneyEarned < 0) {
    integrityIssues.push(`Negative totalMoneyEarned: ${state.totalMoneyEarned}`);
    state.totalMoneyEarned = 0; // Auto-fix before save
  }
  
  if (state.money < 0) {
    integrityIssues.push(`Negative money: ${state.money}`);
    state.money = 0;
  }
  
  if (integrityIssues.length > 0) {
    await logErrorToDatabase({
      error_type: 'data_integrity_fix',
      error_message: 'Auto-corrected game state before cloud save',
      metadata: { issues: integrityIssues }
    });
  }
  
  // Proceed with save...
}, []);
```

#### 3. Load-Time Repair

**File:** `src/hooks/useCloudSave.ts` (enhance `cloudLoad`)

The existing `repairGameState` in `saveMigration.ts` already handles this. Ensure it's always called:

```typescript
const cloudLoad = useCallback(async () => {
  const { data, error } = await supabase
    .from('game_saves')
    .select('game_state, kittens_bred, relationships')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (data?.game_state) {
    // Always run through repair/migration
    const migrationResult = migrateSaveData({
      version: data.game_state.version || 1,
      state: data.game_state,
      kittensBreed: data.kittens_bred,
      relationships: data.relationships,
    });
    
    if (migrationResult.success) {
      if (migrationResult.warnings.length > 0) {
        console.warn('[CloudLoad] Migration warnings:', migrationResult.warnings);
      }
      return { data: migrationResult.data };
    }
  }
  // ...
}, [userId]);
```

---

## Part 4: Integration

### Navigation Update

**File:** `src/components/admin/AdminLayout.tsx`

Add new nav item:

```typescript
const ADMIN_NAV_ITEMS = [
  // ... existing items
  { id: 'game-repair', label: 'Game Save Repair', icon: Database, path: '/catking/game-repair' },
  // ...
];
```

### Route Registration

**File:** `src/App.tsx`

Add route:

```tsx
<Route
  path="/catking/game-repair"
  element={
    <AdminRoute>
      <AdminGameSaveRepair />
    </AdminRoute>
  }
/>
```

### Prefetch Registration

**File:** `src/lib/routePrefetch.ts`

Add prefetch:

```typescript
'/catking/game-repair': () => import('@/pages/admin/AdminGameSaveRepair'),
```

---

## Implementation Files Summary

| File | Action | Description |
|------|--------|-------------|
| `src/pages/admin/AdminGameSaveRepair.tsx` | Create | Main repair tool page |
| `src/hooks/admin/useAdminCorruptedSaves.ts` | Create | Data fetching and repair hooks |
| `src/hooks/admin/index.ts` | Update | Export new hooks |
| `src/components/admin/AdminLayout.tsx` | Update | Add nav item |
| `src/App.tsx` | Update | Add route |
| `src/lib/routePrefetch.ts` | Update | Add prefetch |
| `src/hooks/game/useResources.ts` | Update | Add safeguard to addReward |
| `src/hooks/useCloudSave.ts` | Update | Add pre-save validation |

---

## Test Plan

### Manual Testing

| Test Case | Steps | Expected |
|-----------|-------|----------|
| View corrupted saves | Navigate to Game Save Repair | See list of saves with issues |
| Preview repair | Click Preview on a user | See diff of changes |
| Apply single repair | Click Repair → Confirm | Save updated, user removed from list |
| Bulk repair | Select multiple → Apply | All selected saves repaired |
| Verify fix persists | Log in as repaired user | Game loads without corruption errors |

### Safeguard Testing

| Test Case | Steps | Expected |
|-----------|-------|----------|
| Negative reward blocked | Call addReward(-100) | Warning logged, no state change |
| Auto-fix on save | Manually corrupt state, trigger save | State auto-corrected, error logged |
| Load-time repair | Load save with negative earnings | Repaired to 0, warning shown |

---

## Success Criteria

- [ ] Admin can view all game saves with detected corruption issues
- [ ] Stats show counts by issue type
- [ ] Individual repairs work with preview
- [ ] Bulk repairs work with confirmation
- [ ] All repairs are logged to `admin_activity_log`
- [ ] `addReward` rejects negative values
- [ ] Cloud save auto-corrects corruption before persisting
- [ ] No regression in existing save/load functionality

