

# Cat Image Style Selection with Lottie Micro-Interactions

## Overview

Add user-selectable portrait styles (realistic/kawaii) with Lottie-powered blinks, CSS micro-interactions (breathing, ear twitch, whisker flicker), per-cat style storage, global defaults, and a one-click upgrade option for existing portraits.

---

## Phase 1: Foundation (~140 lines)

### 1.1 Update `src/types/game.ts`
- Add `portraitStyle?: 'realistic' | 'kawaii'` field to the `Cat` interface (after `appearanceHash`)

### 1.2 Create `src/config/portraitSettings.ts`
- Define `PortraitStyle` type (`'realistic' | 'kawaii'`)
- Default style constant (`'kawaii'`)
- localStorage persistence helpers for global default style preference
- Style display metadata (labels, descriptions, icons)

### 1.3 Update `src/config/graphics.ts`
- Add `enableMicroAnimations: true` to `GRAPHICS_CONFIG`
- Add `defaultPortraitStyle: 'kawaii'` to `GRAPHICS_CONFIG`

### 1.4 Update `src/hooks/useGraphicsSettings.ts`
- Add `enableMicroAnimations: boolean` and `defaultPortraitStyle: 'realistic' | 'kawaii'` to `GraphicsSettings` interface
- Wire up defaults from `GRAPHICS_CONFIG`

### 1.5 Create `src/hooks/usePortraitStyle.ts`
- Hook returning current style for a cat (per-cat override or global default)
- Functions: `getStyleForCat(cat)`, `setGlobalDefault(style)`, `setCatStyle(catId, style)`
- Reads from cat's `portraitStyle` field, falls back to global setting

---

## Phase 2: Animation System (~250 lines)

### 2.1 Install dependency
- `npm install lottie-react`

### 2.2 Create Lottie animation assets
- `public/animations/kawaii-blink.json` — Download and customize "The blinking cat" by Mishal Alnazawi from LottieFiles (~6KB)
- `public/animations/realistic-blink.json` — Custom realistic cat blink animation (~4KB)

### 2.3 Create `src/hooks/useMicroAnimations.ts`
- Accepts `style: 'kawaii' | 'realistic'` and `enabled: boolean`
- Randomized per-cat timing using `useState(() => Math.random() * range)`
  - Blink: every 4-8s (random)
  - Ear twitch (kawaii only): every 3-5s (random)
- `isBlinking` state toggled on timer
- `whiskerFlicker` synced to blink trigger
- Respects `prefers-reduced-motion` media query — disables all animations if detected
- Returns: `{ isBlinking, whiskerFlicker, earTwitchActive, animationClasses }`

### 2.4 Create `src/components/game/AnimatedCatPortrait.tsx`
- Wrapper component accepting children (the portrait image/avatar)
- Applies CSS animation classes based on style:
  - **Kawaii**: breathing (scale pulse 2s), ear twitch (rotate 0.3s), whisker flicker
  - **Realistic**: head tilt (3deg rotate 4s), whisker flicker
- Lottie blink overlay using `lottie-react` (lazy-loaded)
- Hover zoom effect: `scale(1.1)` with `cubic-bezier(0.34, 1.56, 0.64, 1)`
- Cross-fade on load via opacity transition
- Toggle prop `enableAnimations` to disable everything

### 2.5 Add CSS keyframes to Tailwind config
```css
kawaii-breathe: scale(1) -> scale(1.05) -> scale(1), 2s ease-in-out
kawaii-ear-twitch: rotate(0deg) -> rotate(8deg) -> rotate(0deg), 0.3s ease-out
realistic-head-tilt: rotate(-3deg) -> rotate(3deg) -> rotate(-3deg), 4s ease-in-out
whisker-flicker: translateX(0) -> translateX(1px) -> translateX(0), 0.15s linear
```

---

## Phase 3: Vector System Updates (~200 lines)

### 3.1 Update `src/lib/portraitUtils.ts`
- Include `portraitStyle` in `computeAppearanceHash()` so style changes invalidate cached portraits

### 3.2 Update `src/lib/catVectorGenerator.ts`
- Accept optional `style` parameter in `generateCatAvatarUrl()`
- **Kawaii style**: Larger eyes (1.3x), rounder face, bigger blush marks, simpler fur detail
- **Realistic style**: Proportional eyes, angular face shapes, detailed fur texture, subtle shading

### 3.3 Update `src/components/game/PaperCatAvatar.tsx`
- Accept `style?: 'realistic' | 'kawaii'` prop
- Pass to `generateCatAvatarUrl()`
- Include style in cache hash

