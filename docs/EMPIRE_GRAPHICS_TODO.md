# Empire Page Graphics Implementation

> **Status**: ✅ Complete  
> **Priority**: High  
> **Last Updated**: 2026-01-28

## Overview

This document describes the graphics system implemented for the Empire page (`/empire`), which features rich, interactive visual environments with parallax depth, dynamic lighting, seasonal effects, and interactive props.

---

## Implementation Summary

### ✅ Phase 1: Illustrated SVG Backgrounds

**Files Created**:
- `src/components/empire/backgrounds/ApartmentBackground.tsx`
- `src/components/empire/backgrounds/HouseBackground.tsx`
- `src/components/empire/backgrounds/MansionBackground.tsx`
- `src/components/empire/backgrounds/FarmBackground.tsx`
- `src/components/empire/backgrounds/index.ts`
- `src/components/empire/EmpireBackground.tsx`

**Features**:
| House Type | Scene Description | Key Elements |
|:-----------|:------------------|:-------------|
| Apartment | Cozy urban studio with window view | Window with city skyline, cat tree, radiator, potted plant, bookshelf |
| House | Suburban living room with backyard view | Large window showing garden, couch, fireplace, family photos |
| Mansion | Luxury parlor with ornate details | Chandelier, marble floors, columns, artwork, velvet furniture |
| Farm | Outdoor pastoral scene | Rolling hills, barn in distance, fence, hay bales, blue sky with clouds |

---

### ✅ Phase 2: Time-of-Day & Seasonal Effects

**Files**:
- `src/lib/empireTimeOfDay.ts` - Time calculation and overlay configs
- `src/components/empire/TimeOfDayOverlay.tsx` - Light beams, sun rays, stars
- `src/components/empire/SeasonalDecorations.tsx` - Seasonal particle engine

**Time-of-Day System**:
| Condition | Visual Effect |
|:----------|:--------------|
| Morning (days 1-3 mod 10) | Warm golden light, animated sun rays |
| Afternoon (days 4-6 mod 10) | Bright daylight, high contrast |
| Evening (days 7-8 mod 10) | Orange/pink sunset tones, sepia filter |
| Night (days 9-0 mod 10) | Dark blue overlay, animated stars |

**Seasonal Particles** (via `SEASON_PARTICLE_CONFIG`):
| Season | Effect |
|:-------|:-------|
| Spring | Falling cherry blossom petals 🌸 |
| Summer | Floating butterflies 🦋 |
| Autumn | Drifting leaves 🍂 |
| Winter | Gentle snowfall ❄️ |

---

### ✅ Phase 3: Interactive Props System

**Files**:
- `src/config/empireProps.ts` - Prop definitions per house type
- `src/components/empire/EmpirePropComponent.tsx` - Prop renderer with interactions
- `src/types/empire.ts` - `EmpireProp` type definitions

**Prop Types by House**:
| House Type | Props |
|:-----------|:------|
| Apartment | Cat tree, cat bed, window perch, potted plant, food bowl, scratching post |
| House | Couch, fireplace, bay window, garden door, rug, side table |
| Mansion | Chandelier, grand piano, velvet chaise, fountain, columns, artwork |
| Farm | Barn door, hay bales, fence, water trough, tractor, windmill |

**Prop Features**:
- Tooltips with interaction descriptions
- Cat count badges when occupied
- Glow effects when cats are nearby
- Prop-specific animations (sway, pulse, bounce)
- Attraction zones for cat AI behavior

---

### ✅ Phase 4: Parallax Depth System

**Files**:
- `src/hooks/empire/useParallax.ts` - Mouse-responsive parallax hook
- `src/components/empire/ParallaxLayer.tsx` - Depth layer component

