

# AI Cat Portrait System Enhancement Plan

## Goal
Create a system where AI-generated cat portraits **exactly match** cat properties (appearance, breed, personality) and render costumes **effectively and cutely** - updating automatically when changes are detected.

---

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────┐
│                    Enhanced Portrait System                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ Appearance   │───>│ Hash System  │───>│ Outdated     │      │
│  │ Changes      │    │ Detection    │    │ Detection    │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                 │                │
│                                                 ▼                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Auto-Regeneration Prompt                     │  │
│  │  "Your cat's look has changed! Regenerate portrait?"     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                 │                │
│                                                 ▼                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Enhanced Prompt Builder                         │  │
│  │  - Precise appearance descriptors                        │  │
│  │  - Costume-specific rendering instructions               │  │
│  │  - Consistent cartoon style definition                   │  │
│  │  - Breed-specific body language                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                 │                │
│                                                 ▼                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Lovable AI (gemini-2.5-flash-image)            │  │
│  │           or gemini-3-pro-image-preview for quality      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Enhanced Prompt Engineering

### 1.1 Create Comprehensive Prompt Builder

**File:** `supabase/functions/generate-cat-portrait/index.ts`

Improve the `buildPrompt()` function with:

**Precise Appearance Mapping:**
```typescript
// Detailed fur color descriptions
const FUR_DESCRIPTIONS = {
  orange: 'warm orange tabby-like fur',
  black: 'sleek jet-black fur',
  white: 'pure snowy white fur',
  gray: 'silvery gray fur',
  brown: 'rich chocolate brown fur',
  cream: 'soft creamy beige fur',
  ginger: 'bright ginger-red fur',
  calico: 'tri-colored calico patches of orange, black and white'
};

// Pattern descriptions
const PATTERN_DESCRIPTIONS = {
  solid: 'solid single color',
  tabby: 'classic tabby stripes on forehead and body',
  spotted: 'leopard-like spotted pattern',
  tuxedo: 'formal tuxedo pattern with white chest and black body',
  bicolor: 'two-tone bi-color pattern',
  calico: 'random calico patches'
};
```

**Consistent Style Definition:**
```typescript
const STYLE_PROMPT = `
Style: Cute kawaii cartoon cat portrait in the style of Studio Ghibli meets 
modern mobile game art. Soft rounded features, large expressive eyes with 
sparkle reflections, small pink nose, subtle blush marks on cheeks. 
Clean cel-shaded look with soft gradients. Warm cozy lighting.
Background: Simple soft gradient, not distracting.
Composition: Head and upper body portrait, cat facing slightly toward camera.
Quality: High detail on fur texture, ultra-cute expression, professional 
digital art quality.
`;
```

**Costume-Specific Rendering:**
```typescript
const COSTUME_RENDER_INSTRUCTIONS = {
  crown: {
    description: 'wearing an ornate golden royal crown with red gems',
    placement: 'crown sits properly on head between ears',
    style: 'shiny metallic gold with jewel details'
  },
  wizard_hat: {
    description: 'wearing a tall purple wizard hat decorated with golden stars and moons',
    placement: 'hat sits at a slight jaunty angle',
    style: 'deep purple fabric with magical sparkles'
  },
  // ... all costumes with specific visual instructions
};
```

### 1.2 Add Breed-Specific Body Language

```typescript
const BREED_CHARACTERISTICS = {
  persian: {
    face: 'flat-faced Persian with round head and small ears',
    expression: 'regal and slightly haughty',
    fur: 'extremely fluffy long-haired coat'
  },
  siamese: {
    face: 'elegant wedge-shaped face with large pointed ears',
    expression: 'intelligent and curious',
    fur: 'sleek short coat with darker points on ears, face, paws'
  },
  'maine-coon': {
    face: 'large square muzzle with tufted ears',
    expression: 'gentle giant, friendly',
    fur: 'very fluffy with distinctive mane and bushy tail'
  },
  // ... all breeds
};
```

---

## Phase 2: Automatic Outdated Portrait Detection

