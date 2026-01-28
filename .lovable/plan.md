
# Empire Page Complete Graphics Overhaul - Implementation Plan

## Overview

This plan transforms the Empire page from simple CSS gradients into a fully immersive, interactive visual experience with illustrated backgrounds, interactive props, time-of-day lighting, parallax depth, seasonal variations, and enhanced cat behaviors - all while staying within the current React/TypeScript/Tailwind tech stack.

---

## Architecture Summary

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        EmpireScene.tsx                              │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 0: Sky/Background (Fixed)                                     │
│   └─ EmpireBackground.tsx (house-specific SVG or cached AI image)  │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 1: Wall/Distant Elements (Slow parallax)                      │
│   └─ WindowScene.tsx (city/garden/mountains/fields view)           │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 2: Mid-ground Props (Medium parallax)                         │
│   └─ EmpireProp.tsx[] (furniture, decorations)                     │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 3: Floor + Cats (Fast parallax)                               │
│   └─ RoamingCat.tsx[] (with prop-seeking behavior)                 │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 4: Atmospheric Overlays (Fixed)                               │
│   ├─ TimeOfDayOverlay.tsx (lighting gradients)                     │
│   ├─ SeasonalDecorations.tsx (leaves, snow, petals)                │
│   └─ ParticleEffects.tsx (dust motes, fireflies)                   │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 5: UI Overlays (Fixed)                                        │
│   └─ Stats badges, resource indicators                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Type Definitions & Configuration (Foundation)

### 1.1 Expand Type Definitions

**File:** `src/types/empire.ts`

Add new interfaces for the enhanced system:

```typescript
// Interactive prop definition
export interface EmpireProp {
  id: string;
  name: string;
  emoji: string;
  position: { x: number; y: number };
  scale: number;
  zIndex: number;
  interactable?: boolean;
  onInteract?: 'sleep' | 'play' | 'hide' | 'perch';
  attractsCats?: boolean;
  attractionRadius?: number;
}

// Time of day derived from game day
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

// Weather effect types
export type WeatherEffect = 'clear' | 'rain' | 'cloudy' | 'sunny';

// Particle effect types
export type ParticleType = 'dust-motes' | 'fireflies' | 'sparkles' | 'leaves' | 'snow' | 'petals';

// Enhanced zone theme with all visual layers
export interface EnhancedZoneTheme {
  name: string;
  
  // Visual gradients
  skyGradient: string;
  wallGradient: string;
  floorGradient: string;
  floorPattern?: string;
  
  // Scene elements
  windowScene?: 'city' | 'garden' | 'mountains' | 'fields';
  wallDecorations: Array<{ emoji: string; position: { x: number; y: number } }>;
  floorDecorations: Array<{ emoji: string; position: { x: number; y: number } }>;
  
  // Props for this zone
  props: EmpireProp[];
  
  // Atmospheric effects
  particles?: ParticleType;
  lighting: 'warm' | 'cool' | 'neutral' | 'golden';
  shadowIntensity: number;
  
  // Seasonal overrides
  seasonalDecorations?: Record<RealSeason, Array<{ emoji: string; position: { x: number; y: number } }>>;
  
  // Optional AI background key (for cached generated backgrounds)
  aiBackgroundKey?: string;
}

// Cat attraction zone for furniture seeking
export interface AttractionZone {
  propId: string;
  center: { x: number; y: number };
  radius: number;
  behavior: 'sleep' | 'play' | 'perch' | 'sunbathe';
}
```

### 1.2 Create Props Configuration

**File:** `src/config/empireProps.ts` (New)

Define all furniture/props for each house type:

