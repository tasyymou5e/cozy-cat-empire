
# Cat Costume Logic Validation & Error Checking Plan

## Problem Summary

After thorough code review, I've identified several issues with the cat costume logic that need to be fixed and tested:

## Issues Found

### Issue 1: Orphaned Costume Entries When Cats Are Sold (Critical)
**Location:** `src/hooks/game/useCatManagement.ts` (lines 220-237) and `src/hooks/game/useBulkActions.ts` (lines 273-294)

When a cat is sold (both single sale and bulk sale), the code removes the cat from `state.cats` and removes relationships, but **does NOT clean up the `catCostumes` map**. This leads to orphaned entries where deleted cat IDs still reference costume IDs.

```typescript
// Current code in sellCat (line 229-233):
return {
  ...prev,
  money: prev.money + sellPrice,
  cats: prev.cats.filter((c) => c.id !== catId),
  // MISSING: catCostumes cleanup
};
```

**Impact:** Memory leak, potential data corruption if cat IDs are ever reused, bloated save data.

### Issue 2: Missing Ownership Validation When Equipping Costumes
**Location:** `src/hooks/game/useCostumes.ts` (lines 94-122)

The `equipCostume` function does NOT verify that the costume is actually owned before equipping:

```typescript
const equipCostume = useCallback((catId: string, costumeId: string | null) => {
  setState((prev) => {
    const cat = prev.cats.find((c) => c.id === catId);
    if (!cat) return prev;
    // MISSING: Check if costumeId is in prev.ownedCostumes
    const costume = getCostumeById(costumeId);
    if (costume) {
      newCatCostumes[catId] = costumeId; // Can equip unowned costumes!
    }
  });
});
```

**Impact:** Potentially exploitable bug allowing players to equip costumes they haven't purchased.

### Issue 3: No Validation for Invalid Costume IDs
**Location:** `src/hooks/game/useCostumes.ts` (lines 106-112)

