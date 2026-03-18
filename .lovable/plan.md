

# Gap Fixes for Cat Image Style Selection

## Analysis

Most keyframes already exist in `tailwind.config.ts` (cat-eye-blink, whisker-flicker, kawaii-ear-twitch, realistic-head-tilt, kawaii-breathe). What's missing:

1. **Hover zoom CSS class** (`.cat-portrait-hover`) — not defined anywhere
2. **Default style** — currently `'kawaii'`, plan says change to `'realistic'`
3. **`preferPaperAvatar` option** — missing from graphics config
4. **`continuousClass`** — currently hardcoded to `''` (was disabled to fix pulsing); plan wants to re-enable head-tilt/breathing

> **Note**: Re-enabling `continuousClass` will bring back the head-tilt (realistic) and breathing (kawaii) continuous animations that were previously disabled because the user reported "images just pulse." The plan explicitly requests this, so proceeding as specified.

## Changes

### 1. `src/index.css` (~20 lines after line 1188)
- Add `.cat-portrait-hover` class with `transform: scale(1.1)` on hover, bounce easing, and box-shadow lift

### 2. `src/config/graphics.ts` (2 edits)
- Line 115: Change `defaultPortraitStyle` from `'kawaii'` to `'realistic'`
- After line 115: Add `preferPaperAvatar: false` option

### 3. `src/hooks/useMicroAnimations.ts` (line 88-89)
- Change `continuousClass` from `''` to:
  - `'animate-realistic-head-tilt'` for realistic style
  - `'animate-cat-breathe'` for kawaii style

### 4. `src/hooks/useGraphicsSettings.ts`
- Add `preferPaperAvatar: boolean` to `GraphicsSettings` interface and defaults

No index.css keyframe additions needed — they already exist in tailwind.config.ts.

**3 files modified, ~25 lines changed.**

