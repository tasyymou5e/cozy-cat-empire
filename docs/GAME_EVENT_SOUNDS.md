# Cat Farm - Game Event Sound Mapping

## Overview

The game event sound mapping system provides a centralized configuration for mapping game events to their corresponding sounds. Located in `src/config/gameEventSounds.ts`, it complements `src/config/sounds.ts` by providing the reverse mapping: **GameEvent → SoundType**.

This enables automatic sound triggering through the game event dispatcher (`useGameEvents`), eliminating the need for manual sound calls in individual components.

---

## Architecture

### Sound System Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         GAME EVENT TRIGGERS                               │
│  (actions, activities, notifications, achievements, UI interactions)     │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│              src/config/gameEventSounds.ts                                │
│              GameEvent → SoundType mapping                                │
│                                                                          │
│  GAME_ACTION_SOUNDS    │  ACTIVITY_SOUNDS    │  RELATIONSHIP_SOUNDS     │
│  NOTIFICATION_SOUNDS   │  ACHIEVEMENT_SOUNDS │  UI_SOUNDS               │
│  MOOD_SOUNDS          │  EMPIRE_SOUNDS       │                          │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│              src/config/sounds.ts                                         │
│              SoundType → AudioSource mapping                              │
│                                                                          │
│  'catEating' → { type: 'file', path: '/sounds/cat-purr.wav' }           │
│  'coin'      → { type: 'synth', config: [...] }                         │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│              SoundContext.tsx                                             │
│              playSound(SoundType) → Audio output                         │
└──────────────────────────────────────────────────────────────────────────┘
```

### Before & After Refactoring

**Before** (scattered, inline mappings):
```
CatActivityPopups.tsx ──► inline ACTIVITY_SOUNDS ──► playSound()
ChorePanel.tsx        ──► manual playSound('coin')
TrainingPanel.tsx     ──► manual playSound('catTraining')
```

**After** (centralized, automatic):
```
useGameEvents.ts ──► dispatchAction('DO_CHORE') 
                        │
                        ├──► Execute action
                        ├──► Apply side effects
                        └──► getSoundForAction() ──► playSound()
```

---

## Configuration File Reference

**Location:** `src/config/gameEventSounds.ts`

### Exported Constants

| Constant | Type | Description |
|----------|------|-------------|
| `GAME_ACTION_SOUNDS` | `Partial<Record<GameAction, SoundType>>` | Maps game actions to sounds |
| `ACTIVITY_SOUNDS` | `Record<string, SoundType>` | Maps cat activity popups to sounds |
| `RELATIONSHIP_SOUNDS` | `const object` | Maps relationship events to sounds |
| `NOTIFICATION_SOUNDS` | `const object` | Maps player notifications to sounds |
| `ACHIEVEMENT_SOUNDS` | `const object` | Maps achievements/rewards to sounds |
| `UI_SOUNDS` | `const object` | Maps UI interactions to sounds |
| `MOOD_SOUNDS` | `const object` | Maps cat mood changes to sounds |
| `EMPIRE_SOUNDS` | `const object` | Maps Empire view interactions to sounds |

---

## Integration with useGameEvents

The `useGameEvents` hook accepts an optional `playSound` function and automatically triggers sounds when actions are dispatched.

### Configuration Interface

```typescript
interface UseGameEventsConfig {
  actions: { /* game action handlers */ };
  trackObjective: (type: ObjectiveType, amount?: number) => void;
  addBattlePassXP: (source: XPSource) => void;
  updateCoopProgress: (type: CoopChallengeType, amount: number) => void;
  /** Optional sound player for automatic sound triggering */
  playSound?: (sound: SoundType) => void;
}
```

### Usage Example

```typescript
import { useSound } from '@/contexts/SoundContext';
import { useGameEvents } from '@/hooks/useGameEvents';