```typescript
import { EmpireProp } from '@/types/empire';

export const APARTMENT_PROPS: EmpireProp[] = [
  { id: 'window', name: 'City Window', emoji: '🪟', position: { x: 50, y: 15 }, scale: 2.5, zIndex: 5 },
  { id: 'cat-tree', name: 'Cat Tree', emoji: '🌲', position: { x: 12, y: 55 }, scale: 1.8, zIndex: 20, interactable: true, onInteract: 'play', attractsCats: true },
  { id: 'cat-bed', name: 'Cat Bed', emoji: '🛏️', position: { x: 85, y: 70 }, scale: 1.4, zIndex: 25, interactable: true, onInteract: 'sleep', attractsCats: true },
  { id: 'plant', name: 'Potted Plant', emoji: '🪴', position: { x: 8, y: 35 }, scale: 1.2, zIndex: 15 },
  { id: 'bookshelf', name: 'Bookshelf', emoji: '📚', position: { x: 92, y: 30 }, scale: 1.5, zIndex: 10 },
  { id: 'food-bowl', name: 'Food Bowl', emoji: '🥣', position: { x: 75, y: 80 }, scale: 1.0, zIndex: 30, interactable: true, onInteract: 'play' },
  { id: 'radiator', name: 'Radiator', emoji: '🔥', position: { x: 25, y: 75 }, scale: 1.0, zIndex: 20, attractsCats: true },
];

export const HOUSE_PROPS: EmpireProp[] = [
  { id: 'bay-window', name: 'Bay Window', emoji: '🪟', position: { x: 50, y: 12 }, scale: 3.0, zIndex: 5 },
  { id: 'couch', name: 'Couch', emoji: '🛋️', position: { x: 30, y: 60 }, scale: 2.0, zIndex: 25, interactable: true, onInteract: 'sleep', attractsCats: true },
  { id: 'fireplace', name: 'Fireplace', emoji: '🧱', position: { x: 80, y: 40 }, scale: 2.2, zIndex: 15, attractsCats: true },
  { id: 'rug', name: 'Cozy Rug', emoji: '🟫', position: { x: 50, y: 72 }, scale: 2.5, zIndex: 10 },
  { id: 'photos', name: 'Family Photos', emoji: '🖼️', position: { x: 15, y: 25 }, scale: 1.5, zIndex: 8 },
  { id: 'garden-door', name: 'Garden Door', emoji: '🚪', position: { x: 90, y: 55 }, scale: 1.8, zIndex: 12, interactable: true, onInteract: 'perch' },
];

export const MANSION_PROPS: EmpireProp[] = [
  { id: 'chandelier', name: 'Chandelier', emoji: '✨', position: { x: 50, y: 8 }, scale: 2.5, zIndex: 5 },
  { id: 'piano', name: 'Grand Piano', emoji: '🎹', position: { x: 20, y: 55 }, scale: 2.0, zIndex: 20, interactable: true, onInteract: 'perch' },
  { id: 'chaise', name: 'Velvet Chaise', emoji: '🛋️', position: { x: 70, y: 65 }, scale: 2.2, zIndex: 25, interactable: true, onInteract: 'sleep', attractsCats: true },
  { id: 'columns', name: 'Marble Column', emoji: '🏛️', position: { x: 8, y: 45 }, scale: 2.8, zIndex: 8 },
  { id: 'columns-2', name: 'Marble Column', emoji: '🏛️', position: { x: 92, y: 45 }, scale: 2.8, zIndex: 8 },
  { id: 'fountain', name: 'Fountain', emoji: '⛲', position: { x: 50, y: 75 }, scale: 1.8, zIndex: 22, attractsCats: true },
  { id: 'artwork', name: 'Fine Art', emoji: '🖼️', position: { x: 35, y: 20 }, scale: 1.8, zIndex: 6 },
];

export const FARM_PROPS: EmpireProp[] = [
  { id: 'barn', name: 'Red Barn', emoji: '🏠', position: { x: 85, y: 25 }, scale: 3.5, zIndex: 5, interactable: true, onInteract: 'hide' },
  { id: 'hay-bale-1', name: 'Hay Bale', emoji: '🟨', position: { x: 20, y: 65 }, scale: 1.5, zIndex: 20, interactable: true, onInteract: 'play', attractsCats: true },
  { id: 'hay-bale-2', name: 'Hay Bale', emoji: '🟨', position: { x: 30, y: 70 }, scale: 1.3, zIndex: 22, attractsCats: true },
  { id: 'fence', name: 'Wooden Fence', emoji: '🪵', position: { x: 50, y: 50 }, scale: 2.0, zIndex: 10, interactable: true, onInteract: 'perch' },
  { id: 'water-trough', name: 'Water Trough', emoji: '🪣', position: { x: 70, y: 75 }, scale: 1.4, zIndex: 25 },
  { id: 'windmill', name: 'Windmill', emoji: '🌀', position: { x: 12, y: 20 }, scale: 2.5, zIndex: 3 },
  { id: 'tractor', name: 'Tractor', emoji: '🚜', position: { x: 60, y: 40 }, scale: 2.0, zIndex: 15 },
];

export const PROPS_BY_HOUSE = {
  apartment: APARTMENT_PROPS,
  house: HOUSE_PROPS,
  mansion: MANSION_PROPS,
  farm: FARM_PROPS,
} as const;
```

