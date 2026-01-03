# Cat Farm - Unified Cat Visual System

## Overview

The Unified Cat Visual System provides consistent cat display throughout the entire application. Every cat is displayed using the same visual identity, reflecting all customizations (appearance, costume, portrait) everywhere.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    UnifiedCatCard                           │
│  (Main component with variant support)                      │
├─────────────────────────────────────────────────────────────┤
│  Variants: minimal | compact | card | trading | detail      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      CatVisual                              │
│  (Core visual identity - portrait or avatar)                │
├─────────────────────────────────────────────────────────────┤
│  - Shows AI portrait if available (preferPortrait=true)     │
│  - Falls back to CatAvatar                                  │
│  - Includes tier-specific effects                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      CatAvatar                              │
│  (SVG-based cat face rendering)                             │
├─────────────────────────────────────────────────────────────┤
│  - Fur color, pattern, eye color                            │
│  - Facial features, hair length                             │
│  - Costume overlays                                         │
│  - Micro-animations                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Components

### CatVisual (`src/components/game/CatVisual.tsx`)

The core visual identity component. Use this when you just need to display a cat's appearance.

```typescript
interface CatVisualProps {
  cat: Cat;
  equippedCostumeId?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'portrait';
  preferPortrait?: boolean;  // Use AI portrait if available
  animated?: boolean;
  showGrade?: boolean;       // Show grade overlay on portrait
  className?: string;
}
```

**Usage Examples:**

```tsx
// Simple avatar
<CatVisual cat={myCat} size="md" />

// Portrait with grade overlay
<CatVisual 
  cat={myCat} 
  size="portrait" 
  preferPortrait 
  showGrade 
  equippedCostumeId="crown"
/>

// Animated avatar in a list
<CatVisual cat={myCat} size="sm" animated />
```

### UnifiedCatCard (`src/components/game/UnifiedCatCard.tsx`)

The main card component with multiple display variants.

```typescript
type CatCardVariant = 'minimal' | 'compact' | 'card' | 'trading' | 'detail';

interface UnifiedCatCardProps {
  cat: Cat;
  variant?: CatCardVariant;
  equippedCostumeId?: string;
  showPortrait?: boolean;
  showStats?: boolean;
  showRelationships?: boolean;
  showActions?: boolean;
  showFlip?: boolean;
  animated?: boolean;
  relationships?: CatRelationship[];
  allCats?: Cat[];
  onClick?: () => void;
  onSell?: (id: string) => void;
  onHeal?: (id: string) => void;
  onComfort?: (id: string) => void;
  onRename?: (catId: string, newName: string) => void;
  reaction?: CatReaction;
}
```

**Variants:**

| Variant | Description | Default Props |
|---------|-------------|---------------|
| `minimal` | Just avatar and name | No stats, no actions |
| `compact` | Small card for lists | No stats, no actions |
| `card` | Standard card | Stats, relationships, actions |
| `trading` | Trading card with flip | Stats, flip animation |
| `detail` | Detailed view for modals | Portrait, all features |

**Usage Examples:**

```tsx
// Standard card in game grid
<UnifiedCatCard 
  cat={myCat}
  variant="card"
  equippedCostumeId={catCostumes[myCat.id]}
  relationships={relationships}
  onSell={handleSell}
  onHeal={handleHeal}
/>

// Trading card in collection
<UnifiedCatCard 
  cat={myCat}
  variant="trading"
  showFlip
  onClick={handleClick}
/>

// Compact in selection list
<UnifiedCatCard 
  cat={myCat}
  variant="compact"
  onClick={() => selectCat(myCat.id)}
/>
```

### Legacy Components (Deprecated)

These components are now wrappers for backward compatibility:

- **CatCard** → Use `UnifiedCatCard` with `variant="card"`
- **FlippableTradingCard** → Use `UnifiedCatCard` with `variant="trading"`
- **TradingCard** → Use `UnifiedCatCard` with `variant="trading"` and `showFlip={false}`

---

## Graphics Configuration

Global graphics settings in `src/config/graphics.ts`:

```typescript
export const GRAPHICS_CONFIG = {
  enablePortraitPriority: true,  // Show portrait over avatar when available
  enableAnimations: true,        // Master animation toggle
  cardBorderStyle: 'tier',       // Border style: 'tier' | 'simple' | 'none'
  avatarQuality: 'high',         // Quality: 'low' | 'medium' | 'high'
  enableTierGlows: true,         // Tier-specific glow effects
  enableSparkles: true,          // Ultra rare sparkle effects
  enableCardFlip: true,          // Flip animation on trading cards
};
```

---

## Data Flow

### Cat Appearance Persistence