**Layer Architecture**:
```
┌────────────────────────────────────────────┐
│ Layer 0 (Background)     - 10% movement    │
│ Layer 1 (Mid-background) - 25% movement    │
│ Layer 2 (Mid-ground)     - 50% movement    │
│ Layer 3 (Mid-foreground) - 75% movement    │
│ Layer 4 (Foreground)     - 100% movement   │
│ Layer 5 (UI Overlays)    - Fixed           │
└────────────────────────────────────────────┘
```

**Depth Constants** (`PARALLAX_DEPTHS`):
```typescript
{
  background: 0.1,      // Furthest - minimal movement
  midBackground: 0.25,
  midground: 0.5,       // Medium movement
  midForeground: 0.75,
  foreground: 1.0,      // Closest - maximum movement
}
```

**Hook Features**:
- `requestAnimationFrame` for smooth 60fps animation
- Configurable intensity and smoothing
- Automatic reset on mouse leave
- Respects `enableEmpireParallax` graphics setting

---

### ✅ Phase 5: Cat Behavior Enhancements

**Files Modified**:
- `src/hooks/empire/useRoamingCats.ts` - Furniture attraction logic
- `src/config/empire.ts` - Attraction zones per house type

**Behaviors**:
| Behavior | Description |
|:---------|:------------|
| Sleep on furniture | Lazy cats gravitate to beds/cushions |
| Look out windows | Curious cats perch near windows |
| Play with toys | Playful cats interact with toy props |
| Sunbeam seeking | Cats find warm spots based on time-of-day |

---

### ✅ Phase 6: Graphics Settings Integration

All effects respect user preferences via `useGraphicsSettings`:
- `enableEmpireParallax` - Toggle parallax depth
- `enableTimeOfDayEffects` - Toggle lighting overlays
- `enableSeasonalDecorations` - Toggle seasonal particles
- `enableParticles` / `enableEmpireParticles` - Toggle atmospheric particles
- `enableReducedMotion` - Accessibility support

---

## File Structure

```
src/components/empire/
├── EmpireScene.tsx           # Main scene orchestrator (5-layer parallax)
├── EmpireBackground.tsx      # Background controller
├── ParallaxLayer.tsx         # Reusable parallax layer component
├── RoamingCat.tsx            # Individual cat renderer
├── EmpirePropComponent.tsx   # Interactive prop renderer
├── TimeOfDayOverlay.tsx      # Lighting effects (sun rays, stars)
├── SeasonalDecorations.tsx   # Seasonal particle engine
├── EmpireParticles.tsx       # Atmospheric particles
├── WindowScene.tsx           # Window view scenes (deprecated - integrated into SVG)
└── backgrounds/
    ├── ApartmentBackground.tsx
    ├── HouseBackground.tsx
    ├── MansionBackground.tsx
    ├── FarmBackground.tsx
    └── index.ts

src/hooks/empire/
├── useRoamingCats.ts         # Cat movement AI with prop attraction
└── useParallax.ts            # Mouse-responsive parallax system

src/config/
├── empire.ts                 # Zone themes and configurations
└── empireProps.ts            # Prop definitions per house type

src/lib/
├── empireTimeOfDay.ts        # Time calculation and lighting configs
└── seasonUtils.ts            # Season detection utilities

src/types/
└── empire.ts                 # Type definitions (EmpireProp, TimeOfDay, etc.)
```

---

## Performance Considerations

- **GPU Acceleration**: Uses CSS `transform: translate3d()` and `will-change: transform`
- **Lazy Rendering**: Props and decorations memoized with `useMemo`
- **Reduced Motion**: All animations respect user accessibility preferences
- **Mobile Optimization**: Parallax can be disabled via graphics settings
- **Frame Budget**: `requestAnimationFrame` with easing for smooth 60fps

---

## Related Documentation

- [Cat Visual System](./CAT_VISUAL_SYSTEM.md) - Cat rendering documentation
- [Graphics Settings](./GRAPHICS_SETTINGS.md) - Performance tier system
- [Components](./COMPONENTS.md) - Full component reference