### 1.3 Update Empire Configuration

**File:** `src/config/empire.ts`

Enhance with new visual layer definitions:

```typescript
import { EnhancedZoneTheme } from '@/types/empire';
import { APARTMENT_PROPS, HOUSE_PROPS, MANSION_PROPS, FARM_PROPS } from './empireProps';

export const ENHANCED_EMPIRE_ZONES: Record<HouseSize, EnhancedZoneTheme> = {
  apartment: {
    name: 'Cozy Apartment',
    skyGradient: 'from-orange-100 via-amber-50 to-amber-100',
    wallGradient: 'from-amber-100 to-amber-50',
    floorGradient: 'from-stone-300 to-stone-400',
    floorPattern: 'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(0,0,0,0.03) 20px, rgba(0,0,0,0.03) 21px)',
    windowScene: 'city',
    wallDecorations: [
      { emoji: '🖼️', position: { x: 20, y: 25 } },
      { emoji: '🕰️', position: { x: 75, y: 22 } },
    ],
    floorDecorations: [],
    props: APARTMENT_PROPS,
    particles: 'dust-motes',
    lighting: 'warm',
    shadowIntensity: 0.3,
    seasonalDecorations: {
      spring: [{ emoji: '🌸', position: { x: 10, y: 30 } }],
      summer: [{ emoji: '🌻', position: { x: 10, y: 30 } }],
      autumn: [{ emoji: '🍂', position: { x: 10, y: 30 } }],
      winter: [{ emoji: '❄️', position: { x: 45, y: 10 } }],
    },
  },
  house: { /* similar structure */ },
  mansion: { /* similar structure */ },
  farm: { /* similar structure with outdoor elements */ },
};
```

---

## Phase 2: Visual Layer Components

### 2.1 Time of Day Utility

**File:** `src/lib/empireTimeOfDay.ts` (New)

```typescript
import { TimeOfDay } from '@/types/empire';

export function getTimeOfDay(gameDay: number): TimeOfDay {
  const cycle = gameDay % 4;
  switch (cycle) {
    case 0: return 'morning';
    case 1: return 'afternoon';
    case 2: return 'evening';
    default: return 'night';
  }
}

export const TIME_OF_DAY_OVERLAYS: Record<TimeOfDay, { gradient: string; opacity: number }> = {
  morning: { gradient: 'from-yellow-200/20 via-transparent to-transparent', opacity: 0.3 },
  afternoon: { gradient: 'from-transparent to-transparent', opacity: 0 },
  evening: { gradient: 'from-orange-300/30 via-pink-200/20 to-purple-200/20', opacity: 0.4 },
  night: { gradient: 'from-blue-900/50 via-indigo-900/40 to-purple-900/30', opacity: 0.5 },
};
```

### 2.2 Time of Day Overlay Component

**File:** `src/components/empire/TimeOfDayOverlay.tsx` (New)

Renders gradient overlay based on game day:

```typescript
interface TimeOfDayOverlayProps {
  gameDay: number;
  className?: string;
}

export function TimeOfDayOverlay({ gameDay, className }: TimeOfDayOverlayProps) {
  const timeOfDay = getTimeOfDay(gameDay);
  const overlay = TIME_OF_DAY_OVERLAYS[timeOfDay];
  
  return (
    <div 
      className={cn(
        'absolute inset-0 pointer-events-none transition-all duration-1000',
        `bg-gradient-to-b ${overlay.gradient}`,
        className
      )}
      style={{ opacity: overlay.opacity }}
    >
      {/* Optional sun rays for morning */}
      {timeOfDay === 'morning' && <SunRays />}
      {/* Stars for night */}
      {timeOfDay === 'night' && <Stars />}
    </div>
  );
}
```

### 2.3 EmpireProp Component

**File:** `src/components/empire/EmpireProp.tsx` (New)

Renders individual interactive prop:

