

# Empire AI Rendering System - Knowledge File & Implementation Plan

## Overview

This plan creates a comprehensive knowledge document for the Empire page's visual system and implements an AI rendering feature where users can pay 20,000 credits to generate a persistent AI-rendered Empire scene.

---

## Part 1: Empire Visual System Knowledge File

### New Documentation File: `docs/EMPIRE_AI_RENDERING.md`

This knowledge file will document all visual details needed for accurate AI rendering:

---

### 1. DWELLING TIERS & BACKGROUNDS

Each house size has a unique SVG-rendered scene with specific color palettes:

| Tier | Name | Style | Key Colors |
|------|------|-------|------------|
| **Apartment** | Cozy Apartment | Urban interior | Amber walls `hsl(35, 45%, 85%)`, wood floor `hsl(25, 40%, 45%)`, city skyline |
| **House** | Suburban House | Living room | Cream walls `hsl(45, 40%, 92%)`, carpet `hsl(45, 30%, 75%)`, garden view |
| **Mansion** | Luxury Estate | Grand parlor | Lavender walls `hsl(270, 30%, 92%)`, marble floor, gold accents `hsl(45, 80%, 55%)` |
| **Farm** | Cat Empire Farm | Outdoor pastoral | Sky gradients, grass `hsl(100, 55%, 50%)`, red barn `hsl(0, 70%, 40%)` |

### 2. SKY/TIME-OF-DAY COLOR SYSTEMS

**4-phase day cycle (based on gameDay % 4):**

| Time | Filter Style | Gradient Colors | Ambient Color |
|------|--------------|-----------------|---------------|
| **Morning** | `sepia(0.1) brightness(1.05) saturate(1.1)` | `from-yellow-200/20 via-amber-100/10` | `rgba(255, 200, 100, 0.15)` |
| **Afternoon** | `brightness(1.02) saturate(1.05)` | Transparent | `rgba(255, 255, 255, 0.05)` |
| **Evening** | `sepia(0.15) brightness(0.95) saturate(1.2)` | `from-orange-300/25 via-pink-200/15` | `rgba(255, 140, 80, 0.2)` |
| **Night** | `brightness(0.75) saturate(0.85) contrast(1.1)` | `from-blue-900/40 via-indigo-900/30` | `rgba(100, 120, 200, 0.25)` |

**Per-tier sky colors:**

```
Apartment:
  Morning: { top: '#FFE4C4', bottom: '#87CEEB' }
  Afternoon: { top: '#87CEEB', bottom: '#E0F4FF' }
  Evening: { top: '#FF7F50', bottom: '#4B0082' }
  Night: { top: '#1a1a2e', bottom: '#16213e' }

House:
  Morning: { top: '#FFF8DC', bottom: '#87CEEB' }
  Afternoon: { top: '#87CEEB', bottom: '#E8F8E8' }
  Evening: { top: '#FF8C69', bottom: '#9370DB' }
  Night: { top: '#1a1a2e', bottom: '#2d3a4f' }

Mansion (ambient):
  Morning: { wall: 'hsl(270, 30%, 92%)', accent: 'hsl(45, 70%, 75%)' }
  Afternoon: { wall: 'hsl(270, 25%, 95%)', accent: 'hsl(45, 65%, 80%)' }
  Evening: { wall: 'hsl(270, 35%, 85%)', accent: 'hsl(35, 80%, 65%)' }
  Night: { wall: 'hsl(270, 40%, 25%)', accent: 'hsl(45, 60%, 50%)' }

Farm:
  Morning: { top: '#FFE4B5', mid: '#FFA07A', bottom: '#87CEEB' }
  Afternoon: { top: '#87CEEB', mid: '#B0E0E6', bottom: '#98FB98' }
  Evening: { top: '#FF6347', mid: '#FF8C00', bottom: '#4B0082' }
  Night: { top: '#0d1b2a', mid: '#1b263b', bottom: '#415a77' }
```

### 3. FURNITURE/PROPS BY TIER

**Apartment Props:**
| ID | Name | Emoji | Position (x%, y%) | Interactable | Cat Behavior |
|----|------|-------|-------------------|--------------|--------------|
| window | City Window | 🪟 | 50, 15 | No | - |
| cat-tree | Cat Tree | 🌲 | 12, 55 | Yes | Play |
| cat-bed | Cat Bed | 🛏️ | 85, 70 | Yes | Sleep |
| plant | Potted Plant | 🪴 | 8, 35 | No | - |
| bookshelf | Bookshelf | 📚 | 92, 30 | No | - |
| food-bowl | Food Bowl | 🥣 | 75, 80 | Yes | Play |
| radiator | Radiator | 🔥 | 25, 75 | No | Attract |
| cushion | Floor Cushion | 🟤 | 45, 68 | No | Attract |

