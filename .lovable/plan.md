

# Fix Auth Background Prompts - Remove Cat References

## Problem Statement

The Auth page background uses AI-generated images that currently include cats baked into the image. However, cats are already rendered as a **separate interactive layer** via `AnimatedFarmCats.tsx`, creating a duplicate/inconsistent visual experience.

The background should show only the **landscape/farm scene** without any cats.

---

## Files Requiring Changes

### 1. `supabase/functions/generate-auth-background/index.ts`

Update the `SEASONAL_PROMPTS` object (lines 11-43) and `DEFAULT_PROMPT` (lines 45-53) to remove all cat references:

**Before (Spring example):**
```
"cute cats playing among the flowers"
```

**After:**
```
Remove the line entirely, or replace with:
"peaceful farm scene with no animals visible"
```

**All prompts to update:**
| Season | Current Cat Reference | Action |
|--------|----------------------|--------|
| Spring | "cute cats playing among the flowers" | Remove |
| Summer | "cats playing in sprinklers" | Remove |
| Autumn | "cats playing in leaf piles" | Remove |
| Winter | "cats wearing tiny scarves, snowcats" | Remove |
| Default | "5-7 adorable cartoon cats playing and relaxing around the farm" | Remove |

**Add explicit no-cat instruction:**
```
"IMPORTANT: Do NOT include any cats, animals, or characters in this scene. 
This is a pure landscape/environment background only."
```

### 2. `src/lib/seasonUtils.ts`

Update the `SEASONAL_PROMPTS` export (lines 13-40) with the same changes to keep consistency. This file is used for client-side reference.

---

## Updated Prompt Examples

### Spring (Updated)
```
Create a bright, cheerful, kawaii-style cartoon cat farm landscape in SPRING.
Features: cherry blossoms, colorful flowers blooming, soft pink and green colors,
butterflies, baby chicks among the flowers.
Pastel colors, gentle rolling hills, cute red barn, white picket fences.
Style: clean vector illustration, minimal detail, soft gradients.
Wide panoramic 16:9 aspect ratio view suitable for a desktop background.
IMPORTANT: Do NOT include any cats or animals in this scene. Pure landscape only.
Ultra high resolution.
```

### Winter (Updated)
```
Create a magical, cozy, kawaii-style cartoon cat farm landscape in WINTER.
Features: gentle snow falling, snowman, warm lights from barn windows,
snowflakes, pine trees with snow.
Soft blue and white colors with warm orange glows from windows.
Style: clean vector illustration, minimal detail, soft gradients.
Wide panoramic 16:9 aspect ratio view suitable for a desktop background.
IMPORTANT: Do NOT include any cats or animals in this scene. Pure landscape only.
Ultra high resolution.
```

---

## Existing Cache Invalidation

After updating the prompts, existing cached backgrounds will need regeneration. The system already handles this:

1. `useAuthBackground.ts` uses season-based cache keys: `auth-background-${season}-v1.png`
2. Increment the version suffix to `v2` OR
3. Users can trigger `regenerate()` to force new generation

**Recommended approach:** Change the cache key version from `v1` to `v2` in both:
- `supabase/functions/generate-auth-background/index.ts` line 55
- `src/hooks/useAuthBackground.ts` lines 4-5

---

## Documentation Update

### Update `docs/EMPIRE_AI_RENDERING.md`

Add a section clarifying the distinction:

```markdown
## Auth Background vs Empire Render

| Feature | Auth Background | Empire Render |
|---------|----------------|---------------|
| **Purpose** | Login/signup page backdrop | Main game Empire view |
| **Cats** | ❌ No cats (landscape only) | ✅ All player cats included |
| **Cost** | Free (cached) | 20,000 credits |
| **Interactive Cats** | `AnimatedFarmCats.tsx` overlay | `RoamingCat.tsx` overlay |
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `supabase/functions/generate-auth-background/index.ts` | Remove cat references from all 4 seasonal prompts + default prompt, add "no cats" instruction |
| `src/lib/seasonUtils.ts` | Remove cat references from all 4 seasonal prompts, add "no cats" instruction |
| `src/hooks/useAuthBackground.ts` | Update cache key version from `v1` to `v2` |
| `supabase/functions/generate-auth-background/index.ts` | Update `getBackgroundKey` version |
| `docs/EMPIRE_AI_RENDERING.md` | Add section distinguishing auth background vs empire render |

---

## Technical Notes

- Empire scene rendering (`generate-empire-scene`) is **not affected** - cats are intentionally included there
- The `AnimatedFarmCats.tsx` component will continue to render interactive animated cats on top of the static background
- After deployment, existing cached backgrounds will serve until cache expires (7 days) or users force regenerate