```typescript
interface EmpirePropComponentProps {
  prop: EmpireProp;
  onClick?: (propId: string) => void;
  isHighlighted?: boolean;
}

export function EmpirePropComponent({ prop, onClick, isHighlighted }: EmpirePropComponentProps) {
  return (
    <div
      className={cn(
        'absolute transition-transform duration-200',
        prop.interactable && 'cursor-pointer hover:scale-110',
        isHighlighted && 'animate-pulse'
      )}
      style={{
        left: `${prop.position.x}%`,
        top: `${prop.position.y}%`,
        transform: `translate(-50%, -50%) scale(${prop.scale})`,
        zIndex: prop.zIndex,
        fontSize: '2rem',
      }}
      onClick={() => prop.interactable && onClick?.(prop.id)}
      role={prop.interactable ? 'button' : undefined}
      aria-label={prop.name}
    >
      <span className="drop-shadow-md">{prop.emoji}</span>
    </div>
  );
}
```

### 2.4 Window Scene Component

**File:** `src/components/empire/WindowScene.tsx` (New)

Renders the view through windows based on house type:

```typescript
type WindowSceneType = 'city' | 'garden' | 'mountains' | 'fields';

const WINDOW_SCENES: Record<WindowSceneType, { elements: string[]; gradient: string }> = {
  city: { 
    elements: ['🏢', '🏙️', '🌆'], 
    gradient: 'from-sky-400 to-orange-200' 
  },
  garden: { 
    elements: ['🌳', '🌸', '🦋'], 
    gradient: 'from-sky-300 to-green-200' 
  },
  mountains: { 
    elements: ['🏔️', '⛰️', '🌲'], 
    gradient: 'from-sky-400 to-slate-300' 
  },
  fields: { 
    elements: ['🌾', '🌻', '🐄'], 
    gradient: 'from-sky-300 to-lime-200' 
  },
};
```

### 2.5 Seasonal Decorations Component

**File:** `src/components/empire/SeasonalDecorations.tsx` (New)

Adds seasonal flair based on real-world season:

```typescript
interface SeasonalDecorationsProps {
  season: RealSeason;
  houseSize: HouseSize;
}

export function SeasonalDecorations({ season, houseSize }: SeasonalDecorationsProps) {
  const zone = ENHANCED_EMPIRE_ZONES[houseSize];
  const decorations = zone.seasonalDecorations?.[season] || [];
  
  return (
    <>
      {decorations.map((deco, i) => (
        <div
          key={i}
          className="absolute animate-float"
          style={{
            left: `${deco.position.x}%`,
            top: `${deco.position.y}%`,
            fontSize: '1.5rem',
          }}
        >
          {deco.emoji}
        </div>
      ))}
    </>
  );
}
```

### 2.6 Empire Particle Effects

**File:** `src/components/empire/EmpireParticles.tsx` (New)

Lightweight particle system for dust motes, fireflies, etc:

```typescript
interface EmpireParticlesProps {
  type: ParticleType;
  density?: 'light' | 'medium' | 'heavy';
  enableReducedMotion?: boolean;
}

export function EmpireParticles({ type, density = 'light', enableReducedMotion }: EmpireParticlesProps) {
  if (enableReducedMotion) return null;
  
  // Reuse patterns from SeasonalParticles.tsx
  const count = density === 'light' ? 10 : density === 'medium' ? 20 : 35;
  // ... render particles
}
```

### 2.7 Parallax Container Hook

**File:** `src/hooks/empire/useParallax.ts` (New)

Optional parallax effect based on mouse position:

```typescript
export function useParallax(enabled: boolean = true) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    if (!enabled) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 10;
      setOffset({ x, y });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enabled]);
  
  return offset;
}
```

---

## Phase 3: Cat Behavior Enhancements

### 3.1 Furniture Attraction Logic

**File:** `src/hooks/empire/useRoamingCats.ts` (Modify)

Add attraction zones so cats gravitate toward furniture:

```typescript
// New function to calculate weighted position including furniture attraction
function getWeightedPosition(
  currentPos: { x: number; y: number },
  attractionZones: AttractionZone[],
  catPersonality: CatPersonality
): { x: number; y: number } {
  // 30% chance to move toward attractive furniture
  if (Math.random() < 0.3 && attractionZones.length > 0) {
    const preferredZones = attractionZones.filter(zone => {
      // Lazy cats prefer beds, playful cats prefer toys
      if (catPersonality === 'lazy' && zone.behavior === 'sleep') return true;
      if (catPersonality === 'playful' && zone.behavior === 'play') return true;
      return Math.random() < 0.5;
    });
    
    if (preferredZones.length > 0) {
      const target = preferredZones[Math.floor(Math.random() * preferredZones.length)];
      return {
        x: target.center.x + (Math.random() - 0.5) * target.radius,
        y: target.center.y + (Math.random() - 0.5) * target.radius,
      };
    }
  }
  
  // Otherwise random position as before
  return randomPosition();
}
```

