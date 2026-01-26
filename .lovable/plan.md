
# Empire Page Implementation Plan

## Overview

This plan implements the **Empire Page** — an interactive, animated visual dwelling where players watch their cats roam, play, and interact. The implementation follows the existing architecture patterns and reuses the robust visual framework (`CatVisual`, `CatAvatar`, `CatReaction`).

---

## Architecture Validation

The proposed plan aligns perfectly with the existing codebase:

| Aspect | Existing Pattern | Empire Page Approach |
|--------|------------------|---------------------|
| **State Access** | `useGameState()` hook in pages | Same - uses `useGameState()` |
| **Sound Effects** | `useSound()` context | Same - triggers `meow`, `purr`, etc. |
| **Cat Visuals** | `CatVisual` component | Same - wraps in `RoamingCat` |
| **Reactions** | `CatReactionContext` + `CatCardReaction` | Same - triggers on interactions |
| **Page Structure** | Lazy-loaded pages with Suspense | Same pattern |
| **Navigation** | `EXTERNAL_LINKS` in `GameSidebar.tsx` | Add `/empire` entry |
| **Animations** | CSS keyframes in Tailwind config | Add new roaming animations |

---

## Implementation Steps

### Phase 1: Configuration & Types (~50 lines)

**File: `src/config/empire.ts`**

```text
Define zone themes for each house tier:
- apartment: Warm beige walls, grey carpet floor
- house: Light blue walls, green rug floor  
- mansion: Purple walls, marble floor
- farm: Green walls, grass floor

Each zone includes:
- name: Display name
- backgroundClass: Tailwind gradient/color for walls
- floorClass: Tailwind class for floor area
- floorPattern: Optional pattern (wood grain, grass, marble)
```

**File: `src/types/empire.ts`**

```text
Interfaces for:
- ZoneTheme: Theme configuration per house tier
- CatPosition: { x, y, facing, state }
- CatState: 'idle' | 'walking' | 'interacting' | 'sleeping'
```

---

### Phase 2: Roaming Logic Hook (~100 lines)

**File: `src/hooks/empire/useRoamingCats.ts`**

This hook manages cat AI movement:

```text
Algorithm:
1. Initialize cats with random positions (x: 10-90%, y: 30-90%)
2. Every 3-8 seconds (random interval per cat):
   - Pick random destination within zone bounds
   - Calculate facing direction (left/right based on x delta)
   - Update cat state to 'walking'
   - After transition duration, set state back to 'idle'

Returns:
- positions: Map<catId, CatPosition>
- interactWithCat: (catId, action) => void
```

**Z-Index Logic:**
- Cats with higher Y values (lower on screen) have higher z-index
- Creates natural depth illusion

---

### Phase 3: Roaming Cat Component (~120 lines)

**File: `src/components/empire/RoamingCat.tsx`**

Wrapper component for each cat in the scene:

```text
Structure:
<Popover>
  <PopoverTrigger>
    <div 
      style={{ left: x%, top: y%, zIndex: y }}
      className="absolute transition-all duration-3000 ease-in-out"
    >
      <CatVisual 
        cat={cat}
        animated={true}
        size="lg"
        style={{ transform: facing === 'left' ? 'scaleX(-1)' : 'none' }}
      />
      {/* Reaction bubble renders here via CatCardReaction */}
    </div>
  </PopoverTrigger>
  <PopoverContent>
    <EmpireInteractionMenu cat={cat} onAction={handleAction} />
  </PopoverContent>
</Popover>
```

**Hover Effects:**
- Scale up slightly (`hover:scale-110`)
- Subtle shadow glow

---

### Phase 4: Interaction Menu (~60 lines)

**File: `src/components/empire/EmpireInteractionMenu.tsx`**

Quick action menu when clicking a cat:

```text
┌─────────────────────────┐
│ 🐱 Whiskers             │
│ ───────────────────────  │
│ 💕 Pet        → +5 😊   │
│ 🍖 Feed       → -1 🥫   │
│ 🎾 Play       → -1 🧸   │
│ 📸 Photo Booth →        │
│ 👤 View Details →       │
└─────────────────────────┘

Actions:
- Pet: playSound('purr'), addReaction(catId, 'positive'), +5 happiness
- Feed: playSound('catEating'), addReaction(catId, 'positive'), -1 food, +15 hunger
- Play: playSound('catPlaying'), addReaction(catId, 'positive'), -1 toy, +10 happiness
```

---

### Phase 5: Empire Scene (~150 lines)

**File: `src/components/empire/EmpireScene.tsx`**

Main scene container:

