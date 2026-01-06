# Comprehensive Codebase Architecture Improvement Plan

## Overview

This plan addresses architectural issues identified in the audit, prioritized by impact and dependency order.

---

## Phase 1: Critical Architecture Refactoring

### Step 1.1: Create Game Action Middleware/Event Bus ✅ COMPLETED

**Files Created:**
- `src/types/gameEvents.ts` - GameAction types and ACTION_SIDE_EFFECTS mapping
- `src/hooks/useGameEvents.ts` - Central event dispatcher with dispatchAction function

**Result:**
- Replaced 10 wrapped action handlers in CatFarm.tsx
- Reduced CatFarm.tsx by ~45 lines
- Centralized side effects (objectives, battle pass XP, coop progress)
- All actions now use `dispatchAction('ACTION_NAME', payload)` pattern

**Actions Migrated:**
- FEED_CATS, DO_CHORE, BUY_RESOURCE, USE_MEDICINE
- COMFORT_CAT, SELL_CAT, TRAIN_CAT, BREED_CATS
- SOCIALIZE_CATS, CAT_SHOW


---

### Step 1.2: Split useGameState into Domain Hooks ✅ COMPLETED

**Files Created:**
- `src/hooks/game/types.ts` - Shared types, GameHookDependencies, utility functions (165 lines)
- `src/hooks/game/useCatManagement.ts` - Cat CRUD: addCat, sellCat, renameCat, feedSingleCat, comfortCat, updateCatAppearance, updateCatPortrait, buyFromMarket (185 lines)
- `src/hooks/game/useResources.ts` - Resource management: buyResource, feedCats, useToys, useMedicine, applyResourceEffect, regenerateMarket (155 lines)
- `src/hooks/game/useSaveLoad.ts` - Save/load: saveGame, loadGame, hasSaveGame, resetGame, loadFromData, clearMessage (145 lines)
- `src/hooks/game/useCostumes.ts` - Costume management: buyCostume, equipCostume (85 lines)
- `src/hooks/game/useTraining.ts` - Training: trainCat, restCat, doGroupActivity, socializeCats (165 lines)
- `src/hooks/game/useBreeding.ts` - Breeding: breedCats with compatibility checks and kitten inheritance (175 lines)
- `src/hooks/game/useBulkActions.ts` - Bulk operations: healAllSickCats, restAllTiredCats, comfortAllUnhappyCats, trainAllAvailableCats, sellSelectedCats, socializeAllNeglected (225 lines)
- `src/hooks/game/useCatShows.ts` - Show logic: catShow with tier handling, seasonal events, scoring (195 lines)
- `src/hooks/game/useGameCore.ts` - Core game: doChore, upgradeHouse, nextDay, processDailyEvent, clearDailyEvent, dismissMessage, deductMoney, setMoney (215 lines)
- `src/hooks/game/index.ts` - Composer that combines all 9 domain hooks into unified useGameState export (155 lines)

**Result:**
- Replaced monolithic 1,444-line useGameState.ts with 11 focused domain hooks
- Total: ~1,665 lines across 11 files (better organized, each <225 lines)
- All 42 game actions preserved with identical API
- TypeScript GameActions interface enforces completeness
- Single-line import change: `import { useGameState } from '@/hooks/game'`

**Files Updated to Use Modular Version:**
- `src/components/game/CatFarm.tsx`
- `src/pages/CatCollection.tsx`
- `src/pages/CatCustomization.tsx`
- `src/pages/CatPhotoBooth.tsx`
- `src/pages/CatRelationships.tsx`

**Legacy File:** ✅ Deleted `src/hooks/useGameState.ts` (1,444 lines removed from codebase)

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

### Step 2.1: Centralize Name Generation Data ✅ COMPLETED

**Created:** `src/types/catNames.ts`
**Exported:** `BREED_NAMES`, `PERSONALITY_NAMES`, `UNIVERSAL_NAMES`, `generateRandomCatName()`, `getAllPossibleNames()`

---

### Step 2.2: Remove Deprecated CatCard Wrapper ✅ COMPLETED

**Deleted:** `src/components/game/CatCard.tsx`

**Updated imports in:**
- `src/components/game/CatFarm.tsx` - Now uses `UnifiedCatCard` directly with `variant="card"`

**Replaced with:** Direct `UnifiedCatCard` usage with explicit props (`showStats`, `showRelationships`, `showActions`)

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

### Step 2.4: Extract Badge Calculation ✅ COMPLETED

**Created:** `src/hooks/useBadgeCounts.ts`

Extracted the 85-line `tabBadges` and `categoryBadges` useMemo calculations from CatFarm.tsx into a dedicated hook that receives the necessary dependencies.

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

### Step 4.1: Add Panel Error Boundaries ✅ COMPLETED