### 3.2 Cat State Extensions

Add new states to `CatState` type:

```typescript
export type CatState = 
  | 'idle' 
  | 'walking' 
  | 'interacting' 
  | 'sleeping'     // On furniture
  | 'playing'      // With toy prop
  | 'perching'     // On window/fence
  | 'sunbathing';  // In light beam
```

Update `RoamingCat.tsx` to render state-specific indicators.

---

## Phase 4: Update EmpireScene

### 4.1 Refactor EmpireScene.tsx

**File:** `src/components/empire/EmpireScene.tsx` (Major Update)

```typescript
export function EmpireScene({ cats, houseSize, catCostumes, resources, gameDay, ...handlers }: EmpireSceneProps) {
  const { settings } = useGraphicsSettings();
  const season = getCurrentRealSeason();
  const zone = ENHANCED_EMPIRE_ZONES[houseSize];
  const parallaxOffset = useParallax(settings.enableAnimations);
  const { positions, setInteracting, attractionZones } = useRoamingCats(cats, zone.props);

  return (
    <div className="relative w-full h-[500px] sm:h-[600px] overflow-hidden rounded-xl border shadow-lg">
      {/* Layer 0: Sky/Background */}
      <div className={cn('absolute inset-0', `bg-gradient-to-b ${zone.skyGradient}`)}>
        {zone.windowScene && <WindowScene type={zone.windowScene} timeOfDay={getTimeOfDay(gameDay)} />}
      </div>
      
      {/* Layer 1: Wall with decorations */}
      <div 
        className={cn('absolute inset-0 bottom-1/2', `bg-gradient-to-b ${zone.wallGradient}`)}
        style={{ transform: `translate(${parallaxOffset.x * 0.5}px, ${parallaxOffset.y * 0.5}px)` }}
      >
        {zone.wallDecorations.map((deco, i) => (
          <span key={i} style={{ left: `${deco.position.x}%`, top: `${deco.position.y}%` }} className="absolute">
            {deco.emoji}
          </span>
        ))}
      </div>
      
      {/* Layer 2: Props */}
      {zone.props.map(prop => (
        <EmpirePropComponent key={prop.id} prop={prop} onClick={handlePropClick} />
      ))}
      
      {/* Layer 3: Floor + Cats */}
      <div 
        className={cn('absolute inset-0 top-1/2', `bg-gradient-to-b ${zone.floorGradient}`)}
        style={{ backgroundImage: zone.floorPattern }}
      />
      {cats.map(cat => (
        <RoamingCat key={cat.id} cat={cat} position={positions.get(cat.id)} {...catProps} />
      ))}
      
      {/* Layer 4: Atmospheric overlays */}
      <TimeOfDayOverlay gameDay={gameDay} />
      <SeasonalDecorations season={season} houseSize={houseSize} />
      {zone.particles && settings.enableParticles && (
        <EmpireParticles type={zone.particles} enableReducedMotion={settings.enableReducedMotion} />
      )}
      
      {/* Layer 5: UI Overlays */}
      {/* ... stats badges ... */}
    </div>
  );
}
```

### 4.2 Update Empire Page

**File:** `src/pages/Empire.tsx` (Minor Update)

Pass `gameDay` to `EmpireScene`:

```typescript
<EmpireScene
  cats={state.cats}
  houseSize={state.houseSize}
  catCostumes={state.catCostumes}
  resources={state.resources}
  gameDay={state.day}  // NEW
  onPetCat={handlePetCat}
  onFeedCat={handleFeedCat}
  onPlayWithCat={handlePlayWithCat}
/>
```

---

## Phase 5: Graphics Settings Integration

### 5.1 Add Empire-Specific Settings

**File:** `src/hooks/useGraphicsSettings.ts` (Update)

Add new settings for Empire visuals:

```typescript
export interface GraphicsSettings {
  // ... existing settings ...
  
  // Empire-specific
  enableEmpireParallax: boolean;
  enableEmpireParticles: boolean;
  enableTimeOfDayEffects: boolean;
  enableSeasonalDecorations: boolean;
  empireBackgroundQuality: 'simple' | 'detailed' | 'ai-generated';
}
```

### 5.2 Add Toggle in Graphics Settings Panel

**File:** `src/components/game/GraphicsSettingsPanel.tsx` (Update)

Add toggles for Empire visual features.

---

## Phase 6: Optional - AI-Generated Backgrounds

### 6.1 Create Background Generation Edge Function

**File:** `supabase/functions/generate-empire-background/index.ts` (New)

Similar to `generate-auth-background`, but with house-specific prompts:

```typescript
const EMPIRE_PROMPTS: Record<HouseSize, Record<RealSeason, string>> = {
  apartment: {
    spring: 'Cozy urban apartment interior with city view through window, spring flowers on windowsill, cats lounging, kawaii style...',
    // ... other seasons
  },
  // ... other house types
};
```

### 6.2 Hook for Fetching/Caching Backgrounds

**File:** `src/hooks/empire/useEmpireBackground.ts` (New)

```typescript
export function useEmpireBackground(houseSize: HouseSize, season: RealSeason) {
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Check cache first, then fetch from storage or generate
  // Similar pattern to useAuthBackground
}
```

---

## File Summary

| File | Action | Description |
|:-----|:-------|:------------|
| `src/types/empire.ts` | Update | Add `EmpireProp`, `EnhancedZoneTheme`, `TimeOfDay`, `ParticleType` |
| `src/config/empireProps.ts` | Create | Props definitions for all 4 house types |
| `src/config/empire.ts` | Update | Add `ENHANCED_EMPIRE_ZONES` with full theme data |
| `src/lib/empireTimeOfDay.ts` | Create | Time of day calculation utilities |
| `src/components/empire/TimeOfDayOverlay.tsx` | Create | Lighting overlay component |
| `src/components/empire/EmpireProp.tsx` | Create | Interactive prop renderer |
| `src/components/empire/WindowScene.tsx` | Create | Window view renderer |
| `src/components/empire/SeasonalDecorations.tsx` | Create | Seasonal decoration renderer |
| `src/components/empire/EmpireParticles.tsx` | Create | Particle effect system |
| `src/hooks/empire/useParallax.ts` | Create | Mouse-based parallax hook |
| `src/hooks/empire/useRoamingCats.ts` | Update | Add attraction zone logic |
| `src/components/empire/EmpireScene.tsx` | Update | Integrate all visual layers |
| `src/components/empire/RoamingCat.tsx` | Update | Handle new cat states |
| `src/pages/Empire.tsx` | Update | Pass `gameDay` prop |
| `src/hooks/useGraphicsSettings.ts` | Update | Add Empire-specific toggles |
| `src/components/game/GraphicsSettingsPanel.tsx` | Update | Add Empire toggles |
| `docs/EMPIRE_GRAPHICS_TODO.md` | Update | Mark completed tasks |

---

## Implementation Order

1. **Types & Config** (Phase 1) - Foundation with no UI changes
2. **Time of Day** (Phase 2.1-2.2) - Quick visual win
3. **Props System** (Phase 2.3) - Add furniture/decorations
4. **Seasonal Effects** (Phase 2.5) - Integrate with existing season utils
5. **Cat Attraction** (Phase 3) - Enhanced behavior
6. **Parallax** (Phase 2.7) - Optional polish
7. **Particles** (Phase 2.6) - Atmospheric effects
8. **AI Backgrounds** (Phase 6) - Optional premium feature
9. **Settings Integration** (Phase 5) - User controls

---

## Performance Considerations

- Use CSS transforms for parallax (GPU-accelerated)
- Limit particle counts based on device capability
- Lazy-load AI backgrounds per house type
- Respect `useGraphicsSettings().effectiveAnimations` for reduced motion
- Cache prop positions and attraction zones with `useMemo`

---

## Accessibility

- All interactive props have `aria-label` and `role="button"`
- Respect `prefers-reduced-motion` via `enableReducedMotion` setting
- Maintain minimum 4.5:1 contrast for UI overlays in all lighting conditions
- Keyboard navigation for prop interactions
