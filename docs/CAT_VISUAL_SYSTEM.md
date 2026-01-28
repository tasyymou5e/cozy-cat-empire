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

## AI Portrait System

### Enhanced Prompt Engineering

The AI portrait system uses comprehensive prompt engineering to ensure generated portraits **exactly match** cat properties:

**Edge Function:** `supabase/functions/generate-cat-portrait/index.ts`

#### Style Definition
All portraits use a consistent **Studio Ghibli meets mobile game** aesthetic:
- Soft rounded features with large expressive eyes
- Sparkle reflections in eyes (2-3 white highlights)
- Small pink nose with subtle shine
- Subtle pink blush marks on cheeks
- Clean cel-shaded look with soft gradients
- Warm cozy lighting from upper left

#### Prompt Components
1. **STYLE_PROMPT** - Consistent art style foundation
2. **BREED_CHARACTERISTICS** - Face shape, expression, body type for each breed
3. **FUR_DESCRIPTIONS** - Detailed fur color descriptions
4. **PATTERN_DESCRIPTIONS** - Pattern type rendering
5. **EYE_DESCRIPTIONS** - Eye color with gemstone comparisons
6. **PERSONALITY_EXPRESSIONS** - Expression based on personality
7. **COSTUME_RENDER_INSTRUCTIONS** - Detailed costume placement and style

### Appearance Hash System

**File:** `src/lib/portraitUtils.ts`

Portraits are tracked using an appearance hash that includes:
- Breed (affects face shape)
- Appearance (fur, pattern, eyes, hair length, facial features)
- Costume ID (must be visible in portrait)
- Personality (affects expression)

```typescript
function computeAppearanceHash(cat: Cat, costumeId?: string): string {
  const data = {
    breed: cat.breed,
    appearance: cat.appearance || null,
    costumeId: costumeId || null,
    personality: cat.personality,
  };
  // Hash generation...
}
```

### Outdated Portrait Detection

**Hook:** `src/hooks/usePortraitStatus.ts`

Automatically detects when a portrait is outdated:
- Tracks cats without portraits
- Tracks cats with outdated portraits (hash mismatch)
- Provides lists for batch regeneration

```typescript
const { 
  outdatedCats, 
  catsNeedingPortrait,
  checkIfOutdated 
} = usePortraitStatus(cats, catCostumes);
```

### Portrait Quality Settings

**Graphics Settings Integration:**
- `portraitQuality`: 'standard' or 'premium' (uses `gemini-3-pro-image-preview`)
- `showOutdatedIndicator`: Show badge on outdated portraits
- `autoPromptOutdated`: Notify when portrait becomes outdated

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

### PortraitOutdatedBadge (`src/components/game/PortraitOutdatedBadge.tsx`)
Visual indicator for outdated or missing portraits.

**Props:**
- `cat: Cat` - The cat
- `isOutdated: boolean` - Whether portrait is outdated
- `hasNoPortrait?: boolean` - Cat has no portrait
- `creditsAvailable?: number` - Credits for regeneration
- `onRegenerate?: (catId: string) => void` - Regeneration callback

### BatchPortraitGenerator (`src/components/game/BatchPortraitGenerator.tsx`)
Generates portraits for multiple cats with progress tracking.

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

### Portrait Settings

| Setting | Type | Description |
|---------|------|-------------|
| `portraitQuality` | 'standard' \| 'premium' | AI model quality |
| `showOutdatedIndicator` | boolean | Show outdated badge |
| `autoPromptOutdated` | boolean | Notify on changes |

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

## Costume Rendering

### Costume Render Instructions

Each costume has detailed rendering instructions in the edge function:

```typescript
const COSTUME_RENDER_INSTRUCTIONS = {
  crown: {
    description: 'wearing an ornate golden royal crown',
    placement: 'The crown sits majestically on the head between the ears',
    style: 'shiny metallic gold with red velvet lining and sparkling gems',
  },
  wizard_hat: {
    description: 'wearing a tall mystical purple wizard hat',
    placement: 'The wizard hat sits at a slight jaunty angle',
    style: 'deep purple velvet with golden stars and crescent moons',
  },
  // ... all 20 costumes
};
```