**House Props:**
| ID | Name | Emoji | Position | Interactable | Cat Behavior |
|----|------|-------|----------|--------------|--------------|
| bay-window | Bay Window | 🪟 | 50, 12 | No | - |
| couch | Couch | 🛋️ | 30, 60 | Yes | Sleep |
| fireplace | Fireplace | 🧱 | 80, 40 | No | Attract |
| rug | Cozy Rug | 🟫 | 50, 72 | No | - |
| garden-door | Garden Door | 🚪 | 90, 55 | Yes | Perch |
| cat-tower | Cat Tower | 🗼 | 10, 58 | Yes | Play |
| ottoman | Ottoman | 🟫 | 40, 65 | No | Attract |

**Mansion Props:**
| ID | Name | Emoji | Position | Interactable | Cat Behavior |
|----|------|-------|----------|--------------|--------------|
| chandelier | Chandelier | ✨ | 50, 8 | No | - |
| piano | Grand Piano | 🎹 | 20, 55 | Yes | Perch |
| chaise | Velvet Chaise | 🛋️ | 70, 65 | Yes | Sleep |
| columns-left | Marble Column | 🏛️ | 8, 45 | No | - |
| columns-right | Marble Column | 🏛️ | 92, 45 | No | - |
| fountain | Fountain | ⛲ | 50, 75 | No | Attract |
| cat-throne | Cat Throne | 👑 | 85, 58 | Yes | Sleep |
| statue | Cat Statue | 🗿 | 15, 72 | No | - |

**Farm Props:**
| ID | Name | Emoji | Position | Interactable | Cat Behavior |
|----|------|-------|----------|--------------|--------------|
| barn | Red Barn | 🏠 | 85, 25 | Yes | Hide |
| hay-bale-1/2/3 | Hay Bales | 🟨 | 20-30, 65-75 | Yes | Play/Attract |
| fence | Wooden Fence | 🪵 | 50, 50 | Yes | Perch |
| water-trough | Water Trough | 🪣 | 70, 75 | No | Attract |
| windmill | Windmill | 🌀 | 12, 20 | No | - |
| tractor | Tractor | 🚜 | 60, 40 | No | - |
| tree-1/2 | Trees | 🌳🌲 | 5/95, 50/55 | No | - |
| sunspot | Sunny Spot | ☀️ | 45, 68 | No | Attract |

### 4. CAT APPEARANCE SYSTEM

**Fur Colors (8 options):**
```
orange:  #F97316 - warm marmalade with golden undertones
black:   #1C1917 - jet-black with blue sheen
white:   #FAFAF9 - snowy white with cream tint
gray:    #6B7280 - silvery gray with blue undertones
brown:   #78350F - chocolate brown with chestnut highlights
cream:   #FEF3C7 - soft creamy beige like vanilla
ginger:  #EA580C - bright ginger-red with copper highlights
calico:  #FBBF24 - tri-colored patches (orange, black, white)
```

**Patterns (6 options):**
- `solid` - Single-color coat, no markings
- `tabby` - M-shape on forehead, tiger stripes
- `spotted` - Leopard-like dark spots
- `tuxedo` - White chest/chin/paws on dark body
- `bicolor` - Two-tone with clean separation
- `calico` - Random patches of orange, black, white

**Eye Colors (6 options):**
```
green:        #22C55E - emerald sparkle
blue:         #3B82F6 - sapphire deep
amber:        #F59E0B - golden honey
gold:         #EAB308 - brilliant treasure
heterochromia: One blue (#3B82F6), one green (#22C55E)
copper:       #B45309 - warm bronze
```

**Hair Lengths:**
- `short` - Sleek, smooth, flat
- `medium` - Fluffy with soft volume
- `fluffy` - Long-haired, incredibly soft, huggable

**Facial Features:**
- `normal` - Standard cute face
- `scar` - Small cheek scar (battle-worn)
- `eyepatch` - Dark patch over one eye (pirate charm)
- `whiskers_long` - Extra long dramatic whiskers
- `grumpy` - Furrowed brow (famous grumpy cat look)
- `cute_blush` - Extra rosy pink blush marks

### 5. BREED CHARACTERISTICS (8 breeds)