### 3.4 Update `src/components/game/CatVisual.tsx`
- Read style from cat data or global default
- Pass style to `PaperCatAvatar`
- Wrap in `AnimatedCatPortrait` when animations enabled

---

## Phase 4: UI Components (~310 lines)

### 4.1 Update `src/components/game/CatPortrait.tsx`
- Add style selector buttons: `[📷 Realistic]` `[🎨 Kawaii]`
- Add "Apply Animated Preview" toggle switch
- Pass selected style to portrait generation call
- Show current style badge on portrait

### 4.2 Create `src/components/game/PortraitStyleSettings.tsx`
- Dialog component accessible from GraphicsSettingsPanel
- Global default style selector (Realistic / Kawaii)
- Fallback avatar preference (AI Portrait / PaperCatAvatar)
- Enable micro-interactions toggle
- **One-Click Upgrade section**: Shows count of cats with non-default style, button to batch-regenerate all to the selected style
- Credit cost estimate before upgrade

### 4.3 Update `src/components/game/BatchPortraitGenerator.tsx`
- Add global style dropdown (Realistic / Kawaii) above generate button
- Pass selected style to each portrait generation call
- Show style in generation results

### 4.4 Update `src/components/game/GraphicsSettingsPanel.tsx`
- Add "Portrait Style" section with link to PortraitStyleSettings dialog
- Add micro-interactions toggle

---

## Phase 5: Backend (~80 lines)

### 5.1 Update `supabase/functions/generate-cat-portrait/index.ts`
- Accept `style` field in request body (`'realistic' | 'kawaii'`, default `'kawaii'`)
- Add `REALISTIC_STYLE_PROMPT` alongside existing `STYLE_PROMPT` (rename to `KAWAII_STYLE_PROMPT`)
- Realistic prompt: "Photorealistic digital painting, semi-realistic cat portrait, detailed fur rendering, natural proportions, soft studio lighting, shallow depth of field, professional pet photography style"
- Select prompt based on style parameter

---

## Phase 6: Polish

- Cross-fade transitions on portrait load (300ms opacity)
- Hover zoom effects on all portrait containers
- Test `prefers-reduced-motion` disables all animations
- Performance: animations use CSS transforms only (GPU-accelerated), no layout thrash

---

## Animation Spec Summary

| Animation | Style | Type | Duration | Trigger |
|-----------|-------|------|----------|---------|
| Breathing | Kawaii | CSS scale | 2s loop | Continuous |
| Ear Twitch | Kawaii | CSS rotate | 0.3s | Random 3-5s |
| Blink | Both | Lottie | 0.15-0.2s | Random 4-8s |
| Whisker Flicker | Both | CSS | 0.15s | Synced with blink |
| Head Tilt | Realistic | CSS rotate | 4s loop | Continuous |
| Hover Zoom | Both | CSS | 0.2s | Mouse enter |

---

## Files Summary

| Action | File | Est. Lines |
|--------|------|-----------|
| New | `src/config/portraitSettings.ts` | ~60 |
| New | `src/hooks/usePortraitStyle.ts` | ~120 |
| New | `src/hooks/useMicroAnimations.ts` | ~150 |
| New | `src/components/game/AnimatedCatPortrait.tsx` | ~100 |
| New | `src/components/game/PortraitStyleSettings.tsx` | ~150 |
| New | `public/animations/kawaii-blink.json` | asset |
| New | `public/animations/realistic-blink.json` | asset |
| Edit | `src/types/game.ts` | ~5 |
| Edit | `src/config/graphics.ts` | ~10 |
| Edit | `src/hooks/useGraphicsSettings.ts` | ~15 |
| Edit | `src/lib/portraitUtils.ts` | ~10 |
| Edit | `src/lib/catVectorGenerator.ts` | ~200 |
| Edit | `src/components/game/PaperCatAvatar.tsx` | ~30 |
| Edit | `src/components/game/CatVisual.tsx` | ~30 |
| Edit | `src/components/game/CatPortrait.tsx` | ~80 |
| Edit | `src/components/game/BatchPortraitGenerator.tsx` | ~40 |
| Edit | `src/components/game/GraphicsSettingsPanel.tsx` | ~30 |
| Edit | `supabase/functions/generate-cat-portrait/index.ts` | ~80 |
| Edit | `tailwind.config.ts` | ~20 |

**Total: ~1,150 lines across 19 files**

**New dependency: `lottie-react`**