### Costume Categories
- **Hats**: crown, wizard_hat, party_hat, top_hat, pirate
- **Accessories**: bow_tie, sunglasses, necklace, scarf
- **Full Outfits**: sweater, tuxedo, dragon, astronaut
- **Special**: superhero, angel_wings, unicorn
- **VIP**: vip_bronze_collar, vip_silver_cape, vip_gold_crown

---

## Breed Characteristics

Each breed has unique visual characteristics:

| Breed | Face | Expression | Fur |
|-------|------|------------|-----|
| Persian | Flat-faced, round head, tiny ears | Regal, haughty | Extremely fluffy |
| Siamese | Wedge-shaped, large pointed ears | Intelligent, curious | Sleek with points |
| Maine Coon | Large square muzzle, tufted ears | Gentle giant | Shaggy with mane |
| British Shorthair | Round chubby face, chubby cheeks | Calm, dignified | Dense plush |
| Ragdoll | Sweet face, vivid blue eyes | Docile, loving | Silky semi-long |
| Bengal | Wild exotic face, strong chin | Athletic, mischievous | Leopard-like spots |
| Tabby | Classic face with M-marking | Friendly, warm | Striped pattern |
| Stray | Natural domestic features | Street-smart | Practical coat |

---

## Hooks

### usePortraitStatus (`src/hooks/usePortraitStatus.ts`)
Track portrait status across all cats:
```tsx
const { 
  outdatedCats, 
  catsNeedingPortrait,
  checkIfOutdated,
  outdatedCount 
} = usePortraitStatus(cats, catCostumes);
```

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
4. **Portrait Generation**: AI generates portrait from appearance data with costume
5. **Hash Storage**: Appearance hash stored with portrait for drift detection
6. **Display**: CatVisual checks for portrait, falls back to avatar
7. **Outdated Detection**: If hash mismatches, portrait is marked outdated

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
- BreedingPanel, TrainingPanel, SocializePanel
- MatchmakingPanel, GroupActivitiesPanel
- CatGiftingPanel, TradingPanel, BulkActionsPanel
- RelationshipPanel, LeaderboardPanel

---

## Adding New Breeds

1. Add breed to `src/types/game.ts` BREEDS constant
2. Add shape definition to `src/lib/breedShapes.ts`
3. Add default appearance to `src/types/catAppearance.ts`
4. Add breed characteristics to edge function `BREED_CHARACTERISTICS`

## Adding New Costumes

1. Add costume to `src/types/costumes.ts` COSTUMES array
2. Add vector definition to `src/lib/costumeVectors.ts`
3. Add render instructions to edge function `COSTUME_RENDER_INSTRUCTIONS`

---

## Performance Tips

1. **Use caching**: Avatar cache prevents regeneration
2. **Lazy load portraits**: Portraits load on demand
3. **Reduce animations**: Disable for large grids
4. **Optimize size**: Use smallest appropriate size
5. **Batch generation**: Use BatchPortraitGenerator for multiple cats

---

## Troubleshooting

### Costumes not showing in portrait
- Verify costume is passed to edge function
- Check `COSTUME_RENDER_INSTRUCTIONS` has entry for costume ID
- Ensure `showCostumeOnPortrait` is enabled in settings

### Portrait not matching appearance
- Check if portrait hash matches current appearance
- Use `isPortraitOutdated()` to verify
- Regenerate portrait with current appearance

### Portrait quality issues
- Enable `portraitQuality: 'premium'` in graphics settings
- Premium uses `gemini-3-pro-image-preview` model

### Animations not working
- Check `enableAnimations` in graphics config
- Verify `prefers-reduced-motion` system setting
- Ensure `animated` prop passed to CatVisual
