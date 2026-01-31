
# Sound Library Documentation

## Overview

Create a new documentation file `docs/SOUND_LIBRARY.md` that catalogs all audio files in the `public/sounds/` folder with their names, suggested use cases, and format information.

---

## Sound File Inventory

The `public/sounds/` directory contains **15 audio files**:

### Cat Meow Sounds (10 files)

| File Name | Format | Suggested Use |
|-----------|--------|---------------|
| `cat-meow.mp3` | MP3 | General meow, neutral tone |
| `cat-meow-fx.mp3` | MP3 | Sound effect style meow |
| `cute-cat-meow.mp3` | MP3 | Happy/friendly interactions |
| `cute-cat-meow-2.mp3` | MP3 | Alternate cute meow variant |
| `funny-cat-meow.mp3` | MP3 | Comedic moments, surprises |
| `cat-little-meow.wav` | WAV | Kitten sounds, small cats |
| `cat-sweet-meow.wav` | WAV | Affectionate interactions |
| `cat-attention-meow.wav` | WAV | Notifications, alerts |
| `cat-begging-meow.wav` | WAV | Hunger alerts, feeding time |
| `cat-hungry-meow.wav` | WAV | Low hunger state warning |

### Cat Mood Sounds (4 files)

| File Name | Format | Suggested Use |
|-----------|--------|---------------|
| `cat-purr.wav` | WAV | Happy state, contentment |
| `cat-purring-and-meow.mp3` | MP3 | Extended happy interaction |
| `cat-angry-meow.wav` | WAV | Rivalry events, negative interactions |
| `cat-pain-meow.wav` | WAV | Low health, sick state |

### Special Sounds (1 file)

| File Name | Format | Suggested Use |
|-----------|--------|---------------|
| `lion-roar.wav` | WAV | Legendary cat events, achievements |

---

## Implementation

### File to Create

| File | Description |
|------|-------------|
| `docs/SOUND_LIBRARY.md` | Complete sound file documentation |

### Document Contents

```markdown
# Cat Farm - Sound Library

## Overview
This document catalogs all audio files available in `public/sounds/` for use 
throughout the Cat Farm game.

## Directory Structure
```
public/sounds/
├── cat-angry-meow.wav
├── cat-attention-meow.wav
├── cat-begging-meow.wav
├── cat-hungry-meow.wav
├── cat-little-meow.wav
├── cat-meow-fx.mp3
├── cat-meow.mp3
├── cat-pain-meow.wav
├── cat-purr.wav
├── cat-purring-and-meow.mp3
├── cat-sweet-meow.wav
├── cute-cat-meow-2.mp3
├── cute-cat-meow.mp3
├── funny-cat-meow.mp3
└── lion-roar.wav
```

## Sound Categories

### Meow Variations
- **cat-meow.mp3** - Standard meow for general use
- **cat-meow-fx.mp3** - Sound effect style meow
- **cute-cat-meow.mp3** - Cute meow for positive events
- **cute-cat-meow-2.mp3** - Alternate cute meow
- **funny-cat-meow.mp3** - Comedic/surprised meow
- **cat-little-meow.wav** - Small/kitten meow
- **cat-sweet-meow.wav** - Gentle, affectionate meow
- **cat-attention-meow.wav** - Alert/notification meow
- **cat-begging-meow.wav** - Hungry/begging sound
- **cat-hungry-meow.wav** - Hunger warning sound

### Mood Sounds
- **cat-purr.wav** - Contentment purr (short)
- **cat-purring-and-meow.mp3** - Extended purr with meow
- **cat-angry-meow.wav** - Angry/upset sound
- **cat-pain-meow.wav** - Pain/distress sound

### Special Effects
- **lion-roar.wav** - Epic roar for legendary events

## Suggested Event Mappings

| Game Event | Recommended Sound |
|------------|-------------------|
| Cat adopted | cute-cat-meow.mp3 |
| Cat fed | cat-purr.wav |
| Cat happy | cat-sweet-meow.wav |
| Cat hungry | cat-hungry-meow.wav |
| Cat sick | cat-pain-meow.wav |
| Cat rivalry | cat-angry-meow.wav |
| Kitten born | cat-little-meow.wav |
| Notification | cat-attention-meow.wav |
| Show win | cat-purring-and-meow.mp3 |
| Legendary achievement | lion-roar.wav |
| Button click | cat-meow-fx.mp3 |
| Funny moment | funny-cat-meow.mp3 |

## Usage in Code

### Import path
```typescript
const soundPath = '/sounds/cat-meow.mp3';
```

### With Audio API
```typescript
const audio = new Audio('/sounds/cat-purr.wav');
audio.volume = 0.5;
audio.play();
```

### Integration Points
- `src/hooks/useAuthSounds.ts` - Authentication page sounds
- `src/hooks/handlers/useAudioHandlers.ts` - Game audio controls
- `src/contexts/SoundContext.tsx` - Sound provider context

## File Formats

| Format | Count | Notes |
|--------|-------|-------|
| MP3 | 6 | Compressed, smaller file size |
| WAV | 9 | Uncompressed, higher quality |

## Total Files: 15
```

---

## Notes

- All paths use `/sounds/` prefix when accessed from the browser
- WAV files provide higher quality but larger file size
- MP3 files are compressed for faster loading
- Consider preloading critical sounds for instant playback