function GameComponent() {
  const { playSound } = useSound();
  
  const { dispatchAction } = useGameEvents({
    actions,
    trackObjective,
    addBattlePassXP,
    updateCoopProgress,
    playSound, // Pass the sound player
  });

  // Sound plays automatically when action dispatches
  const handleFeed = () => {
    dispatchAction('FEED_CATS'); // Plays 'catEating' sound
  };

  const handleTrain = () => {
    dispatchAction('TRAIN_CAT', { catId, trickId }); // Plays 'catTraining' sound
  };
}
```

---

## Complete Event-to-Sound Mapping Table

### Game Actions

| Action | Sound Type | Audio Source |
|--------|------------|--------------|
| `FEED_CATS` | `catEating` | cat-purr.wav |
| `FEED_SINGLE_CAT` | `catEating` | cat-purr.wav |
| `DO_CHORE` | `coin` | synth |
| `BUY_RESOURCE` | `coin` | synth |
| `USE_MEDICINE` | `success` | synth |
| `USE_TOYS` | `catPlaying` | cute-cat-meow.mp3 |
| `COMFORT_CAT` | `purr` | cat-purr.wav |
| `SELL_CAT` | `coin` | synth |
| `TRAIN_CAT` | `catTraining` | cat-attention-meow.wav |
| `REST_CAT` | `catSleeping` | cat-purr.wav |
| `BREED_CATS` | `success` | synth |
| `SOCIALIZE_CATS` | `friendship` | cat-sweet-meow.wav |
| `GROUP_ACTIVITY` | `catPlaying` | cute-cat-meow.mp3 |
| `CAT_SHOW` | `achievement` | cat-purring-and-meow.mp3 |

### Cat Activities

| Activity | Sound Type | Audio Source |
|----------|------------|--------------|
| `eating` | `catEating` | cat-purr.wav |
| `playing` | `catPlaying` | cute-cat-meow.mp3 |
| `sleeping` | `catSleeping` | cat-purr.wav |
| `grooming` | `catGrooming` | cat-sweet-meow.wav |
| `exploring` | `catExploring` | cat-attention-meow.wav |
| `hunting` | `catHunting` | cat-meow.mp3 |
| `stretching` | `catStretching` | cat-purr.wav |
| `cuddling` | `catCuddling` | cat-sweet-meow.wav |
| `training` | `catTraining` | cat-attention-meow.wav |
| `mischief` | `catMischief` | funny-cat-meow.mp3 |
| `zoomies` | `catZoomies` | cute-cat-meow-2.mp3 |
| `sunbathing` | `catSunbathing` | cat-purr.wav |
| `birdwatching` | `catBirdwatching` | cat-attention-meow.wav |

### Relationships

| Event | Sound Type | Audio Source |
|-------|------------|--------------|
| `friendshipFormed` | `friendship` | cat-sweet-meow.wav |
| `friendshipStrengthened` | `heartBurst` | cat-sweet-meow.wav |
| `rivalryStarted` | `rivalry` | cat-angry-meow.wav |
| `rivalryWorsened` | `sparkClash` | cat-angry-meow.wav |
| `reconciliation` | `friendship` | cat-sweet-meow.wav |

### Notifications

| Event | Sound Type | Audio Source |
|-------|------------|--------------|
| `giftReceived` | `giftReceived` | cute-cat-meow.mp3 |
| `tradeReceived` | `tradeReceived` | cat-attention-meow.wav |
| `friendRequest` | `meow` | cat-meow.mp3 |
| `dailyEvent` | `dailyEvent` | cat-attention-meow.wav |
| `announcement` | `meow` | cat-meow.mp3 |

### Achievements

| Event | Sound Type | Audio Source |
|-------|------------|--------------|
| `unlock` | `achievement` | cat-purring-and-meow.mp3 |
| `milestone` | `levelUp` | lion-roar.wav |
| `challengeProgress` | `challengeProgress` | cat-meow-fx.mp3 |
| `challengeComplete` | `challengeComplete` | cat-purring-and-meow.mp3 |
| `dailyReward` | `coin` | synth |
| `weeklyReward` | `coin` | synth |

### UI Interactions

| Event | Sound Type | Audio Source |
|-------|------------|--------------|
| `buttonClick` | `click` | synth |
| `tabSwitch` | `click` | synth |
| `modalOpen` | `click` | synth |
| `modalClose` | `click` | synth |
| `cardFlip` | `cardFlip` | synth |
| `save` | `success` | synth |
| `error` | `error` | synth |
| `purchase` | `coin` | synth |
| `nextDay` | `nextDay` | synth |

### Mood Changes

| Event | Sound Type | Audio Source |
|-------|------------|--------------|
| `becameHappy` | `moodHappy` | cute-cat-meow.mp3 |
| `becameSad` | `moodSad` | cat-hungry-meow.wav |
| `becameAngry` | `hiss` | cat-angry-meow.wav |
| `becameContent` | `purr` | cat-purr.wav |

### Empire View

| Event | Sound Type | Audio Source |
|-------|------------|--------------|
| `petCat` | `purr` | cat-purr.wav |
| `feedCat` | `catEating` | cat-purr.wav |
| `playWithCat` | `catPlaying` | cute-cat-meow.mp3 |
| `catMeow` | `meow` | cat-meow.mp3 |
| `propInteraction` | `meow` | cat-meow.mp3 |

---

## Helper Functions

### `getSoundForAction(action)`

Returns the `SoundType` for a given `GameAction`, or `undefined` if not mapped.

```typescript
import { getSoundForAction } from '@/config/gameEventSounds';

const sound = getSoundForAction('TRAIN_CAT');
// Returns: 'catTraining'
```

### `getSoundForActivity(activity)`

Returns the `SoundType` for a given activity key, or `undefined` if not mapped.

```typescript
import { getSoundForActivity } from '@/config/gameEventSounds';

const sound = getSoundForActivity('zoomies');
// Returns: 'catZoomies'
```

---

## How to Extend

### Adding New Game Action Sounds

1. Add the `GameAction` to `src/types/gameEvents.ts` if new
2. Add the mapping in `GAME_ACTION_SOUNDS`:

```typescript
export const GAME_ACTION_SOUNDS: Partial<Record<GameAction, SoundType>> = {
  // ... existing mappings
  NEW_ACTION: 'existingSoundType',
};
```

### Adding New Activity Sounds

1. Ensure the `SoundType` exists in `src/config/sounds.ts`
2. Add the mapping in `ACTIVITY_SOUNDS`:

```typescript
export const ACTIVITY_SOUNDS: Record<string, SoundType> = {
  // ... existing mappings
  newActivity: 'soundType',
};
```

### Adding New Event Categories

1. Create a new exported constant:

```typescript
export const NEW_CATEGORY_SOUNDS = {
  eventOne: 'soundType1',
  eventTwo: 'soundType2',
} as const satisfies Record<string, SoundType>;
```

2. Optionally add a helper function:

```typescript
export function getSoundForNewCategory(event: string): SoundType | undefined {
  return NEW_CATEGORY_SOUNDS[event as keyof typeof NEW_CATEGORY_SOUNDS];
}
```

---

## Related Documentation

- [SOUND_SYSTEM.md](./SOUND_SYSTEM.md) - SoundType to AudioSource mapping
- [SOUND_LIBRARY.md](./SOUND_LIBRARY.md) - Available audio files
