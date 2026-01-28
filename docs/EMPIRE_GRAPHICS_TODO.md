# Empire Page Graphics Improvement Plan

> **Status**: Planning Phase  
> **Priority**: High  
> **Last Updated**: 2026-01-28

## Overview

This document outlines the planned graphics improvements for the Empire page (`/empire`), transforming it from simple CSS gradients to a rich, interactive visual experience.

---

## Current Implementation

**Location**: `src/pages/Empire.tsx`, `src/components/empire/EmpireScene.tsx`, `src/config/empire.ts`

### Current State
- Simple gradient backgrounds via Tailwind classes (`bg-gradient-to-b from-amber-100...`)
- CSS patterns for floor textures (repeating linear gradients)
- Emoji decorations for walls (`✨` for mansion, `🌾` for farm)
- No illustrated scene elements (furniture, decorations, outdoor features)
- Basic roaming cat system with `useRoamingCats` hook

### Current Zone Themes (`src/config/empire.ts`)
```typescript
const EMPIRE_ZONES: EmpireZones = {
  apartment: { backgroundClass, floorClass, floorPattern, ambiance: 'cozy' },
  house: { backgroundClass, floorClass, floorPattern, ambiance: 'spacious' },
  mansion: { backgroundClass, floorClass, wallDecoration: '✨', ambiance: 'luxurious' },
  farm: { backgroundClass, floorClass, wallDecoration: '🌾', ambiance: 'pastoral' },
};
```

---

## Planned Improvements

### 1. Illustrated Scene Backgrounds (SVG or AI-Generated)

**Priority**: 🔴 High | **Effort**: Medium | **Impact**: High

Replace gradient backgrounds with rich, illustrated scenes for each house type:

| House Type | Scene Description | Key Elements |
|:-----------|:------------------|:-------------|
| Apartment | Cozy urban studio with window view | Window with city skyline, cat tree, radiator, potted plant, bookshelf |
| House | Suburban living room with backyard view | Large window showing garden, couch, fireplace, family photos |
| Mansion | Luxury parlor with ornate details | Chandelier, marble floors, columns, artwork, velvet furniture |
| Farm | Outdoor pastoral scene | Rolling hills, barn in distance, fence, hay bales, blue sky with clouds |

**Implementation Options**:
1. **CSS/SVG layers**: Multiple positioned SVG elements for flexibility
2. **AI-generated backgrounds**: Use the existing `generate-auth-background` edge function pattern
3. **Static illustration assets**: Commission or source cozy cat-themed illustrations

**Files to Create/Modify**:
- `src/components/empire/backgrounds/ApartmentBackground.tsx`
- `src/components/empire/backgrounds/HouseBackground.tsx`
- `src/components/empire/backgrounds/MansionBackground.tsx`
- `src/components/empire/backgrounds/FarmBackground.tsx`
- `src/config/empire.ts` (enhanced theme config)

---

### 2. Interactive Scene Furniture/Props

**Priority**: 🔴 High | **Effort**: Medium | **Impact**: High

Add clickable furniture and objects that cats can interact with:

```typescript
// New type definition for src/types/empire.ts
interface EmpireProp {
  id: string;
  name: string;
  emoji: string;
  position: { x: number; y: number }; // Percentage
  scale: number;
  zIndex: number;
  interactable?: boolean;
  onInteract?: 'sleep' | 'play' | 'hide';
}
```

**Props by House Type**:

| House Type | Props |
|:-----------|:------|
| Apartment | Cat tree, cat bed, window, potted plant, bookshelf, food bowl |
| House | Couch, fireplace, bay window, garden door, rug, side table |
| Mansion | Chandelier, grand piano, velvet chaise, fountain, columns, artwork |
| Farm | Barn door, hay bales, fence, water trough, tractor, windmill |

**Example Configuration**:
```typescript
const APARTMENT_PROPS: EmpireProp[] = [
  { id: 'cat-tree', name: 'Cat Tree', emoji: '🌲', position: { x: 15, y: 60 }, scale: 1.5, interactable: true, onInteract: 'play' },
  { id: 'bed', name: 'Cat Bed', emoji: '🛏️', position: { x: 80, y: 75 }, scale: 1.2, interactable: true, onInteract: 'sleep' },
  { id: 'window', name: 'Window', emoji: '🪟', position: { x: 50, y: 20 }, scale: 2, interactable: false },
];
```

**Files to Create**:
- `src/config/empireProps.ts` (prop definitions per house type)
- `src/components/empire/EmpireProp.tsx` (prop renderer component)
- `src/hooks/empire/useCatPropInteraction.ts` (cat-prop interaction logic)

---

### 3. Time-of-Day and Weather Effects

**Priority**: 🟡 Medium | **Effort**: Low | **Impact**: Medium

Make the Empire scene react to the in-game day:

| Condition | Visual Effect |
|:----------|:--------------|
| Morning (days ending in 1-3) | Warm golden light, sun rays through window |
| Afternoon (days ending in 4-6) | Bright daylight, high contrast |
| Evening (days ending in 7-8) | Orange/pink sunset tones, long shadows |
| Night (days ending in 9-0) | Dark blue overlay, moonlight, stars visible through windows |

**Optional Weather Effects**:
- Rainy day: Rain on windows (indoor scenes), puddles (farm)
- Sunny: Light beams, dust motes
- Cloudy: Muted colors, soft lighting

**Implementation**:
```typescript
// src/lib/empireTimeOfDay.ts
export function getTimeOfDay(gameDay: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  const dayMod = gameDay % 10;
  if (dayMod <= 3) return 'morning';
  if (dayMod <= 6) return 'afternoon';
  if (dayMod <= 8) return 'evening';
  return 'night';
}
```

