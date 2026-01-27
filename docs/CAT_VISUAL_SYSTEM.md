# Cat Visual System Documentation

## Overview

The Cat Visual System provides a unified, consistent way to display cats throughout the Cat Farm game. It supports AI-generated portraits, programmatic vector avatars, costumes, and tier-specific effects.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CatVisual                               │
│  (Primary entry point for all cat display)                  │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────┐ ┌────────────────┐ │
│ │  AI Portrait    │ │  PaperCatAvatar │ │   CatAvatar    │ │
│ │  (if available) │ │  (Paper.js)     │ │  (CSS/SVG)     │ │
│ └─────────────────┘ └─────────────────┘ └────────────────┘ │
│          ▲                   ▲                  ▲          │
│          │                   │                  │          │
│          └───────────────────┴──────────────────┘          │
│                      Fallback Chain                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Components

### CatVisual (`src/components/game/CatVisual.tsx`)
The unified visual representation component. Use this for all cat displays.

**Props:**
- `cat: Cat` - Cat data object
- `equippedCostumeId?: string` - Costume to display
- `size: CatVisualSize` - 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'portrait'
- `preferPortrait?: boolean` - Show AI portrait if available
- `animated?: boolean` - Enable micro-animations
- `showGrade?: boolean` - Show grade overlay on portraits
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
<CatVisual 
  cat={myCat} 
  size="md" 
  equippedCostumeId={catCostumes[myCat.id]}
/>
```

### CatAvatar (`src/components/game/CatAvatar.tsx`)
CSS/SVG-based avatar renderer. Used as fallback when portraits unavailable.

### GradeBadge (`src/components/game/GradeBadge.tsx`)
Visual grade tier indicator with tier-specific colors and stars.

---

## Configuration

### Graphics Config (`src/config/graphics.ts`)

Central configuration for all visual settings:

| Setting | Type | Description |
|---------|------|-------------|
| `enablePortraitPriority` | boolean | Show AI portrait over avatar |
| `enableAnimations` | boolean | Enable micro-animations |
| `cardBorderStyle` | 'tier' \| 'simple' \| 'none' | Border style mode |
| `avatarQuality` | 'low' \| 'medium' \| 'high' | Rendering quality |
| `enableTierGlows` | boolean | Tier-specific glow effects |
| `enableSparkles` | boolean | Sparkle effects for ultra rare |
| `vectorEngine` | 'paperjs' \| 'simple' | Rendering engine |
| `avatarBreedFeatures` | boolean | Breed-specific shapes |
| `costumeDisplayMode` | 'vector' \| 'emoji' \| 'auto' | Costume rendering |
| `enableCostumeAnimations` | boolean | Animated costume effects |

### Tier Visuals

Each grade tier has specific visual styling:

| Tier | Grades | Border | Glow | Special Effects |
|------|--------|--------|------|-----------------|
| common | 1-4 | gray | none | - |
| uncommon | 5-8 | blue | subtle | - |
| rare | 9-12 | purple | pulsing | - |
| veryRare | 13-16 | yellow/gold | golden | - |
| ultraRare | 17-20 | pink/rainbow | rainbow | sparkles, shimmer |

---

## Libraries

### Breed Shapes (`src/lib/breedShapes.ts`)
Defines breed-specific visual characteristics:
- Head shape (roundness, width, chin)
- Ear shape (height, angle, tufts)
- Eye shape (round, almond, oval)
- Nose shape (standard, flat, pointed)
- Fur length

**Breeds:** Siamese, Persian, Maine Coon, British Shorthair, Ragdoll, Bengal, Tabby, Stray

### Costume Vectors (`src/lib/costumeVectors.ts`)
SVG path definitions for costume overlays with animation support:

**Standard Costumes:**
- Crown, Wizard Hat, Party Hat, Top Hat
- Bow Tie, Sunglasses, Necklace, Scarf
- Sweater, Tuxedo
- Superhero Cape, Pirate Hat
- Angel Wings, Dragon, Astronaut, Unicorn

**VIP Costumes:**
- VIP Bronze Collar, VIP Silver Cape, VIP Gold Crown

**Animation Properties:**
```typescript
interface VectorCostume {
  // ... base properties
  animation?: {
    type: 'sparkle' | 'glow' | 'flow' | 'pulse' | 'shimmer' | 'rainbow';
    className?: string;
    glowColor?: string;
  };
  particles?: {
    type: 'sparkles' | 'stars' | 'hearts' | 'magic';
    count: number;
    color?: string;
  };
}
```

### Animated Costume SVG (`src/components/game/AnimatedCostumeSVG.tsx`)
Renders animated costume overlays with CSS effects:

**Animation Types:**
| Type | CSS Class | Description |
|------|-----------|-------------|
| glow-gold | animate-costume-glow-gold | Golden pulsing glow |
| glow-vip | animate-costume-glow-vip | Rainbow VIP glow |
| glow-fire | animate-costume-glow-fire | Fiery dragon glow |
| flow | animate-costume-flow | Flowing cape effect |
| flutter | animate-costume-flutter | Wing flutter effect |
| rainbow | animate-costume-rainbow | Rainbow color shift |
| sparkle | animate-costume-sparkle | Twinkling stars |
| shimmer-bronze | animate-costume-shimmer-bronze | Bronze shimmer |
| shimmer-silver | animate-costume-shimmer-silver | Silver shimmer |

**Particle Effects:**
- sparkles: 4-point star particles
- stars: 5-point twinkling stars
- hearts: Pink heart particles
- magic: Swirling dot particles

### Avatar Cache (`src/lib/avatarCache.ts`)
Caching system for generated avatars:
- LRU eviction with 100 entry limit
- Appearance-based hash keys
- localStorage persistence

---

## Hooks

### useGraphicsSettings (`src/hooks/useGraphicsSettings.ts`)
Runtime graphics settings management:
```tsx
const { settings, updateSetting, resetToDefaults, isReducedMotion } = useGraphicsSettings();
```

---

## Data Flow

1. **Cat Creation**: Cat gets default appearance based on breed
2. **Breeding**: Kittens inherit appearance from parents via `inheritAppearance()` with mutation chance
3. **Customization**: User can modify appearance via CatCustomization page
4. **Portrait Generation**: AI generates portrait from appearance data
5. **Display**: CatVisual checks for portrait, falls back to avatar
6. **Caching**: Generated avatars cached for performance

---

## Appearance Inheritance

When breeding cats, kittens inherit visual traits from their parents:

**File:** `src/lib/appearanceInheritance.ts`

**Inheritance Rules:**
- Fur color, pattern, eye color: 45% from each parent, 10% mutation
- Hair length: Dominance-based (fluffy > medium > short)
- Facial features: 80% normal, 20% inherited/mutated

**Relationship Bonus Effect:**
- Better relationship = lower mutation chance (stable genetics)
- Enemies = higher mutation chance (unstable genetics)

---

## Passing Costumes

**IMPORTANT**: Always pass `catCostumes` from game state to panels:

```tsx
// In CatFarm.tsx
<BreedingPanel 
  cats={state.cats} 
  catCostumes={state.catCostumes}  // Always include this!
  ...