| Breed | Face | Body | Default Appearance |
|-------|------|------|-------------------|
| **Stray** | Alert, street-smart | Lean athletic | Gray tabby, amber eyes |
| **Tabby** | M-marking forehead | Medium well-proportioned | Orange tabby, green eyes |
| **Persian** | Flat-faced, round, smushed nose | Stocky cobby, short legs | White solid, blue eyes, fluffy |
| **Siamese** | Wedge-shaped, large pointed ears | Slender, long graceful limbs | Cream bicolor, blue eyes |
| **Maine Coon** | Square muzzle, tufted ears | Very large, gentle giant | Brown tabby, gold eyes, fluffy |
| **British Shorthair** | Round chubby cheeks | Stocky compact, chunky paws | Gray solid, copper eyes, short |
| **Ragdoll** | Sweet face, vivid blue eyes | Large floppy body | Cream bicolor, blue eyes, fluffy |
| **Bengal** | Wild exotic, strong chin | Muscular athletic | Ginger spotted, green eyes, short |

### 6. COSTUMES (20 total)

**Categories & Render Instructions:**
| ID | Name | Category | Rarity | Placement | Style Description |
|----|------|----------|--------|-----------|-------------------|
| party_hat | Party Hat | Hat | Common | Jaunty angle on head | Rainbow stripes, pom-pom, chin strap |
| top_hat | Fancy Top Hat | Hat | Uncommon | Balanced on head | Glossy black silk, ribbon band |
| crown | Royal Crown | Hat | Rare | Majestically on head | Gold, ruby/sapphire gems, red velvet |
| wizard_hat | Wizard Hat | Hat | Rare | Slight jaunty angle | Purple velvet, gold stars/moons, sparkles |
| sweater | Cozy Sweater | Outfit | Common | Snug around body/neck | Cable-knit, autumn colors |
| tuxedo | Elegant Tuxedo | Outfit | Uncommon | Fitted with lapels | Black/white formal, satin bow tie |
| superhero | Superhero Cape | Outfit | Uncommon | Fastened at neck, flowing | Red satin, golden emblem clasp |
| pirate | Pirate Costume | Outfit | Uncommon | Tricorn hat | Black hat, skull/crossbones |
| bow_tie | Bow Tie | Accessory | Common | At collar | Polka-dot or striped, bright colors |
| sunglasses | Cool Sunglasses | Accessory | Common | On nose bridge | Aviator/cat-eye, reflective lenses |
| necklace | Pearl Necklace | Accessory | Uncommon | Draped around neck | Classic white pearls, subtle sheen |
| scarf | Silk Scarf | Accessory | Common | Wrapped around neck | Luxurious silk, artistic pattern |
| angel_wings | Angel Wings | Special | Legendary | Behind shoulders | White feathers, golden glow, ethereal |
| dragon | Dragon Costume | Special | Legendary | Full body onesie | Green dragon, small wings, horns, tail |
| astronaut | Space Suit | Special | Rare | Astronaut helmet | White suit, NASA patches, reflective visor |
| unicorn | Unicorn Horn | Special | Legendary | Forehead between ears | Iridescent rainbow spiral, sparkles |
| vip_bronze_collar | VIP Bronze Collar | Accessory | Legendary | Around neck | Polished bronze, VIP medallion |
| vip_silver_cape | VIP Silver Cape | Outfit | Legendary | Fastened at shoulders | Silver fabric, starlight sparkles |
| vip_gold_crown | VIP Gold Crown | Hat | Legendary | Regally on head | Pure gold, diamonds/rubies, radiant |

### 7. SEASONAL DECORATIONS

**Season Particle Config:**
| Season | Emojis | Count | Animation | Color Wash |
|--------|--------|-------|-----------|------------|
| Spring | 🌸🌺💮 | 8 | Fall + Sway | `rgba(255, 200, 220, 0.05)` pink |
| Summer | ☀️🦋✨ | 6 | Float | `rgba(255, 240, 200, 0.05)` yellow |
| Autumn | 🍂🍁🍃 | 10 | Fall + Spin | `rgba(255, 180, 120, 0.08)` orange |
| Winter | ❄️❅❆ | 12 | Fall + Sway | `rgba(200, 220, 255, 0.08)` blue |

**Per-tier seasonal decorations:**
```
Apartment Spring: 🌸 at (10, 30), 🌷 at (88, 35)
Apartment Summer: 🌻 at (10, 30), ☀️ at (60, 8)
Apartment Autumn: 🍂 at (10, 30), 🎃 at (88, 72)
Apartment Winter: ❄️ at (45, 10), 🎄 at (90, 55)

Farm Spring: 🌸 at (5, 45), 🐣 at (55, 78), 🌷 at (40, 80)
Farm Summer: 🌻 at (78, 60), 🦋 at (35, 35), 🐝 at (55, 45)
Farm Autumn: 🎃 at (40, 72), 🍂 at (15, 55), 🌾 at (75, 68)
Farm Winter: ⛄ at (35, 65), ❄️ at (25, 25), ❄️ at (60, 18)
```

