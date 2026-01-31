

# Winter Wonderland Costume Issue - Comprehensive Analysis & Fix Plan

## Problem Summary

The user is unable to buy the "Winter Wonderland" seasonal costume - the site returns "Costume not found!".

---

## Root Cause Identified

**Critical Bug**: The `getCostumeById()` function in `src/types/costumes.ts` only searches the `COSTUMES` array, which contains **standard costumes only**. Seasonal costumes are defined in a completely separate data structure (`SEASONS` in `src/types/seasonalContent.ts`) and are **never merged** into the lookup function.

### Code Evidence

```typescript
// src/types/costumes.ts (line 275-277)
export function getCostumeById(id: string): Costume | undefined {
  return COSTUMES.find((c) => c.id === id);  // ❌ Only searches standard costumes!
}
```

Meanwhile, seasonal costumes like "Snowflake Collar" (`snowflake_collar`), "Ice Queen Crown" (`ice_queen_crown`), and "Aurora Wings" (`aurora_wings`) are defined in:

```typescript
// src/types/seasonalContent.ts (lines 107-145)
SEASONS[0].costumes = [
  { id: 'snowflake_collar', ... },
  { id: 'ice_queen_crown', ... },
  { id: 'aurora_wings', ... },
]
```

### Flow When Buying a Seasonal Costume

```text
User clicks "Buy" on Winter Wonderland costume
    ↓
CostumeShopPanel calls → onBuyCostume('snowflake_collar')
    ↓
useCostumes.buyCostume() calls → getCostumeById('snowflake_collar')
    ↓
getCostumeById searches COSTUMES array (20 standard costumes)
    ↓
Returns undefined (seasonal costume not in array!)
    ↓
showMessage('Costume not found!', 'error')  ← USER SEES THIS
```

---

## Complete Gap Analysis

### Issue 1: Costume Lookup Function is Incomplete

| Function | What It Searches | Problem |
|----------|------------------|---------|
| `getCostumeById()` | `COSTUMES` array only | Missing all seasonal costumes |
| `getAvailableSeasonalCostumes()` | `SEASONS` array | Works, but not integrated with lookup |

**Impact**: Any costume lookup fails for seasonal items - buying, equipping, displaying, and validation all break.

### Issue 2: Vector Rendering Missing for Seasonal Costumes

The `COSTUME_VECTORS` map in `src/lib/costumeVectors.ts` only contains vector definitions for standard costumes. Seasonal costumes will fall back to emoji display, which may look inconsistent.

**Missing Vector Definitions:**
- `snowflake_collar`
- `ice_queen_crown`
- `aurora_wings`
- All Spring, Summer, and Autumn seasonal costumes

### Issue 3: Costume Equip Validation Will Fail

Even if a user could buy a seasonal costume through a workaround, `equipCostume()` would fail:

```typescript
// src/hooks/game/useCostumes.ts (line 115-116)
const costume = getCostumeById(costumeId);
if (!costume) {
  showMessage('Invalid costume!', 'error');  // ← Would trigger for seasonal
```

### Issue 4: No RLS Issues (Verified)

Costumes are stored client-side in `game_state.ownedCostumes[]` and persisted via `game_saves` table. The RLS policies on `game_saves` are correctly configured:
- Users can only read/write their own saves
- Admins can view/update all saves

No database-level costume restrictions exist that would cause this error.

### Issue 5: Documentation Not Mentioning Seasonal System

The `GAME_KNOWLEDGE.md` and other docs reference the standard costume system but don't fully document the seasonal content architecture or explain the dual-source nature of costume data.

---

## Comprehensive Fix Plan

### Phase 1: Fix Costume Lookup (Critical)

**File**: `src/types/costumes.ts`

Create a unified lookup function that searches both standard and seasonal costumes:

```typescript
// Add import
import { SEASONS, SeasonalCostume } from './seasonalContent';

// Update getCostumeById to check both sources
export function getCostumeById(id: string): Costume | SeasonalCostume | undefined {
  // First check standard costumes
  const standard = COSTUMES.find((c) => c.id === id);
  if (standard) return standard;
  
  // Then check all seasonal costumes across all seasons
  for (const season of SEASONS) {
    const seasonal = season.costumes.find((c) => c.id === id);
    if (seasonal) return seasonal;
  }
  
  return undefined;
}
```

**Alternative Approach**: Create a merged `ALL_COSTUMES` constant that combines both sources at module load time for better performance.

### Phase 2: Add Seasonal Vector Costumes

**File**: `src/lib/costumeVectors.ts`

Add vector definitions for Winter Wonderland costumes:

