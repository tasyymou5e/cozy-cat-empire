# Cat Farm - Sound System

## Overview

The Cat Farm sound system provides immersive audio through a combination of real cat audio files and synthesized UI sounds. The system is built on the Web Audio API with a unified provider pattern.

---

## Architecture

### Provider Pattern

```
SoundProvider (src/contexts/SoundContext.tsx)
    │
    ├── playSound(type) ─────► SOUND_SOURCES mapping
    │                              │
    │                              ├── 'file' → Audio file playback
    │                              │
    │                              └── 'synth' → Oscillator playback
    │
    ├── Music System ───────► Procedural chord progressions
    │
    └── Volume Controls ────► SFX (0-1) + Music (0-0.3)
```

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| SoundProvider | `src/contexts/SoundContext.tsx` | Main audio provider |
| Sound Config | `src/config/sounds.ts` | Sound type → source mapping |
| useSound | `src/contexts/SoundContext.tsx` | Hook to access sound system |
| useAuthSounds | `src/hooks/useAuthSounds.ts` | Auth page cat sounds |

---

## Sound Configuration

### File: `src/config/sounds.ts`

The configuration file maps each `SoundType` to either:

1. **Audio File** - Real cat sounds from `public/sounds/`
2. **Synthesized** - Web Audio oscillator-based sounds

### Sound Source Types

```typescript
// Audio file source
interface AudioFileSound {
  type: 'file';
  path: string;       // e.g., '/sounds/cat-meow.mp3'
  volume?: number;    // 0-1, default 0.5
}

// Synthesized source
interface SynthesizedSound {
  type: 'synth';
  config: SynthSoundConfig | SynthSoundConfig[];
}
```

### Complete Sound Mapping

| SoundType | Source | File/Config | Use Case |
|-----------|--------|-------------|----------|
| meow | file | cat-meow.mp3 | General cat interaction |
| purr | file | cat-purr.wav | Happy cat, contentment |
| hiss | file | cat-angry-meow.wav | Rivalry, fights |
| friendship | file | cat-sweet-meow.wav | New friendships |
| rivalry | file | cat-angry-meow.wav | Negative relationships |
| moodHappy | file | cute-cat-meow.mp3 | Cat becomes happy |
| moodSad | file | cat-hungry-meow.wav | Cat becomes sad |
| catEating | file | cat-purr.wav | Eating activity |
| catPlaying | file | cute-cat-meow.mp3 | Playing activity |
| catSleeping | file | cat-purr.wav | Sleeping (soft) |
| catGrooming | file | cat-sweet-meow.wav | Grooming activity |
| catExploring | file | cat-attention-meow.wav | Exploring activity |
| catHunting | file | cat-meow.mp3 | Hunting activity |
| catStretching | file | cat-purr.wav | Stretching activity |
| catCuddling | file | cat-sweet-meow.wav | Cuddling activity |
| catTraining | file | cat-attention-meow.wav | Training activity |
| catMischief | file | funny-cat-meow.mp3 | Mischief activity |
| catZoomies | file | cute-cat-meow-2.mp3 | Zoomies activity |
| catSunbathing | file | cat-purr.wav | Sunbathing activity |
| catBirdwatching | file | cat-attention-meow.wav | Birdwatching activity |
| heartBurst | file | cat-sweet-meow.wav | Positive relationship burst |
| sparkClash | file | cat-angry-meow.wav | Negative relationship clash |
| giftReceived | file | cute-cat-meow.mp3 | Gift notification |
| tradeReceived | file | cat-attention-meow.wav | Trade notification |
| achievement | file | cat-purring-and-meow.mp3 | Achievement unlock |
| levelUp | file | lion-roar.wav | Major achievement |
| dailyEvent | file | cat-attention-meow.wav | Daily event popup |
| challengeProgress | file | cat-meow-fx.mp3 | Challenge update |
| challengeComplete | file | cat-purring-and-meow.mp3 | Challenge done |
| click | synth | freq: 800Hz | UI button clicks |
| success | synth | 523→659→784Hz | Action success |
| error | synth | freq: 200Hz | Error feedback |
| coin | synth | 1318→1568Hz | Money earned |
| nextDay | synth | 440→550Hz | Day advances |
| cardFlip | synth | 1200→800Hz | Card flip animation |

---

## Music System

### Mood-Based Ambient Music

The music system generates procedural ambient music using chord progressions that change based on game state.

### Music Moods

| Mood | Tempo | Brightness | Trigger |
|------|-------|------------|---------|
| morning | 0.08 | 1.2 | Day % 4 == 0 |
| afternoon | 0.10 | 1.0 | Day % 4 == 1 |
| evening | 0.06 | 0.8 | Day % 4 == 2 |
| night | 0.04 | 0.6 | Day % 4 == 3 |
| celebration | 0.15 | 1.5 | Achievement/win (10s) |
| tense | 0.12 | 0.5 | Negative event (6s) |

### Chord Progressions

Each mood has a 4-chord progression that cycles every 8 seconds:

```typescript
// Example: Morning mood
chords: [
  [130.81, 164.81, 196.0, 246.94],  // Cmaj7
  [146.83, 174.61, 220.0, 261.63],  // Dm7
  [164.81, 196.0, 246.94, 293.66],  // Em7
  [174.61, 220.0, 261.63, 329.63],  // Fmaj7
]
```