If an invalid `costumeId` is passed (one that doesn't exist in the COSTUMES array), `getCostumeById` returns `undefined` and the equip silently fails without user feedback.

### Issue 4: Missing Tests for Costume Logic
**Location:** `src/hooks/game/__tests__/`

There is no `useCostumes.test.ts` file. The costume logic has zero unit test coverage, unlike other domain hooks which have comprehensive test suites.

---

## Implementation Plan

### Phase 1: Fix Costume Cleanup on Cat Sale

**File: `src/hooks/game/useCatManagement.ts`**

Add costume cleanup to `sellCat` function:
```typescript
const sellCat = useCallback((catId: string) => {
  setState((prev) => {
    const cat = prev.cats.find((c) => c.id === catId);
    if (!cat) return prev;
    
    const sellPrice = Math.floor(cat.value * (1 + cat.showWins * 0.1));
    showMessage(`Goodbye ${cat.name}! Sold for $${sellPrice}. 👋`, 'info');
    playSound?.('coin');
    relationshipSystem.removeCatRelationships(catId);
    
    // Clean up costume association
    const newCatCostumes = { ...prev.catCostumes };
    delete newCatCostumes[catId];
    
    return {
      ...prev,
      money: prev.money + sellPrice,
      cats: prev.cats.filter((c) => c.id !== catId),
      catCostumes: newCatCostumes,
    };
  });
}, [setState, showMessage, playSound, relationshipSystem]);
```

**File: `src/hooks/game/useBulkActions.ts`**

Add costume cleanup to `sellSelectedCats` function:
```typescript
const sellSelectedCats = useCallback((catIds: string[]) => {
  if (catIds.length === 0) return;
  setState((prev) => {
    let totalEarnings = 0;
    const catsToSell = prev.cats.filter((c) => catIds.includes(c.id));
    
    catsToSell.forEach((cat) => {
      const sellPrice = Math.floor(cat.value * (1 + cat.showWins * 0.1));
      totalEarnings += sellPrice;
      relationshipSystem.removeCatRelationships(cat.id);
    });
    
    // Clean up costume associations for all sold cats
    const newCatCostumes = { ...prev.catCostumes };
    catIds.forEach(id => delete newCatCostumes[id]);
    
    showMessage(`Sold ${catsToSell.length} cats for $${totalEarnings}! 💰`, 'success');
    playSound?.('coin');
    
    return {
      ...prev,
      money: prev.money + totalEarnings,
      cats: prev.cats.filter((c) => !catIds.includes(c.id)),
      catCostumes: newCatCostumes,
    };
  });
}, [setState, showMessage, playSound, relationshipSystem]);
```

### Phase 2: Add Ownership Validation to equipCostume

**File: `src/hooks/game/useCostumes.ts`**

Update `equipCostume` with proper validation:
```typescript
const equipCostume = useCallback((catId: string, costumeId: string | null) => {
  setState((prev) => {
    const cat = prev.cats.find((c) => c.id === catId);
    if (!cat) {
      showMessage('Cat not found!', 'error');
      return prev;
    }

    const newCatCostumes = { ...prev.catCostumes };

    if (costumeId === null) {
      delete newCatCostumes[catId];
      showMessage(`Removed ${cat.name}'s costume.`, 'info');
    } else {
      // Validate costume exists
      const costume = getCostumeById(costumeId);
      if (!costume) {
        showMessage('Invalid costume!', 'error');
        playSound?.('error');
        return prev;
      }
      
      // Validate costume is owned
      if (!prev.ownedCostumes.includes(costumeId)) {
        showMessage('You don\'t own this costume!', 'error');
        playSound?.('error');
        return prev;
      }
      
      newCatCostumes[catId] = costumeId;
      showMessage(`${cat.name} is now wearing ${costume.name}! ${costume.emoji}`, 'success');
    }

    return { ...prev, catCostumes: newCatCostumes };
  });
}, [setState, showMessage, playSound]);
```

### Phase 3: Create Comprehensive Test Suite

**New File: `src/hooks/game/__tests__/useCostumes.test.ts`**

```typescript
/**
 * @fileoverview Tests for useCostumes hook
 *
 * Tests costume purchasing and equipping operations.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCostumes } from '../useCostumes';
import { createMockDependencies, createMockCat } from '@/test/mocks/gameHookMocks';

describe('useCostumes', () => {
  let mockDeps: ReturnType<typeof createMockDependencies>;

  beforeEach(() => {
    mockDeps = createMockDependencies();
  });

  describe('buyCostume', () => {
    it('should purchase a valid costume', () => {
      mockDeps = createMockDependencies({ money: 500 });
      const { result } = renderHook(() => useCostumes(mockDeps.deps));
      
      act(() => {
        result.current.buyCostume('party_hat'); // costs $50
      });

      const state = mockDeps.getState();
      expect(state.ownedCostumes).toContain('party_hat');
      expect(state.money).toBe(450);
    });

    it('should reject purchase when not enough money', () => {
      mockDeps = createMockDependencies({ money: 10 });
      const { result } = renderHook(() => useCostumes(mockDeps.deps));
      
      act(() => {
        result.current.buyCostume('crown'); // costs $300
      });

      expect(mockDeps.getState().ownedCostumes).not.toContain('crown');
      expect(mockDeps.getMessages()).toContainEqual(
        expect.objectContaining({ type: 'error' })
      );
    });

    it('should reject duplicate purchase', () => {
      mockDeps = createMockDependencies({ 
        money: 500, 
        ownedCostumes: ['party_hat'] 
      });
      const { result } = renderHook(() => useCostumes(mockDeps.deps));
      
      act(() => {
        result.current.buyCostume('party_hat');
      });

      expect(mockDeps.getState().money).toBe(500); // No deduction
      expect(mockDeps.getMessages()).toContainEqual(
        expect.objectContaining({ type: 'warning' })
      );
    });

    it('should reject invalid costume ID', () => {
      const { result } = renderHook(() => useCostumes(mockDeps.deps));
      
      act(() => {
        result.current.buyCostume('invalid_costume_id');
      });

      expect(mockDeps.getMessages()).toContainEqual(
        expect.objectContaining({ msg: 'Costume not found!', type: 'error' })
      );
    });
  });

  describe('equipCostume', () => {
    it('should equip owned costume to cat', () => {
      const cat = createMockCat({ id: 'cat-1' });
      mockDeps = createMockDependencies({ 
        cats: [cat], 
        ownedCostumes: ['crown'] 
      });
      const { result } = renderHook(() => useCostumes(mockDeps.deps));
      
      act(() => {
        result.current.equipCostume('cat-1', 'crown');
      });

      expect(mockDeps.getState().catCostumes['cat-1']).toBe('crown');
    });

    it('should unequip costume when costumeId is null', () => {
      const cat = createMockCat({ id: 'cat-1' });
      mockDeps = createMockDependencies({ 
        cats: [cat], 
        catCostumes: { 'cat-1': 'crown' } 
      });
      const { result } = renderHook(() => useCostumes(mockDeps.deps));
      
      act(() => {
        result.current.equipCostume('cat-1', null);
      });

      expect(mockDeps.getState().catCostumes['cat-1']).toBeUndefined();
    });

    it('should reject equipping unowned costume', () => {
      const cat = createMockCat({ id: 'cat-1' });
      mockDeps = createMockDependencies({ 
        cats: [cat], 
        ownedCostumes: [] // No costumes owned
      });
      const { result } = renderHook(() => useCostumes(mockDeps.deps));
      
      act(() => {
        result.current.equipCostume('cat-1', 'crown');
      });

      expect(mockDeps.getState().catCostumes['cat-1']).toBeUndefined();
      expect(mockDeps.getMessages()).toContainEqual(
        expect.objectContaining({ type: 'error' })
      );
    });

    it('should reject equipping to non-existent cat', () => {
      mockDeps = createMockDependencies({ 
        cats: [], 
        ownedCostumes: ['crown'] 
      });
      const { result } = renderHook(() => useCostumes(mockDeps.deps));
      
      act(() => {
        result.current.equipCostume('non-existent-cat', 'crown');
      });

      expect(Object.keys(mockDeps.getState().catCostumes)).toHaveLength(0);
    });
  });
});
```

### Phase 4: Add Tests for Costume Cleanup on Sale

**Update: `src/hooks/game/__tests__/useCatManagement.test.ts`**

Add new test case to sellCat describe block:
```typescript
it('should remove costume association when cat is sold', () => {
  const cat = createMockCat({ id: 'cat-1', value: 100 });
  mockDeps = createMockDependencies({ 
    cats: [cat], 
    catCostumes: { 'cat-1': 'crown' } 
  });

  const { result } = renderHook(() => useCatManagement(mockDeps.deps));

  act(() => {
    result.current.sellCat('cat-1');
  });

  expect(mockDeps.getState().catCostumes['cat-1']).toBeUndefined();
});
```

**Update: `src/hooks/game/__tests__/useBulkActions.test.ts`**

Add new test case to sellSelectedCats describe block:
```typescript
it('should remove costume associations when cats are sold in bulk', () => {
  const cats = [
    createMockCat({ id: 'cat-1', value: 100 }),
    createMockCat({ id: 'cat-2', value: 100 }),
    createMockCat({ id: 'cat-3', value: 100 }),
  ];
  mockDeps = createMockDependencies({ 
    cats, 
    catCostumes: { 
      'cat-1': 'crown', 
      'cat-2': 'party_hat',
      'cat-3': 'bow_tie' 
    } 
  });

  const { result } = renderHook(() => useBulkActions(mockDeps.deps));

  act(() => {
    result.current.sellSelectedCats(['cat-1', 'cat-3']);
  });

  const costumes = mockDeps.getState().catCostumes;
  expect(costumes['cat-1']).toBeUndefined();
  expect(costumes['cat-2']).toBe('party_hat'); // Kept
  expect(costumes['cat-3']).toBeUndefined();
});
```

### Phase 5: Update Documentation

**Update: `docs/COMPONENTS.md`**

Add section about costume data flow:
```markdown
## Costume System Data Flow

Costumes are managed through the `catCostumes` map in GameState:
- `ownedCostumes: string[]` - List of costume IDs the player owns
- `catCostumes: Record<string, string>` - Maps cat ID to equipped costume ID

### Important Invariants
1. A costume can only be equipped if it exists in `ownedCostumes`
2. When a cat is sold, its entry MUST be removed from `catCostumes`
3. The `getCostumeById()` function validates costume existence
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/game/useCatManagement.ts` | **Modify** | Add catCostumes cleanup in sellCat |
| `src/hooks/game/useBulkActions.ts` | **Modify** | Add catCostumes cleanup in sellSelectedCats |
| `src/hooks/game/useCostumes.ts` | **Modify** | Add ownership validation in equipCostume |
| `src/hooks/game/__tests__/useCostumes.test.ts` | **Create** | Comprehensive costume tests |
| `src/hooks/game/__tests__/useCatManagement.test.ts` | **Modify** | Add costume cleanup test |
| `src/hooks/game/__tests__/useBulkActions.test.ts` | **Modify** | Add costume cleanup test |
| `docs/COMPONENTS.md` | **Modify** | Document costume data flow |

---

## Testing Strategy

1. Run new test suite: `npm test -- useCostumes`
2. Run updated tests: `npm test -- useCatManagement useBulkActions`
3. Manual verification:
   - Buy a costume, equip it, sell the cat → verify costume map is clean
   - Try to equip unowned costume → verify rejection
   - Bulk sell cats with costumes → verify all entries cleaned

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking existing save data | No schema change - just cleanup of orphans |
| Disrupting costume display | No visual changes - only internal validation |
| Performance impact | Minimal - O(1) delete operations |

---

## Summary

The costume logic has three bugs and zero test coverage:
1. **Orphaned entries** - Fixed by adding cleanup on cat sale
2. **Missing ownership check** - Fixed by validating before equip
3. **Silent failures** - Fixed by adding error messages
4. **No tests** - Fixed by creating comprehensive test file

Total effort: ~200 lines of fixes + ~150 lines of tests
