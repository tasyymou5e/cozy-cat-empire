# Cat Farm - Graphics Settings Panel

## Overview

The Graphics Settings Panel allows players to customize visual effects, performance settings, and AI portrait preferences. All settings are persisted to localStorage and respect system accessibility preferences.

**Location:** Settings tab in the main game interface  
**Component:** `src/components/game/GraphicsSettingsPanel.tsx`  
**Hook:** `src/hooks/useGraphicsSettings.ts`  
**Config:** `src/config/graphics.ts`

---

## Settings Categories

The 17 configurable options are organized into four categories:

| Category | Count | Settings |
|----------|-------|----------|
| **Performance** | 3 | Avatar Quality, Enable Animations, Force Reduced Motion |
| **Effects** | 5 | Costume Animations, Particle Effects, Tier Glows, Sparkle Effects, Card Flip Animation |
| **Display** | 6 | Card Border Style, AI Portraits, Costume Badge, Costume Rendering, Vector Engine*, Avatar Breed Features* |
| **Portraits** | 3 | Portrait Quality, Show Outdated Indicator, Auto-Prompt Outdated |

*Hidden settings (configured in `graphics.ts` only)

---

## All 17 Settings Explained

### Performance Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| **Avatar Quality** | Select | `high` | Controls avatar rendering detail level |
| **Enable Animations** | Toggle | `true` | Master toggle for micro-animations |
| **Force Reduced Motion** | Toggle | `false` | Override to minimize all animations |

#### 1. Avatar Quality

Controls the level of detail in cat avatar rendering:

| Level | Features | Best For |
|-------|----------|----------|
| **Low** | Simplified shapes, no gradients, basic colors | Older devices, battery saving |
| **Medium** | Balanced detail, optimized rendering | Most devices |
| **High** | Full gradients, shadows, breed-specific features | Modern devices |

**Performance Impact:** High → Medium → Low reduces CPU/GPU usage by ~40% each step

#### 2. Enable Animations

Toggles micro-animations throughout the app:
- Cat breathing animations
- Eye blinking effects
- Idle movement animations
- Hover state transitions
- Mood indicator animations

**Performance Impact:** Disabling saves ~15% CPU during idle

#### 3. Force Reduced Motion

Overrides system preference to forcibly disable all animations:
- Respects `prefers-reduced-motion` system setting automatically
- When enabled, overrides even if animations are turned on
- Badge shows when system reduced motion is detected

**Accessibility:** Recommended for users with vestibular disorders or motion sensitivity

---

### Effects Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| **Costume Animations** | Toggle | `true` | Animated costume effects |
| **Particle Effects** | Toggle | `true` | Floating particles and magic effects |
| **Tier Glows** | Toggle | `true` | Glowing borders on rare cats |
| **Sparkle Effects** | Toggle | `true` | Sparkle particles for ultra rare cats |
| **Card Flip Animation** | Toggle | `true` | 3D flip effect on trading cards |

#### 4. Costume Animations

Controls animated effects on equipped costumes:
- Sparkle trails on magic items
- Glow pulses on legendary costumes
- Flowing cape animations
- Particle emissions from special items

**Performance Impact:** ~10% GPU usage when active

#### 5. Particle Effects

Controls floating ambient particles:
- Magic dust particles
- Celebration confetti
- Ambient sparkles
- Mood indicator particles

**Performance Impact:** ~8% GPU usage, can cause slowdown with many cats visible

#### 6. Tier Glows

Enables glowing border effects based on cat grade tier:

| Tier | Grade Range | Glow Effect |
|------|-------------|-------------|
| Common | 1-4 | None |
| Uncommon | 5-8 | Static blue glow |
| Rare | 9-12 | Animated purple pulse |
| Very Rare | 13-16 | Animated golden pulse |
| Ultra Rare | 17-20 | Rainbow color cycling |

**Performance Impact:** ~5% GPU for animated glows

#### 7. Sparkle Effects

Adds sparkle particles specifically for ultra rare (Grade 17-20) cats:
- Floating star particles
- Shimmer effects on card
- Rainbow sparkle trails

**Performance Impact:** ~3% GPU per ultra rare cat displayed

#### 8. Card Flip Animation

Controls 3D flip animation in Cat Collection:
- CSS 3D transforms for smooth rotation
- Backface rendering for card back
- Touch/click triggered flip

**Performance Impact:** Minimal except during flip animation

---