### 2.1 Create Portrait Status Hook

**File:** `src/hooks/usePortraitStatus.ts` (New)

```typescript
interface UsePortraitStatusReturn {
  outdatedCats: Cat[];
  checkIfOutdated: (cat: Cat, costumeId?: string) => boolean;
  markAsUpToDate: (catId: string, hash: string) => void;
}

export function usePortraitStatus(cats: Cat[], catCostumes: Record<string, string>) {
  // Track which cats have outdated portraits
  // Return list for batch regeneration UI
}
```

### 2.2 Add Inline Regeneration Prompt

**File:** `src/components/game/PortraitOutdatedBadge.tsx` (New)

When a cat's portrait is outdated, show a subtle badge:
- Small ⚠️ icon on cat cards
- Tooltip: "Portrait outdated - appearance changed"
- Click to regenerate (if credits available)

---

## Phase 3: Quick Regeneration Flow

### 3.1 Add Regeneration Button to Cat Cards

**File:** `src/components/game/UnifiedCatCard.tsx` (Update)

Add regeneration button when portrait is outdated:
- Shows only when `isPortraitOutdated(cat, costumeId)` returns true
- One-click regeneration with credit check
- Loading state during generation

### 3.2 Batch Portrait Regeneration

**File:** `src/components/game/BatchPortraitGenerator.tsx` (Update existing)

Enhance to:
- Show all cats with outdated portraits
- "Regenerate All" button with credit cost display
- Progress indicator during batch generation

---

## Phase 4: Enhanced Edge Function

### 4.1 Update generate-cat-portrait Function

**File:** `supabase/functions/generate-cat-portrait/index.ts`

Key changes:

1. **Use Better Model for Quality:**
   ```typescript
   // For premium quality, use the pro model
   const MODEL = useHighQuality 
     ? 'google/gemini-3-pro-image-preview' 
     : 'google/gemini-2.5-flash-image';
   ```

2. **Enhanced Prompt Structure:**
   ```typescript
   function buildPrompt(cat: CatData): string {
     const parts = [
       buildStylePrompt(),           // Consistent cartoon style
       buildBreedPrompt(cat),        // Breed-specific features
       buildAppearancePrompt(cat),   // Exact colors/patterns
       buildExpressionPrompt(cat),   // Personality-based expression
       buildCostumePrompt(cat),      // Detailed costume rendering
       buildQualityPrompt()          // Technical quality requirements
     ];
     return parts.join(' ');
   }
   ```

3. **Costume Rendering Priority:**
   ```typescript
   // If costume equipped, make it prominent
   if (costume) {
     prompt += `IMPORTANT: The cat is wearing ${costume.name}. 
       ${COSTUME_RENDER_INSTRUCTIONS[costume.id].description}. 
       The costume must be clearly visible and ${COSTUME_RENDER_INSTRUCTIONS[costume.id].style}. 
       ${COSTUME_RENDER_INSTRUCTIONS[costume.id].placement}.`;
   }
   ```

---

## Phase 5: Graphics Settings Integration

### 5.1 Add Portrait Quality Setting

**File:** `src/hooks/useGraphicsSettings.ts` (Update)

```typescript
export interface GraphicsSettings {
  // ... existing
  
  // Portrait settings
  portraitQuality: 'standard' | 'premium';  // Uses different AI model
  autoRegenerateOutdated: boolean;          // Prompt to regenerate on change
  showOutdatedIndicator: boolean;           // Show badge on outdated portraits
}
```

### 5.2 Add Settings UI

**File:** `src/components/game/GraphicsSettingsPanel.tsx` (Update)

Add new section:
- Portrait Quality toggle (Standard/Premium)
- Auto-regenerate prompt toggle
- Outdated indicator toggle

---

## Phase 6: Costume-Portrait Synchronization

### 6.1 Update Hash to Include Costume

**File:** `src/lib/portraitUtils.ts` (Update)

