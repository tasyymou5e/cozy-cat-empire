# Empire AI Rendering System - Visual Knowledge File

This document contains comprehensive specifications for the Empire page visual system, enabling accurate AI-generated renders of the cat empire scene.

---

## 1. DWELLING TIERS & BACKGROUNDS

Each house size has a unique SVG-rendered scene with specific color palettes:

| Tier | Name | Style | Key Colors |
|------|------|-------|------------|
| **Apartment** | Cozy Apartment | Urban interior | Amber walls `hsl(35, 45%, 85%)`, wood floor `hsl(25, 40%, 45%)`, city skyline |
| **House** | Suburban House | Living room | Cream walls `hsl(45, 40%, 92%)`, carpet `hsl(45, 30%, 75%)`, garden view |
| **Mansion** | Luxury Estate | Grand parlor | Lavender walls `hsl(270, 30%, 92%)`, marble floor, gold accents `hsl(45, 80%, 55%)` |
| **Farm** | Cat Empire Farm | Outdoor pastoral | Sky gradients, grass `hsl(100, 55%, 50%)`, red barn `hsl(0, 70%, 40%)` |

### Detailed Tier Descriptions

**Apartment (Starter)**
- Cozy urban apartment with city view through window
- Wood laminate flooring with warm amber tones
- Compact but comfortable space
- City skyline visible through window
- Warm indoor lighting

**House (Upgrade 1)**
- Suburban living room with bay window
- Soft carpet flooring in neutral tones
- Garden view through large windows
- Fireplace as focal point
- Natural daylight with cozy warmth

**Mansion (Upgrade 2)**
- Grand parlor with marble columns
- Luxurious lavender/purple color scheme
- Crystal chandelier overhead
- Ornate gold accents throughout
- Elegant formal atmosphere

**Farm (Final)**
- Outdoor pastoral setting
- Rolling green hills with blue sky
- Red barn in background
- Wooden fences
- Natural countryside lighting

---

## 2. SKY/TIME-OF-DAY COLOR SYSTEMS

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

Mansion (ambient, indoor):
  Morning: { wall: 'hsl(270, 30%, 92%)', accent: 'hsl(45, 70%, 75%)' }
  Afternoon: { wall: 'hsl(270, 25%, 95%)', accent: 'hsl(45, 65%, 80%)' }
  Evening: { wall: 'hsl(270, 35%, 85%)', accent: 'hsl(35, 80%, 65%)' }
  Night: { wall: 'hsl(270, 40%, 25%)', accent: 'hsl(45, 60%, 50%)' }

Farm (outdoor):
  Morning: { top: '#FFE4B5', mid: '#FFA07A', bottom: '#87CEEB' }
  Afternoon: { top: '#87CEEB', mid: '#B0E0E6', bottom: '#98FB98' }
  Evening: { top: '#FF6347', mid: '#FF8C00', bottom: '#4B0082' }
  Night: { top: '#0d1b2a', mid: '#1b263b', bottom: '#415a77' }