---

## Integration Points

### Using Sounds in Components

```typescript
import { useSound } from '@/contexts/SoundContext';

function GameComponent() {
  const { playSound, startMusic, stopMusic } = useSound();
  
  // Play a sound effect
  const handleClick = () => {
    playSound('meow');
  };
  
  // Start ambient music
  useEffect(() => {
    startMusic('morning');
    return () => stopMusic();
  }, []);
  
  return <button onClick={handleClick}>Pet Cat</button>;
}
```

### Audio Handler Integration

The `useAudioHandlers` hook manages:
- Music mood updates based on day cycle
- Confetti + celebration sounds on achievements
- Tense mood triggers on negative events

```typescript
// From src/hooks/handlers/useAudioHandlers.ts
useEffect(() => {
  if (ui.musicOn) {
    sound.updateMusicForDay(state.day);
    ui.setCurrentMoodLabel(MOOD_LABELS[sound.getCurrentMood()]);
  }
}, [state.day, ui.musicOn]);
```

### Auth Page Sounds

The auth page uses dedicated `useAuthSounds` hook:

```typescript
import { useAuthSounds } from '@/hooks/useAuthSounds';

function AuthCat({ type }) {
  const { playCatSound } = useAuthSounds();
  
  return (
    <div onClick={() => playCatSound(type)}>
      {/* Cat avatar */}
    </div>
  );
}
```

---

## Audio File Management

### Preloading Strategy

Critical sounds are preloaded on first user interaction:

```typescript
export const PRELOAD_SOUNDS = [
  '/sounds/cat-meow.mp3',
  '/sounds/cat-purr.wav',
  '/sounds/cute-cat-meow.mp3',
  '/sounds/cat-attention-meow.wav',
];
```

### Audio Cache

The SoundContext maintains an audio cache for instant playback:

```typescript
const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map());

// Preload on first interaction
useEffect(() => {
  const preload = () => {
    PRELOAD_SOUNDS.forEach(path => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audioCache.current.set(path, audio);
    });
  };
  document.addEventListener('click', preload, { once: true });
}, []);
```

### Volume Normalization

Each sound has an optional volume multiplier to normalize loudness:

```typescript
meow: { type: 'file', path: '/sounds/cat-meow.mp3', volume: 0.6 }
```

The final volume is: `source.volume × volumeRef.current`

---

## Extending the System

### Adding New Sound Types

1. Add the type to `SoundType` in `SoundContext.tsx`:

```typescript
export type SoundType =
  | 'click'
  | 'newSoundType'  // Add here
  // ...
```

2. Add the mapping in `src/config/sounds.ts`:

```typescript
export const SOUND_SOURCES: Record<SoundType, SoundSource> = {
  // ...
  newSoundType: { type: 'file', path: '/sounds/new-sound.mp3', volume: 0.5 },
};
```

### Adding New Audio Files

1. Add the file to `public/sounds/`
2. Add the path to `AUDIO_FILE_PATHS` in `src/config/sounds.ts`
3. (Optional) Add to `PRELOAD_SOUNDS` if critical

### Sound Categories

| Category | Sound Types | Approach |
|----------|------------|----------|
| Cat Vocalizations | meow, purr, hiss | Real audio files |
| Cat Activities | catEating, catPlaying, etc. | Real audio files |
| Relationships | friendship, rivalry, etc. | Real audio files |
| Notifications | giftReceived, tradeReceived | Real audio files |
| Achievements | achievement, levelUp | Real audio files |
| UI Feedback | click, success, error, coin | Synthesized |

---

## Audio Files Reference

See [SOUND_LIBRARY.md](./SOUND_LIBRARY.md) for complete file catalog.

### File Formats

| Format | Count | Notes |
|--------|-------|-------|
| MP3 | 6 | Compressed, smaller size |
| WAV | 9 | Uncompressed, higher quality |

---

## Browser Compatibility

### Autoplay Policy

Modern browsers block autoplay. The system handles this by:

1. Resuming AudioContext on user interaction
2. Preloading sounds after first click
3. Catching and ignoring play() errors

### Fallback Behavior

If audio file fails to load:
1. Console warning in development
2. Silent failure in production
3. No user-facing error

---

## Volume Controls

### SFX Volume

```typescript
const { setVolume, getVolume } = useSound();
setVolume(0.5);  // 0-1 range
```

### Music Volume

```typescript
const { setMusicVolume } = useSound();
setMusicVolume(0.15);  // 0-0.3 range
```

---

## Testing Checklist

| Test | Expected Result |
|------|-----------------|
| Play 'meow' sound | Hear real cat-meow.mp3 |
| Play 'click' sound | Hear synthesized click |
| Toggle sound off | All sounds muted |
| Adjust SFX volume | Sounds respect volume |
| Activity popup | Real cat sound plays |
| Auth page cat click | Real meow plays |
| Friendship formed | Sweet meow plays |
| Rivalry event | Angry meow plays |
| Achievement unlocked | Purr+meow plays |
| Legendary event | Lion roar plays |
