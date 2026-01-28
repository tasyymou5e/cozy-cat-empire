# Parallax Depth System

> **Location:** `src/hooks/empire/useParallax.ts` + `src/components/empire/ParallaxLayer.tsx`

## Overview

The parallax system creates depth and immersion on the Empire page by moving visual layers at different speeds based on mouse position. Elements closer to the viewer move more, while distant elements move less—mimicking real-world depth perception.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Parallax System                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │   useParallax    │───>│  ParallaxOffset  │                   │
│  │      Hook        │    │   { x, y }       │                   │
│  └──────────────────┘    └──────────────────┘                   │
│           │                       │                              │
│           │ Mouse tracking        │ Offset values                │
│           │ Smooth animation      │                              │
│           ▼                       ▼                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   ParallaxLayer                           │   │
│  │  Applies depth multiplier to offset for transform        │   │
│  └──────────────────────────────────────────────────────────┘   │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               Visual Layer Stack                          │   │
│  │  background (0.1) → midground (0.5) → foreground (1.0)   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. useParallax Hook

**File:** `src/hooks/empire/useParallax.ts`

Creates mouse-responsive offset values with smooth animation.

```typescript
import { useParallax } from '@/hooks/empire/useParallax';

function MyComponent() {
  const offset = useParallax(
    true,   // enabled - whether parallax is active
    30,     // intensity - movement multiplier (default: 30)
    0.08    // smoothing - animation smoothness (default: 0.08)
  );
  
  // offset = { x: number, y: number }
}
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enabled` | boolean | `true` | Enables/disables parallax effect |
| `intensity` | number | `30` | Multiplier for movement amount |
| `smoothing` | number | `0.08` | Animation interpolation factor (0-1) |

**Return Value:**

```typescript
interface ParallaxOffset {
  x: number;  // Horizontal offset (-intensity/2 to +intensity/2)
  y: number;  // Vertical offset (reduced by 0.6x for subtlety)
}
```

**How It Works:**

1. Tracks mouse position relative to window center
2. Normalizes to -0.5 to +0.5 range
3. Applies intensity multiplier
4. Uses `requestAnimationFrame` for smooth interpolation
5. Returns to center (0,0) when mouse leaves window

---

### 2. ParallaxLayer Component

**File:** `src/components/empire/ParallaxLayer.tsx`

Wrapper component that applies parallax transform to children.

```tsx
import { ParallaxLayer, PARALLAX_DEPTHS } from '@/components/empire/ParallaxLayer';

<ParallaxLayer
  depth="midground"      // Preset or custom number
  offset={parallaxOffset} // From useParallax hook
  zIndex={10}            // Layer stacking order
  className="opacity-80"
>
  <MyVisualElement />
</ParallaxLayer>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `depth` | `ParallaxDepth \| number` | required | Depth multiplier or preset name |
| `offset` | `{ x: number, y: number }` | required | Current parallax offset |
| `enabled` | boolean | `true` | Whether to apply transform |
| `zIndex` | number | undefined | CSS z-index for stacking |
| `className` | string | undefined | Additional CSS classes |
| `style` | CSSProperties | undefined | Additional inline styles |

---

### 3. ParallaxContainer Component

**File:** `src/components/empire/ParallaxLayer.tsx`

Container with proper overflow handling for parallax layers.

```tsx
import { ParallaxContainer } from '@/components/empire/ParallaxLayer';

<ParallaxContainer className="h-screen">
  <ParallaxLayer depth="background" offset={offset}>
    <Sky />
  </ParallaxLayer>
  <ParallaxLayer depth="foreground" offset={offset}>
    <Characters />
  </ParallaxLayer>
</ParallaxContainer>
```

---

## Depth Presets

```typescript
export const PARALLAX_DEPTHS = {
  background: 0.1,      // Furthest - minimal movement (sky, distant mountains)
  midBackground: 0.25,  // Far elements (trees, buildings)
  midground: 0.5,       // Medium movement (props, furniture)
  midForeground: 0.75,  // Near elements (interactive items)
  foreground: 1.0,      // Closest - maximum movement (characters, UI)
} as const;

export type ParallaxDepth = keyof typeof PARALLAX_DEPTHS;
```

**Visual Guide:**

```
Depth Layer        Multiplier   Movement   Use Case
─────────────────────────────────────────────────────
background         0.1          Minimal    Sky, distant scenery
midBackground      0.25         Subtle     Trees, far buildings
midground          0.5          Medium     Props, furniture
midForeground      0.75         Notable    Interactive elements
foreground         1.0          Maximum    Cats, characters
```

---

## Usage Examples

### Basic Empire Scene

```tsx
import { useParallax } from '@/hooks/empire/useParallax';
import { ParallaxContainer, ParallaxLayer } from '@/components/empire/ParallaxLayer';
import { useGraphicsSettings } from '@/hooks/useGraphicsSettings';