```

---

## 3. FURNITURE/PROPS BY TIER

### Apartment Props
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

### House Props
| ID | Name | Emoji | Position | Interactable | Cat Behavior |
|----|------|-------|----------|--------------|--------------|
| bay-window | Bay Window | 🪟 | 50, 12 | No | - |
| couch | Couch | 🛋️ | 30, 60 | Yes | Sleep |
| fireplace | Fireplace | 🧱 | 80, 40 | No | Attract |
| rug | Cozy Rug | 🟫 | 50, 72 | No | - |
| garden-door | Garden Door | 🚪 | 90, 55 | Yes | Perch |
| cat-tower | Cat Tower | 🗼 | 10, 58 | Yes | Play |
| ottoman | Ottoman | 🟫 | 40, 65 | No | Attract |

### Mansion Props
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

### Farm Props
| ID | Name | Emoji | Position | Interactable | Cat Behavior |
|----|------|-------|----------|--------------|--------------|
| barn | Red Barn | 🏠 | 85, 25 | Yes | Hide |
| hay-bale-1 | Hay Bale | 🟨 | 20, 65 | Yes | Play |
| hay-bale-2 | Hay Bale | 🟨 | 30, 70 | Yes | Attract |
| hay-bale-3 | Hay Bale | 🟨 | 25, 75 | Yes | Attract |
| fence | Wooden Fence | 🪵 | 50, 50 | Yes | Perch |
| water-trough | Water Trough | 🪣 | 70, 75 | No | Attract |
| windmill | Windmill | 🌀 | 12, 20 | No | - |
| tractor | Tractor | 🚜 | 60, 40 | No | - |
| tree-1 | Apple Tree | 🌳 | 5, 50 | No | - |
| tree-2 | Oak Tree | 🌲 | 95, 55 | No | - |
| sunspot | Sunny Spot | ☀️ | 45, 68 | No | Attract |

---

## 4. CAT APPEARANCE SYSTEM

### Fur Colors (8 options)
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

### Patterns (6 options)
- `solid` - Single-color coat, no markings
- `tabby` - M-shape on forehead, tiger stripes on body
- `spotted` - Leopard-like dark spots scattered across coat
- `tuxedo` - White chest/chin/paws on dark body
- `bicolor` - Two-tone with clean separation
- `calico` - Random patches of orange, black, white

### Eye Colors (6 options)
```
green:        #22C55E - emerald sparkle
blue:         #3B82F6 - sapphire deep
amber:        #F59E0B - golden honey
gold:         #EAB308 - brilliant treasure
heterochromia: One blue (#3B82F6), one green (#22C55E)
copper:       #B45309 - warm bronze
```

### Hair Lengths
- `short` - Sleek, smooth, flat against body
- `medium` - Fluffy with soft volume
- `fluffy` - Long-haired, incredibly soft, very huggable

### Facial Features
- `normal` - Standard cute cat face
- `scar` - Small cheek scar (battle-worn look)
- `eyepatch` - Dark patch over one eye (pirate charm)
- `whiskers_long` - Extra long dramatic whiskers
- `grumpy` - Furrowed brow (famous grumpy cat look)
- `cute_blush` - Extra rosy pink blush marks on cheeks

---

## 5. BREED CHARACTERISTICS (8 breeds)

| Breed | Face | Body | Default Appearance |
|-------|------|------|-------------------|
| **Stray** | Alert, street-smart expression | Lean athletic build | Gray tabby, amber eyes |
| **Tabby** | M-marking on forehead | Medium well-proportioned | Orange tabby, green eyes |
| **Persian** | Flat-faced, round, smushed nose | Stocky cobby, short legs | White solid, blue eyes, fluffy |
| **Siamese** | Wedge-shaped, large pointed ears | Slender, long graceful limbs | Cream bicolor, blue eyes |
| **Maine Coon** | Square muzzle, tufted ears | Very large, gentle giant | Brown tabby, gold eyes, fluffy |
| **British Shorthair** | Round chubby cheeks | Stocky compact, chunky paws | Gray solid, copper eyes, short |
| **Ragdoll** | Sweet face, vivid blue eyes | Large floppy relaxed body | Cream bicolor, blue eyes, fluffy |
| **Bengal** | Wild exotic look, strong chin | Muscular athletic build | Ginger spotted, green eyes, short |

---

## 6. COSTUMES (20 total)

### Render Instructions by Costume

| ID | Name | Category | Rarity | Placement | Style Description |
|----|------|----------|--------|-----------|-------------------|
| party_hat | Party Hat | Hat | Common | Jaunty angle on head | Rainbow stripes, pom-pom on top, elastic chin strap |
| top_hat | Fancy Top Hat | Hat | Uncommon | Balanced on head | Glossy black silk, satin ribbon band |
| crown | Royal Crown | Hat | Rare | Majestically on head | Gold metal, ruby/sapphire gems, red velvet interior |
| wizard_hat | Wizard Hat | Hat | Rare | Slight jaunty angle | Purple velvet, gold stars/moons embroidered, sparkles |
| santa_hat | Santa Hat | Hat | Seasonal | Drooping to one side | Red velvet, white fur trim, pom-pom tip |
| bunny_ears | Bunny Ears | Hat | Seasonal | Perched on head | Pink inner ears, white fluffy outer |
| witch_hat | Witch Hat | Hat | Seasonal | Pointed, slight tilt | Black with purple band, buckle accent |
| halo | Angel Halo | Hat | Legendary | Floating above head | Golden ring, ethereal glow effect |
| sweater | Cozy Sweater | Outfit | Common | Snug around body/neck | Cable-knit pattern, autumn colors (orange/brown) |
| tuxedo | Elegant Tuxedo | Outfit | Uncommon | Fitted with lapels | Black/white formal, satin bow tie |
| superhero | Superhero Cape | Outfit | Uncommon | Fastened at neck, flowing | Red satin, golden emblem clasp |
| pirate | Pirate Costume | Outfit | Uncommon | Tricorn hat + vest | Black tricorn hat, skull/crossbones, striped vest |
| bow_tie | Bow Tie | Accessory | Common | At collar | Polka-dot or striped, bright colors |
| sunglasses | Cool Sunglasses | Accessory | Common | On nose bridge | Aviator or cat-eye style, reflective lenses |
| necklace | Pearl Necklace | Accessory | Uncommon | Draped around neck | Classic white pearls, subtle elegant sheen |
| scarf | Silk Scarf | Accessory | Common | Wrapped around neck | Luxurious silk, artistic pattern |
| angel_wings | Angel Wings | Special | Legendary | Behind shoulders | White feathers, golden glow, ethereal sparkles |
| dragon | Dragon Costume | Special | Legendary | Full body onesie | Green dragon scales, small wings, horns, tail |
| astronaut | Space Suit | Special | Rare | Astronaut helmet | White suit, NASA-style patches, reflective visor |
| unicorn | Unicorn Horn | Special | Legendary | Forehead between ears | Iridescent rainbow spiral, magical sparkles |

### VIP Exclusive Costumes

| ID | Name | Category | Unlock Requirement |
|----|------|----------|-------------------|
| vip_bronze_collar | VIP Bronze Collar | Accessory | 30-day login streak |
| vip_silver_cape | VIP Silver Cape | Outfit | 60-day login streak |
| vip_gold_crown | VIP Gold Crown | Hat | 90-day login streak |

---

## 7. SEASONAL DECORATIONS

### Season Particle Config
| Season | Emojis | Count | Animation | Color Wash |
|--------|--------|-------|-----------|------------|
| Spring | 🌸🌺💮 | 8 | Fall + Sway | `rgba(255, 200, 220, 0.05)` pink |
| Summer | ☀️🦋✨ | 6 | Float | `rgba(255, 240, 200, 0.05)` yellow |
| Autumn | 🍂🍁🍃 | 10 | Fall + Spin | `rgba(255, 180, 120, 0.08)` orange |
| Winter | ❄️❅❆ | 12 | Fall + Sway | `rgba(200, 220, 255, 0.08)` blue |

### Per-Tier Seasonal Decorations

**Apartment:**
```
Spring: 🌸 at (10, 30), 🌷 at (88, 35)
Summer: 🌻 at (10, 30), ☀️ at (60, 8)
Autumn: 🍂 at (10, 30), 🎃 at (88, 72)
Winter: ❄️ at (45, 10), 🎄 at (90, 55)
```

**House:**
```
Spring: 🌸 at (8, 28), 🌷 at (85, 32), 🐣 at (42, 78)
Summer: 🌻 at (8, 28), ☀️ at (55, 8), 🦋 at (30, 40)
Autumn: 🍂 at (8, 28), 🎃 at (85, 70), 🍁 at (60, 35)
Winter: ❄️ at (40, 8), 🎄 at (88, 52), ⛄ at (20, 72)
```

**Mansion:**
```
Spring: 🌸 at (5, 25), 🌷 at (92, 30), 💐 at (45, 15)
Summer: 🌻 at (5, 25), ✨ at (50, 10), 🎆 at (80, 20)
Autumn: 🍂 at (5, 25), 🎃 at (88, 68), 🕯️ at (35, 45)
Winter: ❄️ at (35, 8), 🎄 at (90, 50), 🎁 at (15, 75)
```

**Farm:**
```
Spring: 🌸 at (5, 45), 🐣 at (55, 78), 🌷 at (40, 80)
Summer: 🌻 at (78, 60), 🦋 at (35, 35), 🐝 at (55, 45)
Autumn: 🎃 at (40, 72), 🍂 at (15, 55), 🌾 at (75, 68)
Winter: ⛄ at (35, 65), ❄️ at (25, 25), ❄️ at (60, 18)
```

---

## 8. PARALLAX DEPTH SYSTEM

### Layer Depths (multipliers for mouse movement)
```
background:    0.1  - Minimal movement (furthest from viewer)
midBackground: 0.25 - Wall decorations layer
midground:     0.5  - Props/furniture layer
midForeground: 0.75 - Floor items layer
foreground:    1.0  - Cats layer (closest, strongest parallax)
```

### Micro-Depth per Object Type
```
props:  baseDepth=0.5, microRange=0.12
cats:   baseDepth=1.0, microRange=0.18
floor:  baseDepth=0.75, microRange=0.10
wall:   baseDepth=0.25, microRange=0.05
```

### Depth Formula
```typescript
effectiveDepth = baseDepth + (yNormalized * microRange)
// Objects lower on screen (higher y%) move more with parallax
```

---

## 9. CAT PORTRAIT AI STYLE

The existing portrait generator uses this consistent style:

```
Style: Cute kawaii cartoon cat portrait in the style of Studio Ghibli meets modern mobile game art.

Visual Requirements:
- Soft rounded features with large expressive eyes
- Sparkle reflections in eyes (2-3 small white highlights)
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

## 10. AI EMPIRE SCENE RENDERING

### Render Cost
- **20,000 in-game credits (coins)** per render

### Prompt Structure for Full Scene

```
Create a beautiful [TIME_OF_DAY] scene in [SEASON] at a [HOUSE_TYPE] cat empire.

SCENE DESCRIPTION:
[Tier-specific background description]

LIGHTING:
[Time of day lighting description]

FURNITURE/PROPS:
[List of props with positions]

CATS IN SCENE:
[For each cat: breed, fur color, pattern, eyes, costume if any]

STYLE:
Cute kawaii cartoon scene in the style of Studio Ghibli meets modern mobile game art.
Warm cozy lighting, soft cel-shaded look with gradients.
Professional quality, ultra-cute aesthetic.
Panoramic wide 16:9 aspect ratio.
4K resolution, masterpiece quality.
```

### Example Prompt

```
Create a beautiful MORNING scene in SPRING at a FARM cat empire.

SCENE DESCRIPTION:
Outdoor pastoral setting with rolling green hills, bright blue sky.
Red barn visible in background right side. Wooden fences in midground.
Hay bales scattered in foreground. Windmill on left horizon.
Apple trees providing shade. Sunny spots on grass.

LIGHTING:
Warm golden morning light from upper left.
Soft yellow-orange ambient glow. Long shadows.
Dewy fresh atmosphere.

FURNITURE/PROPS:
- Red barn at position (85%, 25%)
- Hay bales at (20-30%, 65-75%)
- Wooden fence at (50%, 50%)
- Windmill at (12%, 20%)
- Apple tree at (5%, 50%)

CATS IN SCENE:
1. "Whiskers" - Orange tabby Persian, fluffy, blue eyes, wearing party hat
   Position: (30%, 68%), sitting on hay bale, looking content
2. "Shadow" - Black solid British Shorthair, short hair, copper eyes
   Position: (55%, 72%), walking across grass, curious expression
3. "Princess" - White calico Ragdoll, fluffy, heterochromia eyes, wearing crown
   Position: (75%, 65%), perching on fence, regal pose

SEASONAL ELEMENTS:
Cherry blossoms falling, baby chicks near barn, tulips blooming

STYLE:
Cute kawaii cartoon scene in the style of Studio Ghibli meets modern mobile game art.
Warm cozy lighting, soft cel-shaded look with gradients.
Professional quality, ultra-cute aesthetic.
Panoramic wide 16:9 aspect ratio.
4K resolution, masterpiece quality.
```

---

## 11. STORAGE & PERSISTENCE

### Storage Bucket
- **Bucket Name**: `empire-renders`
- **Public**: Yes
- **File Format**: PNG or WebP
- **Dimensions**: 1920x1080 (16:9 aspect ratio)

### Persistence
- Rendered URL stored in `game_saves.game_state.empireRenderUrl`
- Persists across sessions
- New renders replace previous render

### Display Logic
```typescript
if (state.empireRenderUrl) {
  // Show AI-rendered background as base layer
  // Overlay only NEW cats (without AI portraits) as emoji sprites
  // Cats with portraitUrl are "baked into" the rendered scene
} else {
  // Show current SVG background + all emoji/vector cats
}
```

---

## 12. INCENTIVE STRUCTURE

The rendering system encourages engagement:

1. **Initial Render** (20,000 credits): Renders current scene with all cats
2. **New Cats**: After rendering, new cats appear as overlays until next render
3. **Cat Portraits**: Cats with individual AI portraits look best in renders
4. **Re-Render**: Players can pay again to include new cats in the scene

This creates a cycle:
- Get cats → Generate portraits → Render empire → Get more cats → Re-render

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-28 | 1.0 | Initial knowledge file created |