```
User customizes cat appearance
         │
         ▼
┌─────────────────────────────────────┐
│  cat.appearance = {                 │
│    furColor: 'orange',              │
│    pattern: 'tabby',                │
│    eyeColor: 'green',               │
│    hairLength: 'fluffy',            │
│    facialFeature: 'cute_blush'      │
│  }                                  │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  gameState.cats[i].appearance       │
│  → Saved to localStorage            │
│  → Synced to cloud (game_saves)     │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  CatVisual reads cat.appearance     │
│  → Passes to CatAvatar              │
│  → Renders custom look              │
└─────────────────────────────────────┘
```

### Costume Persistence

```
User equips costume
         │
         ▼
┌─────────────────────────────────────┐
│  gameState.catCostumes = {          │
│    [catId]: 'crown'                 │
│  }                                  │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  CatVisual receives                 │
│  equippedCostumeId prop             │
│  → Passes to CatAvatar              │
│  → Shows costume overlay            │
└─────────────────────────────────────┘
```

### Portrait Persistence

```
User generates AI portrait
         │
         ▼
┌─────────────────────────────────────┐
│  Confirmation dialog shown          │
│  → Displays estimated credit cost   │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Edge function: generate-cat-       │
│  portrait                           │
│  → Generates image from prompt      │
│  → Returns portraitUrl              │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  cat.portraitUrl = url              │
│  cat.appearanceHash = hash          │
│  → Hash computed from appearance    │
│  → Saved to game state              │
│  → Synced to cloud                  │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  CatVisual with preferPortrait      │
│  → Shows AI portrait                │
│  → Falls back to CatAvatar if fail  │
└─────────────────────────────────────┘

### Outdated Portrait Detection

```
User modifies cat appearance/costume
         │
         ▼
┌─────────────────────────────────────┐
│  Current hash computed from:        │
│  - cat.appearance                   │
│  - equippedCostumeId                │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Compare current hash to stored:    │
│  cat.appearanceHash                 │
└─────────────────────────────────────┘
         │
         ├── Match → Portrait is current
         │
         └── Mismatch → Portrait outdated
                  │
                  ▼
         ┌─────────────────────────────┐
         │  Show "Update Portrait"     │
         │  button on CatPortrait      │
         └─────────────────────────────┘
```

---

## Adding New Display Variants

1. Add new variant type to `CatCardVariant`:
```typescript
type CatCardVariant = 'minimal' | 'compact' | 'card' | 'trading' | 'detail' | 'newVariant';
```

2. Add defaults in `getVariantDefaults()`:
```typescript
case 'newVariant':
  return { showPortrait: true, showStats: false, ... };
```

3. Add rendering logic in `UnifiedCatCard`:
```typescript
if (variant === 'newVariant') {
  return <NewVariantView ... />;
}
```

---

## Best Practices

1. **Always pass `equippedCostumeId`** - Get from `gameState.catCostumes[cat.id]`

2. **Use appropriate variant** - Don't use `card` variant in a small list; use `compact`

3. **Let CatVisual handle portrait logic** - Set `preferPortrait` and it handles fallback

4. **Use UnifiedCatCard for new features** - Don't create new card components

5. **Check GRAPHICS_CONFIG** - Respect global settings for animations and effects

---

## Migration Guide

### From CatCard

```tsx
// Before
<CatCard cat={cat} onSell={sell} onHeal={heal} compact />

// After
<UnifiedCatCard 
  cat={cat} 
  variant="compact" 
  onSell={sell} 
  onHeal={heal} 
/>
```

### From FlippableTradingCard

```tsx
// Before
<FlippableTradingCard 
  cat={cat} 
  relationships={rels} 
  allCats={cats} 
  onClick={click} 
/>

// After
<UnifiedCatCard 
  cat={cat} 
  variant="trading" 
  relationships={rels} 
  allCats={cats} 
  onClick={click}
  showFlip
/>
```

### From CatPortrait

```tsx
// Before
<CatPortrait cat={cat} equippedCostumeId={costume} />

// After
<CatVisual 
  cat={cat} 
  equippedCostumeId={costume}
  size="portrait" 
  preferPortrait 
  showGrade 
/>
```

---

## File Structure

```
src/
├── components/game/
│   ├── CatVisual.tsx          # Core visual identity
│   ├── UnifiedCatCard.tsx     # Main card component
│   ├── CatCard.tsx            # Wrapper for backward compat
│   ├── FlippableTradingCard.tsx # Wrapper for backward compat
│   ├── CatAvatar.tsx          # SVG avatar rendering
│   ├── CatPortrait.tsx        # Portrait generation UI + confirmation
│   ├── BatchPortraitGenerator.tsx # Batch portrait generation
│   ├── GradeBadge.tsx         # Grade display badge
│   └── CatCardReaction.tsx    # Reaction animations
├── config/
│   └── graphics.ts            # Graphics configuration
├── lib/
│   └── portraitUtils.ts       # Appearance hash + outdated detection
└── types/
    ├── game.ts                # Cat interface (includes appearanceHash)
    ├── catAppearance.ts       # Appearance options
    └── grading.ts             # Grade tiers
```
