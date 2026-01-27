

# Appearance Inheritance for Kitten Creation

## Overview

Add genetic appearance inheritance to the breeding system so kittens inherit visual traits (fur color, pattern, eye color, hair length) from their parents instead of using breed defaults.

---

## Current State

| Component | Current Behavior | Issue |
|-----------|------------------|-------|
| `useBreeding.ts` | Creates kitten without `appearance` property | Kitten uses breed defaults when rendered |
| `CatAvatar.tsx` | Falls back to `generateDefaultAppearance(breed)` if no appearance | All kittens of same breed look identical |
| `catAppearance.ts` | Has `generateDefaultAppearance()` and `randomizeAppearance()` | No inheritance function exists |

---

## Implementation Plan

### Phase 1: Create Appearance Inheritance Utility (~80 lines)

**File:** `src/lib/appearanceInheritance.ts`

Create a utility that generates kitten appearance based on parent genetics:

```text
Inheritance Rules:
┌─────────────────────────────────────────────────────────────┐
│ Trait           │ Inheritance Logic                        │
├─────────────────┼──────────────────────────────────────────┤
│ Fur Color       │ 45% parent1, 45% parent2, 10% mutation   │
│ Pattern         │ 45% parent1, 45% parent2, 10% mutation   │
│ Pattern Color   │ 50% parent1, 50% parent2                 │
│ Eye Color       │ 45% parent1, 45% parent2, 10% mutation   │
│ Hair Length     │ Dominant gene logic (fluffy > medium >   │
│                 │ short), with 20% chance of recessive     │
│ Facial Feature  │ 80% "normal", 20% random mutation        │
└─────────────────────────────────────────────────────────────┘
```

**Key Functions:**

```typescript
// Main inheritance function
export function inheritAppearance(
  parent1: Cat,
  parent2: Cat,
  options?: InheritanceOptions
): CatAppearance;

// Individual trait inheritance
function inheritTrait<T>(
  trait1: T, 
  trait2: T, 
  allOptions: T[], 
  mutationChance?: number
): T;

// Hair length uses dominance logic
function inheritHairLength(
  length1: HairLength, 
  length2: HairLength
): HairLength;
```

**Mutation System:**
- 10% chance for fur color/pattern/eye color to mutate to a random option
- Creates visual variety while maintaining family resemblance
- Relationship bonus can influence mutation (better relationship = lower mutation)

---

### Phase 2: Modify Breeding Hook (~15 lines changed)

**File:** `src/hooks/game/useBreeding.ts`

Add appearance inheritance when creating the kitten:

```text
Changes:
1. Import the new inheritAppearance function
2. Get parent appearances (or generate defaults)
3. Call inheritAppearance() to generate kitten appearance
4. Add appearance property to kitten object
```

**Before (lines 123-147):**
```typescript
const kitten: Cat = {
  id: generateId(),
  type: 'pure',
  breed,
  name,
  // ... other properties
  // NO appearance property
};
```

**After:**
```typescript
import { inheritAppearance } from '@/lib/appearanceInheritance';

// Inside breedCats function, before creating kitten:
const kittenAppearance = inheritAppearance(parent1, parent2, {
  mutationChance: compatibility.bonus > 10 ? 0.05 : 0.10,
  inheritedBreed: breed,
});

const kitten: Cat = {
  id: generateId(),
  type: 'pure',
  breed,
  name,
  // ... other properties
  appearance: kittenAppearance, // NEW: Inherited appearance
};
```

---

### Phase 3: Add Test Coverage (~50 lines)

**File:** `src/hooks/game/__tests__/useBreeding.test.ts`

Add tests for appearance inheritance:

```text
New test cases:
1. "should inherit appearance from parents"
2. "should handle parents without custom appearances"
3. "should apply mutation based on relationship bonus"
4. "should create valid CatAppearance structure"
```

---

## Inheritance Algorithm Details

### Trait Selection Logic

```text
For each trait (furColor, pattern, eyeColor):
  roll = random(0, 1)
  if roll < 0.45:
    return parent1.trait
  else if roll < 0.90:
    return parent2.trait
  else:
    return randomMutation()  // 10% chance
```

### Hair Length Dominance

```text
Dominance order: fluffy > medium > short

Example combinations:
- fluffy + short → 70% fluffy, 20% medium, 10% short
- medium + medium → 90% medium, 10% variance
- fluffy + fluffy → 95% fluffy, 5% medium
```

### Relationship Bonus Effect

```text
Higher relationship bonus = more stable genetics:
- bonus > 20: 5% mutation chance (stable genes)
- bonus > 10: 8% mutation chance
- bonus <= 10: 10% mutation chance
- bonus < 0: 15% mutation chance (unstable)
```

---

## File Summary

| File | Action | Lines |
|------|--------|-------|
| `src/lib/appearanceInheritance.ts` | Create | ~80 |
| `src/hooks/game/useBreeding.ts` | Modify | ~15 |
| `src/hooks/game/__tests__/useBreeding.test.ts` | Modify | ~50 |
| **Total** | | ~145 |

---

## Example Output

**Parents:**
- Parent 1: Orange tabby, green eyes, medium fur
- Parent 2: White solid, blue eyes, fluffy fur

**Possible Kittens:**
```text
Kitten A: Orange tabby, green eyes, fluffy fur (inherited dominant fluffy)
Kitten B: White tabby, blue eyes, medium fur (mixed traits)
Kitten C: Gray solid, amber eyes, fluffy fur (double mutation!)
```

---

## Benefits

1. **Visual Variety**: Kittens now look unique based on their lineage
2. **Family Resemblance**: Players can see traits passed down generations
3. **Breeding Strategy**: Encourages thoughtful pairing for desired appearances
4. **Engagement**: More meaningful breeding decisions beyond just grade/breed

---

## Technical Notes

- **Backward Compatibility**: Existing cats without appearances continue to work (render with breed defaults)
- **Performance**: Simple random selection, no performance impact
- **Determinism**: Not seeded - each breeding is unique (intentional for variety)
- **Portrait Updates**: New kittens get unique `appearanceHash` for future AI portraits