### Display Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| **Card Border Style** | Select | `tier` | How cat card borders appear |
| **Prefer AI Portraits** | Toggle | `true` | Prioritize AI-generated portraits |
| **Show Costume on Portrait** | Toggle | `true` | Display costume badge on portraits |
| **Costume Rendering** | Select | `auto` | How costumes are rendered |
| **Vector Engine** | Hidden | `paperjs` | Avatar rendering engine |
| **Avatar Breed Features** | Hidden | `true` | Breed-specific shapes |

#### 9. Card Border Style

Controls border appearance on cat cards:

| Style | Description | Visual Effect |
|-------|-------------|---------------|
| **By Tier** | Color-coded by grade tier | Gray → Blue → Purple → Gold → Rainbow |
| **Simple** | Consistent border for all cats | Standard gray border |
| **None** | No visible border | Clean, borderless cards |

**Visual Impact:** Tier borders help identify valuable cats at a glance

#### 10. Prefer AI Portraits

When enabled, displays AI-generated portraits instead of vector avatars:
- Only applies when cat has a generated portrait
- Falls back to vector avatar if portrait is missing
- Toggle off to always see procedural vector avatars

**Performance Impact:** Portraits are static images (faster rendering), avatars are generated (slower)

#### 11. Show Costume on Portrait

When using AI portraits, shows a small costume indicator badge:
- Displays costume emoji overlay
- Positioned in corner of portrait
- Helps identify equipped items at a glance

**Visual Impact:** Small badge overlay, no performance impact

#### 12. Costume Rendering

How costumes are displayed on vector avatars:

| Mode | Description | Quality | Performance |
|------|-------------|---------|-------------|
| **Auto** | Selects best available option | Best | Variable |
| **Vector** | Always use SVG vector costumes | Highest | Slower |
| **Emoji** | Use simpler emoji overlays | Lower | Fastest |

#### 13. Vector Engine (Hidden)

Internal setting for avatar rendering engine:
- **paperjs**: High-quality Paper.js vector generation with breed-specific shapes
- **simple**: Basic CSS-based rendering

**Note:** Not exposed in UI, configured in `src/config/graphics.ts`

---

### Portrait Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| **Portrait Quality** | Select | `standard` | AI model quality for portrait generation |
| **Show Outdated Indicator** | Toggle | `true` | Show badge when portrait needs updating |
| **Auto-Prompt Outdated** | Toggle | `true` | Notify when portrait becomes outdated |

#### 15. Portrait Quality

Controls which AI model is used for portrait generation:

| Level | Model | Quality | Speed | Best For |
|-------|-------|---------|-------|----------|
| **Standard** | `gemini-2.5-flash` | Good | Fast | Regular use, quick generation |
| **Premium** | `gemini-3-pro-image-preview` | Highest | Slower | Special cats, detailed costumes |

**Note:** Premium quality uses the same portrait credits but provides higher detail, especially for costume rendering.

#### 16. Show Outdated Indicator

When enabled, displays a visual badge on cat cards when:
- Cat has no portrait yet (✨ icon)
- Cat's portrait is outdated due to appearance/costume changes (⚠️ icon)

Uses `usePortraitStatus` hook to detect outdated portraits via appearance hash comparison.

#### 17. Auto-Prompt Outdated

When enabled, shows a toast notification when:
- User equips/unequips a costume
- User changes cat appearance
- Portrait no longer matches current cat state

**Note:** Not exposed in UI, configured in `src/config/graphics.ts`

---

## Performance Presets

### Maximum Quality (Default)

```typescript
{
  avatarQuality: 'high',
  enableAnimations: true,
  enableCostumeAnimations: true,
  enableParticles: true,
  enableTierGlows: true,
  enableSparkles: true,
  enableCardFlip: true
}
```

**CPU/GPU Impact:** High | **Best for:** Modern devices with dedicated GPU

### Balanced

```typescript
{
  avatarQuality: 'medium',
  enableAnimations: true,
  enableCostumeAnimations: false,
  enableParticles: true,
  enableTierGlows: true,
  enableSparkles: false,
  enableCardFlip: true
}
```

**CPU/GPU Impact:** Medium | **Best for:** Average laptops and tablets

### Performance Mode

```typescript
{
  avatarQuality: 'low',
  enableAnimations: false,
  enableCostumeAnimations: false,
  enableParticles: false,
  enableTierGlows: false,
  enableSparkles: false,
  enableCardFlip: false
}
```

**CPU/GPU Impact:** Low | **Best for:** Older devices, mobile, battery saving

---

## Accessibility Features

### System Integration

