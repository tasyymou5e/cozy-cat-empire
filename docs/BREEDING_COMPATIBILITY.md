# Breeding Panel Compatibility Indicators

## Overview

Two enhancements to improve the cat breeding and relationship experience:

1. **Breeding Panel**: Add a "Best Breeding Pairs" section showing top compatible cats based on social bonds
2. **RelationshipPanel**: Add a "View Full Page" button linking to `/relationships`

---

## Part 1: Breeding Panel Compatibility Indicators

**Location:** `src/components/game/BreedingPanel.tsx`

### New Features

#### 1. Add CatRelationship[] prop for relationship data

```typescript
interface BreedingPanelProps {
  // ... existing props
  relationships?: CatRelationship[];  // NEW
}
```

#### 2. "Top Breeding Pairs" Section

Display a collapsible section above the parent selectors showing suggested pairs:

| Pair | Relationship | Bonus | Recommendation |
|------|--------------|-------|----------------|
| Whiskers + Mittens | 💕 Best Friends | +20% | Excellent |
| Shadow + Luna | 💚 Friends | +10% | Good |
| Tiger + Patches | 😐 Neutral | 0% | OK |

#### 3. Visual indicators in Select dropdowns

When Parent 1 is selected, show compatibility badges next to cats in Parent 2 dropdown:

- 💕 = Best friend (+20%)
- 💚 = Friend (+10%)
- 😐 = Neutral (0%)
- 😾 = Rival (-10%)
- 💔 = Enemy (blocked)

#### 4. Calculate and rank breeding pairs

```typescript
const getBreedingPairSuggestions = useMemo(() => {
  const pairs: BreedingSuggestion[] = [];
  for (let i = 0; i < eligibleCats.length; i++) {
    for (let j = i + 1; j < eligibleCats.length; j++) {
      const compat = getBreedingCompatibility(cats[i].id, cats[j].id);
      if (compat.canBreed) {
        pairs.push({ cat1: cats[i], cat2: cats[j], ...compat });
      }
    }
  }
  return pairs.sort((a, b) => b.bonus - a.bonus).slice(0, 5);
}, [eligibleCats, getBreedingCompatibility]);
```

#### 5. Imports to add

```typescript
import { CatRelationship, getRelationshipEmoji } from '@/types/relationships';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { ChevronDown } from 'lucide-react';
```

---

## Part 2: RelationshipPanel "View Full Page" Button

**Location:** `src/components/game/RelationshipPanel.tsx`

### Changes

#### 1. Add Button import and useNavigate hook

```typescript
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
```

#### 2. Add "View Full Page" button in CardHeader

Position next to the title or in a flex container:

```tsx
<CardHeader className="pb-2">
  <div className="flex items-center justify-between">
    <CardTitle className="text-lg flex items-center gap-2">
      💗 Cat Relationships
    </CardTitle>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => navigate('/relationships')}
      className="text-xs gap-1"
    >
      <ExternalLink className="h-3 w-3" />
      View Full Page
    </Button>
  </div>
  {/* ... existing badges */}
</CardHeader>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/game/BreedingPanel.tsx` | Add relationships prop, top pairs section, dropdown badges |
| `src/components/game/RelationshipPanel.tsx` | Add View Full Page button with navigation |
| `src/components/game/CatFarm.tsx` | Pass relationships to BreedingPanel |

---

## Implementation Details

### BreedingPanel Changes

#### New interface for suggestions

```typescript
interface BreedingSuggestion {
  cat1: Cat;
  cat2: Cat;
  canBreed: boolean;
  bonus: number;
  message: string;
}
```

#### Collapsible suggestions section

- Shows top 5 breeding pairs sorted by relationship bonus
- Each pair shows both cat avatars, names, relationship emoji, and bonus
- "Select" button to auto-populate both parent dropdowns

#### Enhanced Select items

- Show relationship indicator badge next to each cat when other parent is selected
- Color-coded: green (friend), pink (best friend), gray (neutral), orange (rival), red (enemy)

### RelationshipPanel Changes

- Add navigation to `/relationships`
- Small ghost button with ExternalLink icon
- Positioned in header for visibility

---

## Visual Preview

### Breeding Panel

```
┌─────────────────────────────────────────┐
│ 💕 Breeding                             │
├─────────────────────────────────────────┤
│ 🎯 Best Breeding Pairs              [▼] │
│ ┌─────────────────────────────────────┐ │
│ │ 🐱 Whiskers + 🐱 Mittens  💕 +20%   │ │
│ │ 🐱 Shadow + 🐱 Luna       💚 +10%   │ │
│ │ 🐱 Tiger + 🐱 Patches     😐  0%    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Parent 1: [Select a cat        ▼]       │
│ Parent 2: [Select a cat        ▼]       │
│   - Luna 💕 (Best Friend)               │
│   - Patches 💚 (Friend)                 │
│   - Shadow 😐 (Neutral)                 │
│                                         │
│ [💕 Breed Cats]                         │
└─────────────────────────────────────────┘
```

### RelationshipPanel Header

```
┌─────────────────────────────────────────┐
│ 💗 Cat Relationships    [↗ View Full]   │
│ 💚 3 Friends  😾 1 Rival                │
├─────────────────────────────────────────┤
```

---

## Relationship Bonus System

### Breeding Success Modifiers

| Relationship Level | Score Range | Bonus | Effect |
|--------------------|-------------|-------|--------|
| Soul Mates | 80 to 100 | +25% | Highest quality kittens |
| Best Friends | 50 to 79 | +20% | Higher grade potential |
| Friends | 20 to 49 | +10% | Slightly better outcomes |
| Neutral | -19 to 19 | 0% | Standard breeding |
| Rivals | -49 to -20 | -10% | Lower success rate |
| Enemies | -79 to -50 | -20% | May refuse to breed |
| Nemesis | -100 to -80 | Blocked | Cannot breed together |

### Kitten Quality Factors

The relationship between parents affects:
- **Grade inheritance**: Better relationships = higher grade potential
- **Personality traits**: Positive relationships = more positive personality traits
- **Health bonus**: Friends produce healthier kittens
- **Appearance variety**: Strong bonds may produce rarer appearances

---

## Related Files

- `src/types/relationships.ts` - Relationship types and utilities
- `src/hooks/useRelationships.ts` - Relationship state management
- `src/pages/CatRelationships.tsx` - Full relationships page
- `docs/CAT_RELATIONSHIPS_PAGE.md` - Relationships page documentation
- `docs/GAME_LOGIC.md` - Core game mechanics