**Files to Create**:
- `src/lib/empireTimeOfDay.ts`
- `src/components/empire/TimeOfDayOverlay.tsx`
- `src/components/empire/WeatherEffects.tsx`

---

### 4. Parallax Depth Layers

**Priority**: 🟢 Low | **Effort**: Medium | **Impact**: Low

Create depth with multiple scrolling/moving layers:

```
┌────────────────────────────────────────────┐
│ Layer 0 (Sky/Background)     - Fixed      │
│ Layer 1 (Distant elements)   - Slow move  │
│ Layer 2 (Mid-ground props)   - Med move   │
│ Layer 3 (Foreground/Cats)    - Fast move  │
│ Layer 4 (UI Overlays)        - Fixed      │
└────────────────────────────────────────────┘
```

**Implementation**: React to mouse movement or subtle auto-animation.

**Files to Create**:
- `src/components/empire/ParallaxLayer.tsx`
- `src/hooks/empire/useParallax.ts`

---

### 5. Enhanced Zone Themes

**Priority**: 🔴 High | **Effort**: Medium | **Impact**: High

Expanded configuration for each house type:

```typescript
// Enhanced type for src/types/empire.ts
interface EnhancedZoneTheme {
  name: string;
  
  // Visual layers
  skyGradient: string;
  wallGradient: string;
  floorGradient: string;
  floorPattern?: string;
  
  // Decorative elements
  wallDecorations: string[]; // Emojis positioned randomly
  floorDecorations: string[];
  windowScene?: 'city' | 'garden' | 'mountains' | 'fields';
  
  // Atmospheric effects
  particles?: 'dust-motes' | 'fireflies' | 'sparkles' | 'leaves';
  lighting: 'warm' | 'cool' | 'neutral' | 'golden';
  shadowIntensity: number; // 0-1
  
  // Audio ambiance (optional)
  ambianceSound?: 'city-traffic' | 'birds' | 'crackling-fire' | 'nature';
  
  // Props specific to this zone
  props: EmpireProp[];
}
```

---

### 6. Seasonal Variations

**Priority**: 🟡 Medium | **Effort**: Medium | **Impact**: Medium

Adapt backgrounds based on real-world season (using `src/lib/seasonUtils.ts`):

| Season | Apartment | House | Mansion | Farm |
|:-------|:----------|:------|:--------|:-----|
| Spring | Flowers on windowsill | Blooming garden view | Fresh flowers in vases | Cherry blossoms, green fields |
| Summer | Open window, fan | Sunny backyard, BBQ | Pool visible | Golden wheat, bright sun |
| Autumn | Cozy blankets, warm colors | Fall leaves in yard | Fireplace lit | Harvest scene, orange trees |
| Winter | Frost on windows, heater | Snow in yard, lights | Grand fireplace, decorations | Snow-covered barn, frozen pond |

**Integration Point**: Already have `getCurrentRealSeason()` in `src/lib/seasonUtils.ts`.

---

### 7. Cat Behavior Enhancements

**Priority**: 🟡 Medium | **Effort**: Medium | **Impact**: High

Make cats interact more realistically with the environment:

| Behavior | Description | Implementation |
|:---------|:------------|:---------------|
| Sleep on furniture | Cats gravitate to beds/cushions | Modify `useRoamingCats` to include furniture waypoints |
| Look out windows | Cats perch near windows | Add window positions as attraction points |
| Play with toys | Cats bat at dangling toys | Animate toy props when cat is nearby |
| Sunbeam seeking | Cats find and nap in sunbeam patches | Time-of-day dependent attraction zones |

**Files to Modify**:
- `src/hooks/empire/useRoamingCats.ts` (add furniture attraction logic)
- `src/config/empire.ts` (add attraction zones per house type)

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Expand `EnhancedZoneTheme` type in `src/types/empire.ts`
- [ ] Create prop system types and configuration
- [ ] Implement basic SVG background layers for each house type
- [ ] Add props rendering to `EmpireScene.tsx`

### Phase 2: Interactivity (Week 3-4)
- [ ] Implement cat-prop interactions
- [ ] Add time-of-day lighting overlay
- [ ] Integrate seasonal variations
- [ ] Update roaming behavior to use furniture waypoints

### Phase 3: Polish (Week 5-6)
- [ ] Add particle effects (dust motes, sparkles, leaves)
- [ ] Implement parallax depth (optional)
- [ ] Add weather effects (optional)
- [ ] Performance optimization and testing

---

## Technical Considerations

### Performance
- Use CSS transforms for parallax (GPU accelerated)
- Lazy-load background assets per house type
- Limit particle count on mobile devices
- Consider `useGraphicsSettings` hook for quality presets

### Accessibility
- Ensure cat interactions remain keyboard accessible
- Provide reduced motion options for animations
- Maintain color contrast in all lighting conditions

### Mobile
- Simplify parallax on touch devices
- Scale prop sizes for smaller screens
- Consider disabling weather effects on low-end devices

---

## Related Files

| File | Purpose |
|:-----|:--------|
| `src/pages/Empire.tsx` | Main Empire page |
| `src/components/empire/EmpireScene.tsx` | Scene container |
| `src/components/empire/RoamingCat.tsx` | Individual cat renderer |
| `src/hooks/empire/useRoamingCats.ts` | Cat movement logic |
| `src/config/empire.ts` | Zone theme configuration |
| `src/types/empire.ts` | Empire type definitions |
| `src/lib/seasonUtils.ts` | Season detection utilities |

---

## References

- [Session Replay Analysis](#) - Initial improvement suggestions
- [Cat Visual System](./CAT_VISUAL_SYSTEM.md) - Cat rendering documentation
- [Graphics Settings](./GRAPHICS_SETTINGS.md) - Performance tier system