### 8. PARALLAX DEPTH SYSTEM

**Layer depths (multipliers for mouse movement):**
```
background:    0.1  - Minimal movement (furthest)
midBackground: 0.25 - Wall decorations
midground:     0.5  - Props/furniture
midForeground: 0.75 - Floor items
foreground:    1.0  - Cats (strongest parallax)
```

**Micro-depth per object type:**
```
props:  baseDepth=0.5, microRange=0.12
cats:   baseDepth=1.0, microRange=0.18
floor:  baseDepth=0.75, microRange=0.10
wall:   baseDepth=0.25, microRange=0.05
```

### 9. CAT PORTRAIT AI STYLE

The existing portrait generator uses this consistent style:

```
Style: Cute kawaii cartoon cat portrait in the style of Studio Ghibli meets modern mobile game art.
- Soft rounded features with large expressive eyes
- Sparkle reflections in the eyes (2-3 small white highlights)
- Small pink nose with subtle shine
- Subtle pink blush marks on cheeks
- Clean cel-shaded look with soft gradients
- Warm cozy lighting from upper left
- Simple soft gradient background (warm cream/pink tones)
- Head and upper body portrait composition
- Cat facing slightly toward camera (3/4 view)
- Professional digital art quality, ultra-cute expression
- High detail on fur texture with visible individual strands
- 4K resolution, masterpiece quality
```

---

## Part 2: AI Empire Rendering Feature Implementation

### Feature Overview

- **Cost**: 20,000 in-game credits (coins)
- **Storage**: Generated image saved to `empire-renders` storage bucket
- **Persistence**: URL stored in `game_saves.game_state.empireRenderUrl`
- **Behavior**: 
  - Rendered image persists as background
  - New cats (without AI portrait) display as regular emoji/vector overlays
  - Cats WITH AI portraits display their portraits in the scene
  - Provides incentive to generate individual cat portraits

### Database Changes

1. **New storage bucket**: `empire-renders` (public)
2. **New table**: `empire_render_credits` or use existing `game_saves.game_state.empireRenderUrl`

### New Edge Function: `generate-empire-scene`

```typescript
// Prompt construction includes:
// - Dwelling tier background description
// - Time of day lighting
// - Season decorations
// - All furniture positions
// - All cats with appearance details
// - All equipped costumes
```

### UI Changes

1. **EmpireScene.tsx**: Add "Render Empire" button (shows cost: 20,000 credits)
2. **EmpireRenderDialog.tsx**: Confirmation dialog with preview of what will be rendered
3. **Display logic**: If `empireRenderUrl` exists, show as background; overlay non-AI-rendered cats

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `docs/EMPIRE_AI_RENDERING.md` | **Create** | Complete knowledge file with all visual specifications |
| `supabase/functions/generate-empire-scene/index.ts` | **Create** | Edge function for AI rendering |
| `src/components/empire/EmpireRenderButton.tsx` | **Create** | Button component with cost display |
| `src/components/empire/EmpireRenderDialog.tsx` | **Create** | Confirmation dialog |
| `src/hooks/useEmpireRender.ts` | **Create** | Hook for rendering logic and state |
| `src/components/empire/EmpireScene.tsx` | **Modify** | Add render button, display rendered background |
| `src/types/game.ts` | **Modify** | Add `empireRenderUrl?: string` to GameState |

---

## Technical Details

### Prompt Builder for Empire Scene

```typescript
function buildEmpirePrompt(params: {
  houseSize: HouseSize;
  timeOfDay: TimeOfDay;
  season: RealSeason;
  cats: Cat[];
  catCostumes: Record<string, string>;
  props: EmpireProp[];
}): string {
  // 1. Style foundation (same as cat portraits)
  // 2. Background tier description
  // 3. Time of day lighting
  // 4. Seasonal decorations
  // 5. Props/furniture layout
  // 6. Each cat with full appearance + position + costume
  // 7. Quality requirements
}
```

### Cost System

- Uses existing `money` from GameState
- Deduct 20,000 on successful render
- Show error if insufficient funds

### Rendering Behavior

```typescript
// In EmpireScene.tsx
if (state.empireRenderUrl) {
  // Show AI-rendered background
  // Overlay cats that don't have AI portraits
  // Cats with portraitUrl are part of the render
} else {
  // Show current SVG background + all emoji cats
}
```

---

## Summary

This plan:
1. **Documents** all Empire visual specifications in a new knowledge file
2. **Implements** an AI rendering feature for 20,000 credits
3. **Persists** the rendered scene in cloud storage
4. **Incentivizes** individual cat portrait generation (non-AI cats appear as overlays)
5. **Maintains** backward compatibility with existing SVG rendering