**Created:** `src/components/game/PanelErrorBoundary.tsx`
- Lightweight error boundary specific to game panels
- Shows friendly error message with "Try Again" button
- Logs errors to database with panel name context
- Dev mode shows error details

**Updated:** `src/components/game/CatFarm.tsx`
- All 20 TabsContent panels now wrapped with `PanelErrorBoundary`
- Prevents individual panel crashes from taking down the entire game

---

### Step 4.2: Extract Relationship Utilities ✅ COMPLETED

**Created:** `src/lib/relationshipUtils.ts`

**Functions exported:**
- `getCatRelationships(catId, relationships)` - Get all relationships for a cat
- `getOtherCatId(catId, relationship)` - Get the other cat in a relationship
- `filterRelationshipsByLevel(relationships, levels)` - Filter by level(s)
- `countFriends(catId, relationships)` - Count friend relationships
- `countEnemies(catId, relationships)` - Count enemy relationships
- `getFriendRelationships(catId, relationships)` - Get friend relationships
- `getEnemyRelationships(catId, relationships)` - Get enemy relationships
- `getBestFriend(catId, relationships, cats)` - Get best friend cat
- `getWorstEnemy(catId, relationships, cats)` - Get worst enemy cat
- `needsSocialAttention(catId, relationships)` - Check if needs attention
- `getRelationshipSummary(catId, relationships, cats)` - Full summary

**Updated:** `src/components/game/UnifiedCatCard.tsx` - Now imports and uses utility functions

---

### Step 4.3: Standardize Sound Context Usage

**Files to Modify:**
- `src/components/game/CatFarm.tsx` - Use `useSound()` from context instead of `useSoundEffects()` directly

Remove the redundant direct hook call at line 130.

---

## File Summary

### Files Created

| File | Purpose | Status |
|------|---------|--------|
| `src/hooks/useGameEvents.ts` | Central action dispatcher | ✅ Created |
| `src/hooks/game/types.ts` | Shared types & utilities | ✅ Created |
| `src/hooks/game/useCatManagement.ts` | Cat CRUD (8 actions) | ✅ Created |
| `src/hooks/game/useResources.ts` | Resources (6 actions) | ✅ Created |
| `src/hooks/game/useSaveLoad.ts` | Save/load (6 actions) | ✅ Created |
| `src/hooks/game/useCostumes.ts` | Costumes (2 actions) | ✅ Created |
| `src/hooks/game/useBreeding.ts` | Breeding (1 action) | ✅ Created |
| `src/hooks/game/useTraining.ts` | Training (4 actions) | ✅ Created |
| `src/hooks/game/useCatShows.ts` | Shows (1 action) | ✅ Created |
| `src/hooks/game/useBulkActions.ts` | Bulk ops (6 actions) | ✅ Created |
| `src/hooks/game/useGameCore.ts` | Core game (8 actions) | ✅ Created |
| `src/hooks/game/index.ts` | Composer (42 actions total) | ✅ Created |
| `src/hooks/useBadgeCounts.ts` | Badge calculation | ✅ Created |
| `src/types/catNames.ts` | Name generation data | ✅ Created |
| `src/lib/relationshipUtils.ts` | Relationship utilities | ✅ Created |
| `src/components/game/PanelErrorBoundary.tsx` | Error boundary | ✅ Created |
| `src/hooks/useGameMessages.ts` | Unified messages | ❌ Not started |
| `src/hooks/index.ts` | Barrel export | ❌ Not started |
| `src/components/game/CatFarmHeader.tsx` | Header component | ❌ Not started |
| `src/components/game/CatFarmContent.tsx` | Content component | ❌ Not started |
| `src/components/game/CatFarmProviders.tsx` | Providers wrapper | ❌ Not started |
| `src/components/game/panels/*.tsx` | Category panels | ❌ Not started |

### Files Deleted

| File | Status |
|------|--------|
| `src/components/game/CatCard.tsx` | ✅ Deleted (Phase 2.2) |
| `src/hooks/useGameState.ts` | 🔜 Ready to delete (Phase 1.2) |

### Files Modified

| File | Changes | Status |
|------|---------|--------|
| `src/components/game/CatFarm.tsx` | Import from @/hooks/game | ✅ Updated |
| `src/pages/CatCollection.tsx` | Import from @/hooks/game | ✅ Updated |
| `src/pages/CatCustomization.tsx` | Import from @/hooks/game | ✅ Updated |
| `src/pages/CatPhotoBooth.tsx` | Import from @/hooks/game | ✅ Updated |
| `src/pages/CatRelationships.tsx` | Import from @/hooks/game | ✅ Updated |
| `src/hooks/useSpecializations.ts` | Integrate with cloud save | ❌ Not started |
| `src/components/game/UnifiedCatCard.tsx` | Use relationship utilities | ✅ Updated |

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