/>

// In panel component
<CatVisual 
  cat={cat} 
  equippedCostumeId={catCostumes?.[cat.id]}  // Pass to CatVisual
/>
```

**Panels that receive catCostumes:**
- BreedingPanel
- TrainingPanel
- SocializePanel
- MatchmakingPanel
- GroupActivitiesPanel
- CatGiftingPanel
- TradingPanel
- BulkActionsPanel
- RelationshipPanel
- LeaderboardPanel

---

## Adding New Breeds

1. Add breed to `src/types/game.ts` BREEDS constant
2. Add shape definition to `src/lib/breedShapes.ts`
3. Add default appearance to `src/types/catAppearance.ts`

## Adding New Costumes

1. Add costume to `src/types/costumes.ts` COSTUMES array
2. (Optional) Add vector definition to `src/lib/costumeVectors.ts`

---

## Performance Tips

1. **Use caching**: Avatar cache prevents regeneration
2. **Lazy load portraits**: Portraits load on demand
3. **Reduce animations**: Disable for large grids
4. **Optimize size**: Use smallest appropriate size

---

## Troubleshooting

### Costumes not showing
- Verify `catCostumes` prop is passed to panel
- Check `equippedCostumeId` passed to CatVisual
- Ensure costume is in `state.ownedCostumes`

### Portrait not displaying
- Check `cat.portraitUrl` exists
- Verify `preferPortrait` is true (default from config)
- Check for network errors loading image

### Animations not working
- Check `enableAnimations` in graphics config
- Verify `prefers-reduced-motion` system setting
- Ensure `animated` prop passed to CatVisual