function EmpireScene() {
  const { settings } = useGraphicsSettings();
  const parallaxOffset = useParallax(settings.enableEmpireParallax);

  return (
    <ParallaxContainer className="h-screen w-full">
      {/* Sky - barely moves */}
      <ParallaxLayer depth="background" offset={parallaxOffset} zIndex={0}>
        <SkyGradient />
      </ParallaxLayer>

      {/* Window scene - slight movement */}
      <ParallaxLayer depth="midBackground" offset={parallaxOffset} zIndex={5}>
        <WindowScene />
      </ParallaxLayer>

      {/* Props/furniture - medium movement */}
      <ParallaxLayer depth="midground" offset={parallaxOffset} zIndex={10}>
        <FurnitureLayer />
      </ParallaxLayer>

      {/* Cats - maximum movement */}
      <ParallaxLayer depth="foreground" offset={parallaxOffset} zIndex={20}>
        <RoamingCats />
      </ParallaxLayer>
    </ParallaxContainer>
  );
}
```

### Custom Depth Values

```tsx
// Use numeric value instead of preset
<ParallaxLayer 
  depth={0.35}  // Custom depth between midBackground and midground
  offset={offset}
>
  <CustomElement />
</ParallaxLayer>
```

### Conditional Parallax

```tsx
function ResponsiveScene() {
  const isMobile = useIsMobile();
  const { settings } = useGraphicsSettings();
  
  // Disable parallax on mobile or when setting is off
  const enabled = !isMobile && settings.enableEmpireParallax;
  const offset = useParallax(enabled);

  return (
    <ParallaxLayer 
      depth="midground" 
      offset={offset}
      enabled={enabled}  // Also disable transform application
    >
      <Content />
    </ParallaxLayer>
  );
}
```

---

## Integration with FloatingDecorations

The `FloatingDecorations` component has its own built-in parallax:

```tsx
// FloatingDecorations with parallax enabled (default)
<FloatingDecorations 
  variant="kawaii-cats" 
  density="medium"
  parallax={true}  // Uses internal mouse tracking
/>
```

**Internal Implementation:**
- Tracks mouse position independently
- Applies varying depths per decoration (0.5, 0.75, 1.0)
- Uses CSS transition for smoothing

---

## Graphics Settings Integration

The parallax system respects user preferences:

```typescript
// In useGraphicsSettings.ts
export interface GraphicsSettings {
  // ... other settings
  enableEmpireParallax: boolean;  // Default: true
}
```

**Settings Panel Toggle:**

Located in Graphics Settings panel under "Empire" section:
- Toggle: "Parallax Effects"
- Description: "Enable depth movement on mouse"

---

## Performance Considerations

### Optimizations Applied

1. **will-change: transform** - Hints browser for GPU acceleration
2. **translate3d** - Forces GPU compositing layer
3. **requestAnimationFrame** - Syncs with display refresh rate
4. **Smoothing factor** - Prevents jittery movement
5. **Early exit** - Stops animation when delta < 0.01

### Best Practices

```tsx
// ✅ Good - single parallax hook at scene level
function Scene() {
  const offset = useParallax(enabled);
  return (
    <>
      <ParallaxLayer depth="background" offset={offset}>...</ParallaxLayer>
      <ParallaxLayer depth="foreground" offset={offset}>...</ParallaxLayer>
    </>
  );
}

// ❌ Bad - multiple hooks create redundant listeners
function BadScene() {
  const offset1 = useParallax(true);  // Wasteful
  const offset2 = useParallax(true);  // Redundant
  return <>{/* ... */}</>;
}
```

### Accessibility

- Respects `enableReducedMotion` from graphics settings
- When disabled, layers render without transform
- No content is hidden by parallax effect

---

## File Reference

| File | Purpose |
|------|---------|
| `src/hooks/empire/useParallax.ts` | Mouse tracking and smooth animation hook |
| `src/components/empire/ParallaxLayer.tsx` | Layer wrapper component + container |
| `src/components/ui/FloatingDecorations.tsx` | Floating emojis with built-in parallax |
| `src/hooks/useGraphicsSettings.ts` | Settings including `enableEmpireParallax` |
| `src/components/empire/EmpireScene.tsx` | Main usage of parallax system |

---

## Troubleshooting

### Parallax not working

1. Check `enableEmpireParallax` in graphics settings
2. Verify `useParallax(true)` is called with enabled=true
3. Ensure `ParallaxLayer` has `enabled={true}` (default)

### Jittery movement

- Increase `smoothing` parameter (e.g., 0.12 instead of 0.08)
- Check for CSS transitions conflicting with transform

### Layers overlapping incorrectly

- Set explicit `zIndex` on each `ParallaxLayer`
- Use `ParallaxContainer` for proper overflow handling

### Performance issues

- Reduce number of parallax layers
- Disable parallax on mobile: `useParallax(!isMobile)`
- Check for unnecessary re-renders in child components
