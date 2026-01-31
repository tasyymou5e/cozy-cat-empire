

# Sound System Cleanup - Remove Legacy Code

## Overview

The sound system integration is **already complete**. The `SoundContext.tsx` properly routes sounds through `SOUND_SOURCES` from `src/config/sounds.ts`. However, there's leftover legacy code that should be removed for cleanliness.

---

## Current State (Already Working)

The integration is functional:
- Real cat sounds play for vocalizations, activities, relationships
- Synthesized sounds play for UI feedback (clicks, coins)
- Preloading works on first user interaction
- Volume controls apply correctly

---

## Cleanup Task

### Remove Unused Legacy Code

**File: `src/contexts/SoundContext.tsx`**

Remove the unused `SOUND_CONFIGS` object (lines 181-336) since:
- `playSound()` now uses `SOUND_SOURCES` from config file
- All sound type definitions are in `src/config/sounds.ts`
- This legacy object is ~150 lines of dead code

### Before (current)
```typescript
// Lines 181-336 - UNUSED legacy synthesized configs
const SOUND_CONFIGS: Record<SoundType, SoundConfig | SoundConfig[]> = {
  click: { frequency: 800, type: 'sine', ... },
  meow: [ { frequency: 600, ... }, { frequency: 450, ... } ],
  // ... 30+ more unused definitions
};
```

### After (clean)
```typescript
// Removed - all sound routing now uses SOUND_SOURCES from config/sounds.ts
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/contexts/SoundContext.tsx` | Remove unused `SOUND_CONFIGS` object (~150 lines) |

---

## Benefits

- **Cleaner code**: Remove 150+ lines of dead code
- **Single source of truth**: All sound mappings in `src/config/sounds.ts`
- **No behavior change**: System already uses `SOUND_SOURCES`
- **Easier maintenance**: One place to modify sound mappings

---

## Technical Notes

The `SoundConfig` interface (lines 74-81) should be kept as it's used by:
- `playTone()` function for synthesized sounds
- The `SynthSoundConfig` type in config file

The system already works correctly - this is purely a cleanup task.

