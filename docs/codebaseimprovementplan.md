# Comprehensive Codebase Architecture Improvement Plan

## Overview

This plan addresses architectural issues identified in the audit, prioritized by impact and dependency order.

---

## Phase 1: Critical Architecture Refactoring

### Step 1.1: Create Game Action Middleware/Event Bus

**Files to Create:**
- `src/hooks/useGameEvents.ts` - Central event dispatcher

**Purpose:** Replace the 15+ "wrapped" action handlers in CatFarm with a centralized system that automatically handles:
- Progress tracking (objectives, battle pass, coop)
- Sound effects
- Activity logging

**Implementation:**
```typescript
// Instead of:
const wrappedTrainCat = useCallback((catId, trickId) => {
  actions.trainCat(catId, trickId);
  trackObjective('train_cat');
  addBattlePassXP('train_trick');
  updateCoopProgress('combined_training', 1);
}, [...]);

// Use event-driven:
const { dispatchAction } = useGameEvents();
dispatchAction('TRAIN_CAT', { catId, trickId });
// Middleware handles all side effects
```

---

### Step 1.2: Split useGameState into Domain Hooks

**Files to Create:**
- `src/hooks/game/useCatManagement.ts` - Cat CRUD operations
- `src/hooks/game/useResources.ts` - Resource management
- `src/hooks/game/useBreeding.ts` - Breeding mechanics
- `src/hooks/game/useTraining.ts` - Training mechanics
- `src/hooks/game/useCatShows.ts` - Show logic
- `src/hooks/game/useBulkActions.ts` - Bulk operations
- `src/hooks/game/useAchievements.ts` - Achievement tracking
- `src/hooks/game/index.ts` - Composes all domain hooks

**Current useGameState.ts:** 1,444 lines, 60+ useCallback functions

**After refactor:** Each domain hook ~100-200 lines, single responsibility

---

### Step 1.3: Decompose CatFarm.tsx

**Files to Create:**
- `src/components/game/CatFarmHeader.tsx` - Logo, controls, user menu
- `src/components/game/CatFarmContent.tsx` - Cat grid and tabs
- `src/components/game/CatFarmProviders.tsx` - Context providers wrapper
- `src/components/game/panels/FarmPanels.tsx` - Farm category panels
- `src/components/game/panels/CatPanels.tsx` - Cat category panels
- `src/components/game/panels/SocialPanels.tsx` - Social category panels
- `src/components/game/panels/ProgressPanels.tsx` - Progress category panels

**Current CatFarm.tsx:** 1,378 lines

**After refactor:** Main orchestrator ~200 lines, sub-components ~100-200 lines each

---

### Step 1.4: Unify Notification System

**Files to Modify:**
- `src/hooks/useGameState.ts` - Remove internal showMessage
- `src/components/game/MessageBar.tsx` - Integrate with unified system

**Files to Create:**
- `src/hooks/useGameMessages.ts` - Centralized message/toast management

**Unify:**
1. Game action messages (current showMessage)
2. Social notifications (current NotificationCenter)
3. System toasts (current sonner)

---

## Phase 2: Code Organization

### Step 2.1: Centralize Name Generation Data

**Move from:** `src/components/game/UnifiedCatCard.tsx` (lines 68-92)
**Move to:** `src/types/catNames.ts`

```typescript
// src/types/catNames.ts
export const BREED_NAMES: Record<CatBreed, string[]> = {...};
export const PERSONALITY_NAMES: Record<CatPersonality, string[]> = {...};
export const UNIVERSAL_NAMES = [...];
export function generateRandomName(breed: CatBreed, personality: CatPersonality): string;
```

---

### Step 2.2: Remove Deprecated CatCard Wrapper

**Delete:** `src/components/game/CatCard.tsx`

**Update imports in:**
- `src/components/game/CatFarm.tsx`
- Any other files importing CatCard

**Replace with:** Direct `UnifiedCatCard` usage

---

### Step 2.3: Create Barrel Exports

**Create:** `src/hooks/index.ts`

```typescript
// Game hooks
export * from './useGameState';
export * from './useRelationships';
// ... all 44 hooks
```

---

### Step 2.4: Extract Badge Calculation

**Create:** `src/hooks/useBadgeCounts.ts`

Move the 85-line `tabBadges` useMemo from CatFarm.tsx to a dedicated hook that receives the necessary dependencies.

