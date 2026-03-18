# Pokémon-Style Card Redesign Plan

## Overview
Transform cat cards into authentic Pokémon TCG-style cards with proper structure, holographic effects, breed-based type system, 3D tilt, and flip animations across all 5 tiers.

---

## Phase 1: Breed Type System & Design Tokens

### 1a. Create `src/config/breedTypes.ts`
Map each breed to a Pokémon-style "type" with colors and gradients:

| Breed | Type | Primary Color | Gradient |
|-------|------|---------------|----------|
| Persian | Psychic | `#8338ec` | purple → pink |
| Bengal | Fire | `#ff6b35` | orange → red |
| Tabby | Normal | `#a8a878` | tan → brown |
| Ragdoll | Water | `#3a86ff` | blue → cyan |
| Siamese | Ice | `#96d9d6` | light blue → white |
| Maine Coon | Fighting | `#c22e28` | brown → red |
| British Shorthair | Steel | `#b8b8d0` | silver → gray |
| Stray | Dark | `#705848` | dark brown → black |

Each type includes: `icon`, `gradient`, `energyColor`, `imageGradient`.

### 1b. Add CSS variables & keyframes to `src/index.css`
- Card gold/silver frame colors
- Holo animation keyframes: `holoShift`, `twinkle`, `rainbow`, `cosmosSwirl`
- Card texture overlay (subtle noise SVG)
- Shine sweep animation
- 3D tilt utility classes

---

## Phase 2: New PokemonCard Component

### Create `src/components/game/PokemonCard.tsx`
A new dedicated component for the Pokémon TCG layout.

**Card structure (320×448 aspect ratio):**
```
┌─────────────────────────────┐
│  [FRAME: tier-colored]      │
│  ┌───────────────────────┐  │
│  │ [Evo Stage]    [HP]   │  │
│  │ [NAME]      [Type 🔥] │  │
│  │ ┌─────────────────┐   │  │
│  │ │  CAT AVATAR/    │   │  │
│  │ │  PORTRAIT        │   │  │
│  │ │  (type gradient)  │   │  │
│  │ └─────────────────┘   │  │
│  │ [Description bar]     │  │
│  │ ┌─────────────────┐   │  │
│  │ │ [⚡] Move 1   30 │   │  │
│  │ │ flavor text      │   │  │
│  │ └─────────────────┘   │  │
│  │ ┌─────────────────┐   │  │
│  │ │ [⚡⚡] Move 2  60│   │  │
│  │ │ flavor text      │   │  │
│  │ └─────────────────┘   │  │
│  │ Weakness | Resist | Retreat│
│  │ ★★★★ | #018/100 | CCE │  │
│  └───────────────────────┘  │
│  [HOLO OVERLAY]             │
│  [SHINE EFFECT]             │
└─────────────────────────────┘
```

**Key features:**
- **Frame colors by tier:** Common=silver matte, Uncommon=silver gloss, Rare=gold, Legendary=gold cosmos, Mythic=animated rainbow
- **HP display:** Top-right, large red number from `cat.health`
- **Evolution stage:** stray=Basic, adopted=Stage 1, pure=Stage 2
- **Type energy icons:** Circular breed-colored icons
- **Move cards:**
  - Move 1 = Personality ability (e.g., "Playful Swipe", "Independent Blaze")
  - Move 2 = Best learned trick or breed special
  - Damage = calculated from grade + stats
- **Weakness/Resistance/Retreat:** Derived from breed type matchups
- **Footer:** Rarity stars, card number, CCE set symbol
- **Texture:** Subtle canvas/paper noise overlay

### Holographic effects (tier-progressive):
- **Common:** None (matte)
- **Uncommon:** Subtle sheen sweep on hover
- **Rare:** Twinkling star particles + diagonal holo
- **Legendary:** Cosmos swirl + dynamic shine
- **Mythic:** Animated rainbow border + full rainbow overlay

### 3D Tilt (mouse-follow):
- `perspective: 1500px` on container
- `onMouseMove` → calculate rotateX/rotateY from cursor position
- Dynamic radial-gradient shine follows cursor
- Holo intensity increases with tilt angle
- Disabled when card is flipped
- Touch support via `onTouchMove`

---

## Phase 3: Card Flip (Back Side)

### Back design in PokemonCard:
```
┌─────────────────────────────┐
│  [FRAME: tier-colored]      │
│  ┌───────────────────────┐  │
│  │      CAT NAME         │  │
│  │    [Breed subtitle]   │  │
│  │  ┌──────┐ ┌──────┐   │  │
│  │  │Hunger│ │ Rest │   │  │
│  │  └──────┘ └──────┘   │  │
│  │  ┌──────┐ ┌──────┐   │  │
│  │  │ Feed │ │ Wins │   │  │
│  │  └──────┘ └──────┘   │  │
│  │  [Lore/description]   │  │
│  │  Tricks: 🪑🐾🔄⬆️🎾  │  │
│  │  Social: 💚5  😾2    │  │
│  │  Value: $350          │  │
│  │  [CCE Logo]           │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

- Flip via 🔄 button or click
- 0.6s cubic-bezier `rotateY(180deg)` transition
- 3D tilt disabled while flipped

---

## Phase 4: Move Generation System

### Create `src/lib/cardMoves.ts`
Generate Pokémon-style moves from cat data:

| Personality | Move Name | Base Damage |
|-------------|-----------|-------------|
| Playful | Playful Swipe | 20 |
| Affectionate | Warm Embrace | 30 (heals) |
| Independent | Lone Strike | 40 |
| Curious | Investigate | 20 (draw) |
| Lazy | Nap Attack | 10 (buff) |
| Shy | Shadow Fade | 20 (dodge) |

Move 2 = best trick or breed special. Damage scales with grade.

---

## Phase 5: Integration

### Modify `UnifiedCatCard.tsx`:
- `variant="trading"` → renders PokemonCard
- Add `variant="pokemon"` as explicit alias
- Keep `variant="card"` as standard game card

### Update `CardShowcase.tsx`:
- Add Pokémon card showcase section for all 5 tiers

### Update `CatCollection.tsx`:
- Use Pokémon card variant

---

## File Changes Summary

| File | Action |
|------|--------|
| `src/config/breedTypes.ts` | CREATE |
| `src/lib/cardMoves.ts` | CREATE |
| `src/components/game/PokemonCard.tsx` | CREATE |
| `src/components/game/UnifiedCatCard.tsx` | MODIFY |
| `src/config/graphics.ts` | MODIFY |
| `src/index.css` | MODIFY |
| `src/pages/CardShowcase.tsx` | MODIFY |

## Implementation Order
1. `breedTypes.ts` + `cardMoves.ts` (data layer)
2. CSS animations in `index.css`
3. `PokemonCard.tsx` (core component with front/back/tilt)
4. Wire into `UnifiedCatCard.tsx`
5. Update `CardShowcase.tsx`
6. Test all 5 tiers + flip + 3D tilt