```typescript
const snowflakeCollarVector: VectorCostume = {
  id: 'snowflake_collar',
  path: '...', // Collar shape with snowflake decorations
  fill: '#E0F0FF',
  stroke: '#87CEEB',
  decorations: [/* snowflake shapes */],
  anchor: { x: 0, y: 18 },
  scales: { xs: 0.3, sm: 0.4, md: 0.55, lg: 0.7, xl: 0.85 },
  animation: { type: 'shimmer', className: 'shimmer-ice' },
};

const iceQueenCrownVector: VectorCostume = {
  id: 'ice_queen_crown',
  path: '...', // Icy crown shape
  fill: '#B0E0E6',
  stroke: '#4682B4',
  decorations: [/* ice crystal shapes */],
  anchor: { x: 0, y: -35 },
  scales: { xs: 0.4, sm: 0.5, md: 0.65, lg: 0.8, xl: 1.0 },
  animation: { type: 'glow', glowColor: '#00BFFF' },
};

const auroraWingsVector: VectorCostume = {
  id: 'aurora_wings',
  path: '...', // Wing shapes with aurora gradient
  fill: 'url(#auroraGradient)',
  stroke: '#9370DB',
  decorations: [/* shimmer effects */],
  anchor: { x: 0, y: 5 },
  scales: { xs: 0.3, sm: 0.4, md: 0.55, lg: 0.7, xl: 0.85 },
  animation: { type: 'rainbow', className: 'aurora-shimmer' },
  particles: { type: 'sparkles', count: 6, color: '#E0FFFF' },
};

// Add to COSTUME_VECTORS map
export const COSTUME_VECTORS: Record<string, VectorCostume> = {
  // ... existing entries ...
  snowflake_collar: snowflakeCollarVector,
  ice_queen_crown: iceQueenCrownVector,
  aurora_wings: auroraWingsVector,
};
```

### Phase 3: Update Type Exports

**File**: `src/types/index.ts`

Ensure seasonal costume types are exported for use throughout the codebase:

```typescript
export type { SeasonalCostume } from './seasonalContent';
export { SEASONS, getCurrentSeason, getAvailableSeasonalCostumes } from './seasonalContent';
```

### Phase 4: Update CatAvatar/CatVisual Fallback

**Files**: `src/components/game/CatAvatar.tsx`, `src/components/game/CatVisual.tsx`

Ensure these components can handle seasonal costume IDs gracefully, including checking both COSTUMES and seasonal sources for emoji fallback.

### Phase 5: Add Comprehensive Test Coverage

**File**: `src/hooks/game/__tests__/useCostumes.test.ts`

Add test cases for seasonal costumes:

```typescript
describe('seasonal costumes', () => {
  it('should allow purchasing available seasonal costumes', () => {
    // Mock current date to be within Winter Wonderland season
    mockDeps = createMockDependencies({ money: 500 });
    const { result } = renderHook(() => useCostumes(mockDeps.deps));

    act(() => {
      result.current.buyCostume('snowflake_collar');
    });

    expect(mockDeps.getState().ownedCostumes).toContain('snowflake_collar');
  });

  it('should allow equipping purchased seasonal costumes', () => {
    const cat = createMockCat({ id: 'cat-1' });
    mockDeps = createMockDependencies({
      cats: [cat],
      ownedCostumes: ['snowflake_collar'],
    });
    const { result } = renderHook(() => useCostumes(mockDeps.deps));

    act(() => {
      result.current.equipCostume('cat-1', 'snowflake_collar');
    });

    expect(mockDeps.getState().catCostumes['cat-1']).toBe('snowflake_collar');
  });
});
```

### Phase 6: Documentation Updates

**Files to Update:**
- `GAME_KNOWLEDGE.md` - Add Seasonal Costume System section
- `docs/COMPONENTS.md` - Document CostumeShopPanel seasonal tab
- `docs/README.md` - Add seasonal content to feature list

---

## Files Summary

### Files to Modify

| File | Change |
|------|--------|
| `src/types/costumes.ts` | Update `getCostumeById()` to search both standard and seasonal costumes |
| `src/lib/costumeVectors.ts` | Add vector definitions for seasonal costumes |
| `src/types/index.ts` | Export seasonal costume types |
| `src/hooks/game/__tests__/useCostumes.test.ts` | Add seasonal costume test cases |
| `GAME_KNOWLEDGE.md` | Document seasonal costume system |

### No Changes Needed

| Area | Reason |
|------|--------|
| RLS Policies | Costumes stored in `game_state` JSONB - no separate table needed |
| `useCostumes.ts` | Logic is correct - just needs working lookup function |
| `CostumeShopPanel.tsx` | Already handles seasonal costumes correctly in UI |
| `useSeasonalContent.ts` | Works correctly for listing available seasonal items |

---

## Security Considerations

1. **No RLS Issues**: Costume data lives in `game_state.ownedCostumes[]` which is protected by existing `game_saves` RLS policies

2. **Price Validation**: The fix maintains price validation - seasonal costumes have non-zero prices (150-500 coins)

3. **Season Expiry**: Seasonal costumes remain in `ownedCostumes` even after season ends - this is intentional (players keep what they bought)

4. **No Server-Side Validation Needed**: Costumes are cosmetic only with no economic impact requiring backend validation

---

## Implementation Priority

1. **Critical**: Fix `getCostumeById()` function (blocks all seasonal purchases)
2. **High**: Add test coverage for seasonal costumes
3. **Medium**: Add vector definitions for visual consistency
4. **Low**: Documentation updates

---

## Verification Steps

After implementation:

1. Navigate to Costume Shop → Seasonal tab
2. Verify Winter Wonderland costumes display correctly
3. Purchase "Snowflake Collar" ($150)
4. Verify costume appears in owned list
5. Equip costume to a cat
6. Verify costume displays on cat avatar/portrait
7. Save game and reload to verify persistence

