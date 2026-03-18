

# Fix: Remove Pulsing, Keep Eyes-Only Blink

## Problem
The `animate-kawaii-breathe` (scale pulse) and `animate-realistic-head-tilt` (rotation) CSS classes are applied to the entire portrait container, making the whole image visually pulse/tilt. The user wants only subtle eye blinks, not whole-image motion.

## Changes

### 1. Remove continuous animation classes
**File: `src/hooks/useMicroAnimations.ts`**
- Remove `continuousClass` return value (or return empty string always)
- The breathing scale and head-tilt rotation are what cause the "pulsing" effect
- Keep blink timing, whisker flicker, and ear twitch logic intact

### 2. Replace Lottie blink with CSS eye-closing overlay
**File: `src/components/game/AnimatedCatPortrait.tsx`**
- Remove the Lottie import and blink overlay entirely (the generic Lottie ellipses don't align with AI-generated portrait eyes)
- Replace with a CSS-based blink effect: a thin horizontal strip (~15% height) positioned at roughly eye level (~35% from top) that briefly fades in with a skin-tone/dark opacity, simulating eyelids closing
- This works on any portrait image without needing precise eye coordinates

### 3. Add CSS blink keyframe
**File: `tailwind.config.ts`**
- Add `cat-eye-blink` keyframe: opacity 0 -> 0.85 -> 0 over ~200ms
- The overlay div uses this animation class when `isBlinking` is true

### 4. Clean up unused Lottie dependency (optional)
- If Lottie is not used elsewhere, it can remain lazy-loaded for future use
- Remove the fetch of blink JSON files from AnimatedCatPortrait

## Result
- No more whole-image pulsing
- Subtle eye-area blink every 4-8s (randomized per cat)
- Whisker flicker still synced to blink
- Ear twitch still fires for kawaii style
- `prefers-reduced-motion` still respected