- Automatically detects `prefers-reduced-motion` media query
- Shows \"System: Reduced Motion\" badge when OS preference detected
- Force Reduced Motion setting overrides all animation settings

### Visual Indicators

| Badge | Meaning |
|-------|---------|
| \"System: Reduced Motion\" | OS accessibility preference detected |
| \"Animations Disabled\" | Master animations toggle is off |

### Reset to Defaults

Click \"Reset to Defaults\" button to restore all settings to their original values.

---

## Technical Implementation

### Storage

- **Key:** `cat-farm-graphics-settings`
- **Version:** 1 (for migration support)
- **Format:** JSON with version field + settings object

```typescript
{
  version: 1,
  avatarQuality: 'high',
  enableAnimations: true,
  // ... other settings
}
```

### Hook API

```typescript
import { useGraphicsSettings } from '@/hooks/useGraphicsSettings';

const {
  settings,           // Current GraphicsSettings object
  updateSetting,      // <K extends keyof GraphicsSettings>(key: K, value: GraphicsSettings[K]) => void
  resetToDefaults,    // () => void
  isReducedMotion,    // boolean - system preference detected
  effectiveAnimations // boolean - computed actual animation state
} = useGraphicsSettings();
```

### GraphicsSettings Interface

```typescript
interface GraphicsSettings {
  // Performance
  avatarQuality: 'low' | 'medium' | 'high';
  enableAnimations: boolean;
  forceReducedMotion: boolean;
  
  // Effects
  enableCostumeAnimations: boolean;
  enableParticles: boolean;
  enableTierGlows: boolean;
  enableSparkles: boolean;
  enableCardFlip: boolean;
  
  // Display
  cardBorderStyle: 'tier' | 'simple' | 'none';
  preferPortrait: boolean;
  showCostumeOnPortrait: boolean;
  costumeDisplayMode: 'auto' | 'vector' | 'emoji';
  vectorEngine: 'paperjs' | 'simple';
  avatarBreedFeatures: boolean;
  
  // Portraits (NEW)
  portraitQuality: 'standard' | 'premium';
  showOutdatedIndicator: boolean;
  autoPromptOutdated: boolean;
}
```

### Using Settings in Components

```typescript
import { useGraphicsSettings } from '@/hooks/useGraphicsSettings';
import { getTierVisuals } from '@/config/graphics';

function CatCard({ cat }) {
  const { settings, effectiveAnimations } = useGraphicsSettings();
  const tier = calculateTier(cat.grade);
  const visuals = getTierVisuals(tier);
  
  return (
    <div className={cn(
      settings.enableTierGlows && visuals.glowClass,
      settings.cardBorderStyle === 'tier' && visuals.borderColor
    )}>
      {effectiveAnimations && <BreathingAnimation />}
      {settings.enableSparkles && tier === 'ultraRare' && <SparkleEffect />}
    </div>
  );
}
```

---

## Tier Visual Configuration

| Tier | Grade | Border Color | Glow Effect | Background Gradient |
|------|-------|--------------|-------------|---------------------|
| Common | 1-4 | `border-border` | None | `bg-card` |
| Uncommon | 5-8 | `border-blue-400` | Static blue shadow | Blue gradient |
| Rare | 9-12 | `border-purple-400` | `animate-purple-glow` | Purple gradient |
| Very Rare | 13-16 | `border-yellow-400` | `animate-golden-glow` | Yellow gradient |
| Ultra Rare | 17-20 | `border-pink-400` | `animate-rainbow-glow` | Rainbow gradient |

---

## Files Reference

| File | Purpose |
|------|---------|
| `src/config/graphics.ts` | Default configuration values and tier visuals |
| `src/hooks/useGraphicsSettings.ts` | State management hook with localStorage persistence |
| `src/hooks/usePortraitStatus.ts` | Track outdated portraits across all cats |
| `src/components/game/GraphicsSettingsPanel.tsx` | Settings UI component with all controls |
| `src/components/game/PortraitOutdatedBadge.tsx` | Visual indicator for outdated/missing portraits |
| `src/lib/portraitUtils.ts` | Portrait hash computation and outdated detection |
| `supabase/functions/generate-cat-portrait/index.ts` | AI portrait generation edge function |

---

## Related Documentation

- [Cat Visual System](./CAT_VISUAL_SYSTEM.md) - Unified cat visual architecture including AI portraits
- [Components](./COMPONENTS.md) - Component architecture overview
- [Tech Stack](./TECH_STACK.md) - Technology overview
- [AI Portrait Credits](./AI_PORTRAIT_CREDITS.md) - Portrait credit system
