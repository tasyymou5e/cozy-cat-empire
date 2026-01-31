# Sound System Integration Plan

## Executive Summary

Replace procedural/synthesized audio in `SoundContext.tsx` with real cat sounds from `public/sounds/`, create a sound mapping configuration file, and document the complete sound system logic.

---

## Current State Analysis

### Existing Sound Architecture

The current sound system in `SoundContext.tsx` uses **Web Audio API oscillators** to generate synthesized sounds:

```typescript
// Current approach - procedural audio
SOUND_CONFIGS: Record<SoundType, SoundConfig | SoundConfig[]> = {
  meow: [
    { frequency: 600, type: 'sine', duration: 0.15, volume: 0.25, ramp: 'up' },
    { frequency: 450, type: 'sine', duration: 0.2, volume: 0.2, ramp: 'down' },
  ],
  purr: { frequency: 25, type: 'sine', duration: 0.5, volume: 0.1, harmonics: [50, 75] },
  // ... 30+ more synthesized sounds
}
```

### Available Real Audio Files

15 high-quality audio files in `public/sounds/`:

| Category | Files |
|----------|-------|
| Meows (10) | cat-meow.mp3, cute-cat-meow.mp3, cat-attention-meow.wav, etc. |
| Moods (4) | cat-purr.wav, cat-angry-meow.wav, cat-pain-meow.wav, etc. |
| Special (1) | lion-roar.wav |

### Sound Types Used (56 total)

From `SoundType` union: click, success, error, meow, purr, hiss, friendship, rivalry, levelUp, coin, achievement, nextDay, cardFlip, moodHappy, moodSad, dailyEvent, challengeProgress, challengeComplete, heartBurst, sparkClash, catEating, catPlaying, catSleeping, catGrooming, catExploring, catHunting, catStretching, catCuddling, catTraining, catMischief, catZoomies, catSunbathing, catBirdwatching, giftReceived, tradeReceived

---

## Implementation Plan

### Phase 1: Create Sound Configuration File

**File: `src/config/sounds.ts`**

This configuration maps each `SoundType` to either:
1. A real audio file path (primary approach)
2. Fallback synthesized config (for UI sounds like click, coin)

```typescript
// Sound source types
type AudioFileSound = {
  type: 'file';
  path: string;
  volume?: number;
};

type SynthesizedSound = {
  type: 'synth';
  config: SoundConfig | SoundConfig[];
};

type SoundSource = AudioFileSound | SynthesizedSound;

// Complete mapping
const SOUND_SOURCES: Record<SoundType, SoundSource> = {
  // Cat sounds → Real audio files
  meow: { type: 'file', path: '/sounds/cat-meow.mp3', volume: 0.6 },
  purr: { type: 'file', path: '/sounds/cat-purr.wav', volume: 0.5 },
  hiss: { type: 'file', path: '/sounds/cat-angry-meow.wav', volume: 0.5 },
  
  // Activity sounds → Real audio
  catEating: { type: 'file', path: '/sounds/cat-purr.wav', volume: 0.4 },
  catPlaying: { type: 'file', path: '/sounds/cute-cat-meow.mp3', volume: 0.5 },
  catSleeping: { type: 'file', path: '/sounds/cat-purr.wav', volume: 0.3 },
  
  // UI sounds → Keep synthesized (short, responsive)
  click: { type: 'synth', config: { frequency: 800, ... } },
  coin: { type: 'synth', config: [...] },
}
```

### Phase 2: Update SoundContext.tsx

#### 2.1 Add Audio File Playback Support

Add new capability to play real audio files alongside synthesized sounds:

```typescript
// Audio cache for preloaded files
const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map());

// Preload audio files on mount
useEffect(() => {
  AUDIO_FILE_PATHS.forEach(path => {
    const audio = new Audio(path);
    audio.preload = 'auto';
    audioCache.current.set(path, audio);
  });
}, []);

// New playback function
const playAudioFile = useCallback((path: string, volume: number) => {
  const audio = audioCache.current.get(path)?.cloneNode() as HTMLAudioElement 
    || new Audio(path);
  audio.volume = volume * volumeRef.current;
  audio.play().catch(() => {});
}, []);
```

#### 2.2 Update playSound Function

Modify to check sound source type and route accordingly:

```typescript
const playSound = useCallback((type: SoundType) => {
  if (!enabledRef.current) return;
  
  const source = SOUND_SOURCES[type];
  
  if (source.type === 'file') {
    playAudioFile(source.path, source.volume ?? 0.5);
  } else {
    // Existing synthesized playback
    playTone(source.config);
  }
}, [playAudioFile, playTone]);
```

### Phase 3: Sound Mapping Configuration

**Complete mapping table:**