```typescript
export function computeAppearanceHash(cat: Cat, costumeId?: string): string {
  const data = {
    breed: cat.breed,
    appearance: cat.appearance || null,
    costumeId: costumeId || null,  // Already included
    personality: cat.personality,   // Add personality for expression
  };
  // ... hash generation
}
```

### 6.2 Detect Costume Changes

When costume is equipped/unequipped:
- Check if portrait includes costume
- Prompt for regeneration if mismatch
- Store whether portrait includes costume in metadata

---

## File Summary

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/generate-cat-portrait/index.ts` | Update | Enhanced prompt builder with detailed appearance/costume/style instructions |
| `src/hooks/usePortraitStatus.ts` | Create | Hook to track outdated portraits across all cats |
| `src/components/game/PortraitOutdatedBadge.tsx` | Create | Visual indicator for outdated portraits |
| `src/components/game/UnifiedCatCard.tsx` | Update | Add inline regeneration button |
| `src/components/game/BatchPortraitGenerator.tsx` | Update | Enhance batch regeneration UI |
| `src/lib/portraitUtils.ts` | Update | Include personality in hash |
| `src/hooks/useGraphicsSettings.ts` | Update | Add portrait quality settings |
| `src/components/game/GraphicsSettingsPanel.tsx` | Update | Add portrait settings UI |
| `docs/CAT_VISUAL_SYSTEM.md` | Update | Document enhanced portrait system |

---

## Prompt Engineering Examples

### Example 1: Orange Tabby with Crown
```text
Style: Cute kawaii cartoon cat portrait in Studio Ghibli style. 
Soft rounded features, large expressive eyes with sparkle reflections.

Cat: A domestic tabby cat with warm orange tabby-like fur featuring 
classic tabby stripes on forehead. Beautiful amber eyes with golden 
highlights. Short fluffy coat. The cat has a playful, excited expression 
with wide bright eyes and a slight smile.

Costume: IMPORTANT - The cat is wearing an ornate golden royal crown 
with red gems. The crown sits properly on the head between the ears. 
The crown should be shiny metallic gold with visible jewel details.

Quality: High detail fur texture, ultra-cute expression, professional 
digital art, soft warm studio lighting, simple gradient background.
```

### Example 2: Black Persian with Wizard Hat
```text
Style: Cute kawaii cartoon cat portrait in Studio Ghibli style.
Soft rounded features, large expressive eyes with sparkle reflections.

Cat: A beautiful Persian cat with sleek jet-black fur and extremely 
fluffy long-haired coat. Flat-faced with round head and small ears. 
Stunning heterochromia eyes - one blue, one green. The cat has a 
regal, slightly haughty expression.

Costume: IMPORTANT - The cat is wearing a tall purple wizard hat 
decorated with golden stars and moons. The hat sits at a slight 
jaunty angle between the ears. Deep purple fabric with magical 
sparkles emanating from it.

Quality: High detail fur texture, ultra-cute expression, professional 
digital art, soft warm studio lighting, simple gradient background.
```

---

## Technical Considerations

1. **Credit Economy**: Premium quality portraits could cost more credits
2. **Rate Limiting**: Existing rate limit (10/hour) prevents abuse
3. **Caching**: Store appearance hash with portrait to detect drift
4. **Fallback**: If regeneration fails, keep existing portrait
5. **Model Selection**: Use `gemini-3-pro-image-preview` for best quality

---

## User Experience Flow

1. User customizes cat appearance or equips costume
2. System detects portrait is outdated (hash mismatch)
3. Small badge appears on cat card: "🔄 Portrait outdated"
4. User clicks badge → modal appears with:
   - Current portrait vs. current appearance preview
   - "Regenerate (1 credit)" button
   - Credit balance display
5. New portrait generated and saved
6. Badge disappears, new portrait displays

---

## Success Metrics

- Portraits accurately reflect cat appearance 95%+ of the time
- Costumes clearly visible and recognizable in portraits
- Consistent art style across all generated portraits
- Users regenerate outdated portraits within 1 session
- Reduced support requests about portrait mismatches