---

## Phase 3: Data Consistency

### Step 3.1: Integrate Specializations with Cat Interface

**Files to Modify:**
- `src/types/game.ts` - Already done ✅
- `src/hooks/useSpecializations.ts` - Update to modify Cat.specialization
- `src/hooks/useGameState.ts` - Add setSpecialization action

Remove localStorage dependency in useSpecializations, rely on cloud save via Cat object.

---

### Step 3.2: Fix Relationship Streak Cloud Sync

**Files to Modify:**
- `src/hooks/useRelationships.ts` - Add cloud sync option
- `src/hooks/useCloudSave.ts` - Include maintenance streak data

---

### Step 3.3: Standardize Component Props

**Establish pattern:** Components receive only the props they need, not entire state objects.

**Audit and update:**
- `BattlePassPanel` - extract needed props from state
- All other panels for consistency

---

## Phase 4: Quality Improvements

### Step 4.1: Add Panel Error Boundaries

**Create:** `src/components/game/PanelErrorBoundary.tsx`

Wrap each `TabsContent` in CatFarm with error boundaries:
```tsx
<TabsContent value="actions">
  <PanelErrorBoundary name="Actions">
    <ActionPanel ... />
  </PanelErrorBoundary>
</TabsContent>
```

---

### Step 4.2: Extract Relationship Utilities

**Create:** `src/lib/relationshipUtils.ts`

Move from UnifiedCatCard:
```typescript
export function getCatRelationships(catId: string, relationships: CatRelationship[]);
export function countFriends(catId: string, relationships: CatRelationship[]);
export function countEnemies(catId: string, relationships: CatRelationship[]);
export function getBestFriend(catId: string, relationships: CatRelationship[], cats: Cat[]);
```

---

### Step 4.3: Standardize Sound Context Usage

**Files to Modify:**
- `src/components/game/CatFarm.tsx` - Use `useSound()` from context instead of `useSoundEffects()` directly

Remove the redundant direct hook call at line 130.

---

## File Summary

### Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useGameEvents.ts` | Central action dispatcher |
| `src/hooks/game/useCatManagement.ts` | Cat CRUD |
| `src/hooks/game/useResources.ts` | Resources |
| `src/hooks/game/useBreeding.ts` | Breeding |
| `src/hooks/game/useTraining.ts` | Training |
| `src/hooks/game/useCatShows.ts` | Shows |
| `src/hooks/game/useBulkActions.ts` | Bulk ops |
| `src/hooks/game/useAchievements.ts` | Achievements |
| `src/hooks/game/index.ts` | Barrel |
| `src/hooks/useGameMessages.ts` | Unified messages |
| `src/hooks/useBadgeCounts.ts` | Badge calculation |
| `src/hooks/index.ts` | Barrel export |
| `src/types/catNames.ts` | Name generation data |
| `src/lib/relationshipUtils.ts` | Relationship utilities |
| `src/components/game/CatFarmHeader.tsx` | Header component |
| `src/components/game/CatFarmContent.tsx` | Content component |
| `src/components/game/CatFarmProviders.tsx` | Providers wrapper |
| `src/components/game/panels/*.tsx` | Category panels |
| `src/components/game/PanelErrorBoundary.tsx` | Error boundary |

### Files to Delete

| File | Reason |
|------|--------|
| `src/components/game/CatCard.tsx` | Deprecated wrapper |

### Files to Heavily Modify

| File | Changes |
|------|---------|
| `src/hooks/useGameState.ts` | Split into domain hooks |
| `src/components/game/CatFarm.tsx` | Decompose into sub-components |
| `src/hooks/useSpecializations.ts` | Integrate with cloud save |
| `src/components/game/UnifiedCatCard.tsx` | Remove name data, use utilities |

---

## Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1 | 1-2 weeks | None |
| Phase 2 | 1 week | Phase 1.2 complete |
| Phase 3 | 1 week | Phase 1 complete |
| Phase 4 | Ongoing | Phase 1-3 complete |

---

## Success Criteria

1. **No single file exceeds 500 lines** (except for generated types)
2. **Each hook has a single responsibility** (~100-200 lines max)
3. **CatFarm.tsx is under 300 lines** (orchestration only)
4. **All game actions go through the event system**
5. **All data persists through cloud save**
6. **Zero console errors on standard gameplay flow**
7. **Unit tests possible for individual domain hooks**