| SoundType | Source Type | File/Config | Use Case |
|-----------|-------------|-------------|----------|
| meow | file | cat-meow.mp3 | General cat interaction |
| purr | file | cat-purr.wav | Happy cat, feeding |
| hiss | file | cat-angry-meow.wav | Rivalry, fights |
| friendship | file | cat-sweet-meow.wav | New friendships |
| rivalry | file | cat-angry-meow.wav | Negative relationships |
| moodHappy | file | cute-cat-meow.mp3 | Cat becomes happy |
| moodSad | file | cat-hungry-meow.wav | Cat becomes sad |
| catEating | file | cat-purr.wav | Activity popup |
| catPlaying | file | cute-cat-meow.mp3 | Activity popup |
| catSleeping | file | cat-purr.wav | Activity popup (soft) |
| catGrooming | file | cat-sweet-meow.wav | Activity popup |
| catExploring | file | cat-attention-meow.wav | Activity popup |
| catHunting | file | cat-meow.mp3 | Activity popup |
| catStretching | file | cat-purr.wav | Activity popup |
| catCuddling | file | cat-sweet-meow.wav | Activity popup |
| catTraining | file | cat-attention-meow.wav | Activity popup |
| catMischief | file | funny-cat-meow.mp3 | Activity popup |
| catZoomies | file | cute-cat-meow-2.mp3 | Activity popup |
| catSunbathing | file | cat-purr.wav | Activity popup |
| catBirdwatching | file | cat-attention-meow.wav | Activity popup |
| heartBurst | file | cat-sweet-meow.wav | Positive relationship |
| sparkClash | file | cat-angry-meow.wav | Negative relationship |
| giftReceived | file | cute-cat-meow.mp3 | Gift notification |
| tradeReceived | file | cat-attention-meow.wav | Trade notification |
| achievement | file | cat-purring-and-meow.mp3 | Unlock achievement |
| levelUp | file | lion-roar.wav | Major achievement |
| dailyEvent | file | cat-attention-meow.wav | Daily event popup |
| challengeProgress | file | cat-meow-fx.mp3 | Challenge update |
| challengeComplete | file | cat-purring-and-meow.mp3 | Challenge done |
| click | synth | {freq:800} | UI button clicks |
| success | synth | [523,659,784] | Action success |
| error | synth | {freq:200} | Error feedback |
| coin | synth | [1318,1568] | Money earned |
| nextDay | synth | [440,550] | Day advances |
| cardFlip | synth | [1200,800] | Card flip animation |

### Phase 4: Update useAuthSounds.ts

Replace Web Audio synthesized sounds with real audio files for the auth page:

```typescript
const AUTH_SOUNDS = {
  tabby: '/sounds/cat-meow.mp3',
  gray: '/sounds/cat-purr.wav', 
  white: '/sounds/cute-cat-meow.mp3',
  calico: '/sounds/cat-sweet-meow.wav',
};

const playCatSound = useCallback((type: CatSoundType) => {
  const audio = new Audio(AUTH_SOUNDS[type]);
  audio.volume = 0.4;
  audio.play().catch(() => {});
}, []);
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/config/sounds.ts` | CREATE | Sound source configuration and mappings |
| `src/contexts/SoundContext.tsx` | MODIFY | Add audio file playback, update playSound |
| `src/hooks/useAuthSounds.ts` | MODIFY | Use real audio files |
| `docs/SOUND_SYSTEM.md` | CREATE | Complete sound system documentation |

---

## Documentation: docs/SOUND_SYSTEM.md

Comprehensive knowledge document covering:

### 1. Architecture Overview
- SoundContext provider pattern
- Audio file vs synthesized sound routing
- Volume control system (SFX + music separate)

### 2. Sound Configuration (`src/config/sounds.ts`)
- SoundSource type definitions
- Complete mapping table
- How to add new sounds

### 3. Music System
- Mood-based ambient music (procedural)
- Chord progressions per mood
- Day/time cycle integration
- Celebration and tense triggers

### 4. Integration Points
- How panels/components use sounds
- useSound() hook usage examples
- useAuthSounds() for auth page

### 5. Audio File Management
- Preloading strategy
- Cache management
- Volume normalization

### 6. Extending the System
- Adding new sound types
- Adding new audio files
- Mapping sounds to events

---

## Technical Considerations

### Preloading Strategy

```typescript
// Preload critical sounds on app mount
const PRELOAD_SOUNDS = [
  '/sounds/cat-meow.mp3',
  '/sounds/cat-purr.wav',
  '/sounds/cute-cat-meow.mp3',
];

// Load on user interaction (for autoplay policy)
useEffect(() => {
  const preload = () => {
    PRELOAD_SOUNDS.forEach(path => {
      const audio = new Audio(path);
      audio.preload = 'auto';
    });
  };
  
  document.addEventListener('click', preload, { once: true });
  return () => document.removeEventListener('click', preload);
}, []);
```

### Volume Normalization

Different audio files may have different recorded volumes. The config includes optional volume multipliers:

```typescript
meow: { type: 'file', path: '/sounds/cat-meow.mp3', volume: 0.6 }
```

### Fallback Behavior

If audio file fails to load, the system should:
1. Log a warning (dev mode)
2. Silently continue (no user-facing error)
3. Future enhancement: fallback to synthesized sound

---

## Testing Checklist

| Test | Expected Result |
|------|-----------------|
| Play 'meow' sound | Hear real cat-meow.mp3 audio |
| Play 'click' sound | Hear synthesized click (unchanged) |
| Toggle sound off | All sounds muted |
| Adjust SFX volume | Real sounds respect volume |
| Activity popup appears | Real cat sound plays |
| Auth page cat hover | Real meow sounds play |
| Friendship formed | Sweet meow plays |
| Rivalry event | Angry meow plays |
| Achievement unlocked | Extended purr plays |
| Legendary event | Lion roar plays |

---

## Implementation Order

1. Create `src/config/sounds.ts` with complete mappings
2. Update `SoundContext.tsx` with dual playback system
3. Update `useAuthSounds.ts` to use real files
4. Create `docs/SOUND_SYSTEM.md` documentation
5. Test all sound triggers in-game
