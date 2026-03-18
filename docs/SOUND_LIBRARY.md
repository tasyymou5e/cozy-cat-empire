# Cat Farm - Sound Library

## Overview
This document catalogs all audio files available in `public/sounds/` for use throughout the Cat Farm game.

## Directory Structure
```
public/sounds/
├── cat-angry-cartoon.wav       (NEW - Mixkit)
├── cat-angry-hiss.wav          (NEW - Mixkit)
├── cat-angry-meow.wav
├── cat-attention-meow.wav
├── cat-begging-meow-2.wav      (NEW - Mixkit)
├── cat-begging-meow.wav
├── cat-growl.wav                (NEW - Mixkit)
├── cat-hungry-meow-2.wav       (NEW - Mixkit)
├── cat-hungry-meow.wav
├── cat-little-meow.wav
├── cat-meow-fx.mp3
├── cat-meow.mp3
├── cat-pain-meow-2.wav         (NEW - Mixkit)
├── cat-pain-meow.wav
├── cat-purr.wav
├── cat-purring-and-meow.mp3
├── cat-scary-roar.wav          (NEW - Mixkit)
├── cat-sweet-meow.wav
├── cat-wild-growl.wav           (NEW - Mixkit)
├── cat-wild-moan.wav            (NEW - Mixkit)
├── cute-cat-meow-2.mp3
├── cute-cat-meow.mp3
├── funny-cat-meow.mp3
├── kitten-meow.wav              (NEW - Mixkit)
├── lion-roar-wild.wav           (NEW - Mixkit)
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
| Cat training | cat-begging-meow.wav |
| Relationship clash | cat-pain-meow.wav |
| Cat chirp (synth) | Synthesized chirp tones |
| Cat trill (synth) | Synthesized trill sequence |
| Cat growl (synth) | Synthesized low growl |
| Cat yawn (synth) | Synthesized yawn sweep |
| Cat chattering (synth) | Rapid chattering sequence |
| Cat startled (synth) | Sharp startled sound |

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
| WAV | 20 | Uncompressed, higher quality |

## Total Files: 26

## Licensing
- Original 15 sounds: Various free sources
- 11 new sounds: [Mixkit](https://mixkit.co) royalty-free license