```text
Structure:
<div className="relative w-full h-[600px] overflow-hidden rounded-xl">
  {/* Background (walls) */}
  <div className={zone.backgroundClass} />
  
  {/* Floor (bottom 50%) */}
  <div className="absolute bottom-0 h-1/2 w-full" style={{ background: zone.floorPattern }} />
  
  {/* Ambient decorations based on tier */}
  {zone.decorations?.map(deco => <img ... />)}
  
  {/* Roaming cats */}
  {cats.map(cat => (
    <RoamingCat 
      key={cat.id}
      cat={cat}
      position={positions.get(cat.id)}
      costumes={catCostumes}
      onInteract={handleInteract}
    />
  ))}
  
  {/* Quick stats overlay */}
  <div className="absolute top-4 right-4">
    <Badge>{cats.length} cats</Badge>
    <Badge>{zone.name}</Badge>
  </div>
</div>
```

---

### Phase 6: Page Wrapper (~80 lines)

**File: `src/pages/Empire.tsx`**

Full page with header and controls:

```text
Layout:
┌─────────────────────────────────────────────────┐
│ 🏠 Your Empire          [🔊] [☀️] [⬅️ Back]    │
├─────────────────────────────────────────────────┤
│                                                 │
│              [EmpireScene Component]            │
│                                                 │
├─────────────────────────────────────────────────┤
│ 💰 $1,234 | 📅 Day 45 | 🏰 Mansion | 25/25 🐱  │
└─────────────────────────────────────────────────┘

Features:
- Cloud save integration (same as CatCollection)
- Theme toggle
- Sound toggle
- Back to main game link
```

---

### Phase 7: Animation CSS (~30 lines)

**File: `tailwind.config.ts` additions**

```text
New keyframes:
- 'cat-walk': Subtle bobbing motion during movement
- 'cat-sit-down': Transition from standing to sitting
- 'cat-stand-up': Transition from sitting to standing

New classes:
- animate-cat-walk
- animate-cat-sit
- animate-cat-stand
```

---

### Phase 8: Routing & Navigation (~15 lines)

**File: `src/App.tsx`**

```text
Add lazy import:
const Empire = lazy(() => import('./pages/Empire'));

Add route:
<Route path="/empire" element={<Empire />} />
```

**File: `src/components/game/GameSidebar.tsx`**

```text
Add to EXTERNAL_LINKS:
{ href: '/empire', icon: <Castle className="h-4 w-4" />, label: 'My Empire' }
```

---

## Integration Points

### Sound Effects (Already Available)
| Action | Sound Type | Exists? |
|--------|-----------|---------|
| Pet | `purr` | ✅ |
| Feed | `catEating` | ✅ |
| Play | `catPlaying` | ✅ |
| Click | `click` | ✅ |

### Reaction Emojis (Already Available)
| Reaction | Emojis | From |
|----------|--------|------|
| Positive | 💕 🥰 💖 ✨ 😻 | `CatReactionContext` |
| Negative | 😾 💢 😤 😿 ⚡ | `CatReactionContext` |

### Cat Visuals (Already Available)
| Feature | Component | Inherited? |
|---------|-----------|------------|
| Breed appearance | `CatVisual` | ✅ |
| Costumes | `CatVisual` | ✅ |
| Tier effects | `CatVisual` | ✅ |
| Breathing animation | `CatAvatar` | ✅ |
| Blinking | `CatAvatar` | ✅ |
| Ear twitches | `CatAvatar` | ✅ |

---

## File Summary

| File | Action | Lines |
|------|--------|-------|
| `src/config/empire.ts` | Create | ~50 |
| `src/types/empire.ts` | Create | ~30 |
| `src/hooks/empire/useRoamingCats.ts` | Create | ~100 |
| `src/components/empire/RoamingCat.tsx` | Create | ~120 |
| `src/components/empire/EmpireInteractionMenu.tsx` | Create | ~60 |
| `src/components/empire/EmpireScene.tsx` | Create | ~150 |
| `src/pages/Empire.tsx` | Create | ~80 |
| `tailwind.config.ts` | Modify | +30 |
| `src/App.tsx` | Modify | +5 |
| `src/components/game/GameSidebar.tsx` | Modify | +2 |
| **Total** | | **~627 lines** |

---

## Future Extensibility (As Outlined)

The configuration-driven approach enables easy future additions:

1. **Furniture**: Add `decorations: DecorationSlot[]` to `ZoneTheme`
2. **Visitors**: Add `visitors: Cat[]` to scene state  
3. **New Zones**: Add keys to `EMPIRE_ZONES` (e.g., `garden`, `basement`)
4. **Activities**: Extend `CatState` with new behaviors

---

## Technical Notes

- **Performance**: With 50+ cats, consider virtualization or limiting visible cats to viewport
- **Mobile**: Touch-friendly popover menus already work via Radix UI
- **Accessibility**: Add aria-labels to interactive cat elements
- **State Sync**: Actions modify game state directly via `actions` from `useGameState()`
