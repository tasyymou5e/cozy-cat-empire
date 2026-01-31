

# Create Game Event Sound Mapping Configuration

## Overview

Create a centralized configuration file that maps game events (actions, notifications, achievements, etc.) to their corresponding sounds. This will complement the existing `src/config/sounds.ts` and enable automatic sound triggering through the game event dispatcher.

---

## Architecture Design

### Current State

```
┌─────────────────────────┐     ┌──────────────────────────┐
│ src/config/sounds.ts    │     │ CatActivityPopups.tsx    │
│ SoundType → AudioSource │     │ Activity → SoundType     │
└─────────────────────────┘     │ (inline, not reusable)   │
                                └──────────────────────────┘
         ↓
┌─────────────────────────┐
│ SoundContext.tsx        │
│ playSound(SoundType)    │
└─────────────────────────┘
```

### Proposed State

```
┌──────────────────────────────┐     ┌──────────────────────────┐
│ src/config/sounds.ts         │     │ src/config/gameEventSounds.ts │
│ SoundType → AudioSource      │     │ GameEvent → SoundType         │
└──────────────────────────────┘     └──────────────────────────┘
         ↓                                    ↓
┌──────────────────────────────────────────────────────────────┐
│ SoundContext.tsx + useGameEvents.ts                          │
│ Automatic sound routing based on game events                 │
└──────────────────────────────────────────────────────────────┘
```

---

## File to Create

### `src/config/gameEventSounds.ts`

Central mapping of game events to sounds, organized by category:

```typescript
import type { SoundType } from '@/contexts/SoundContext';
import type { GameAction } from '@/types/gameEvents';

// ========== GAME ACTION SOUNDS ==========
// Maps GameAction events to their corresponding sounds

export const GAME_ACTION_SOUNDS: Partial<Record<GameAction, SoundType>> = {
  FEED_CATS: 'catEating',
  FEED_SINGLE_CAT: 'catEating',
  DO_CHORE: 'coin',
  BUY_RESOURCE: 'coin',
  USE_MEDICINE: 'success',
  USE_TOYS: 'catPlaying',
  COMFORT_CAT: 'purr',
  SELL_CAT: 'coin',
  TRAIN_CAT: 'catTraining',
  REST_CAT: 'catSleeping',
  BREED_CATS: 'success',
  SOCIALIZE_CATS: 'friendship',
  GROUP_ACTIVITY: 'catPlaying',
  CAT_SHOW: 'achievement',
};

// ========== CAT ACTIVITY SOUNDS ==========
// Maps activity popup keys to sound types
// (Extracted from CatActivityPopups.tsx)

export const ACTIVITY_SOUNDS: Record<string, SoundType> = {
  eating: 'catEating',
  playing: 'catPlaying',
  sleeping: 'catSleeping',
  grooming: 'catGrooming',
  exploring: 'catExploring',
  hunting: 'catHunting',
  stretching: 'catStretching',
  cuddling: 'catCuddling',
  training: 'catTraining',
  mischief: 'catMischief',
  zoomies: 'catZoomies',
  sunbathing: 'catSunbathing',
  birdwatching: 'catBirdwatching',
};

// ========== RELATIONSHIP EVENT SOUNDS ==========
export const RELATIONSHIP_SOUNDS = {
  friendshipFormed: 'friendship',
  friendshipStrengthened: 'heartBurst',
  rivalryStarted: 'rivalry',
  rivalryWorsened: 'sparkClash',
  reconciliation: 'friendship',
} as const;

// ========== NOTIFICATION SOUNDS ==========
export const NOTIFICATION_SOUNDS = {
  giftReceived: 'giftReceived',
  tradeReceived: 'tradeReceived',
  friendRequest: 'meow',
  dailyEvent: 'dailyEvent',
  announcement: 'meow',
} as const;

// ========== ACHIEVEMENT SOUNDS ==========
export const ACHIEVEMENT_SOUNDS = {
  unlock: 'achievement',
  milestone: 'levelUp',
  challengeProgress: 'challengeProgress',
  challengeComplete: 'challengeComplete',
  dailyReward: 'coin',
  weeklyReward: 'coin',
} as const;

// ========== UI INTERACTION SOUNDS ==========
export const UI_SOUNDS = {
  buttonClick: 'click',
  tabSwitch: 'click',
  modalOpen: 'click',
  modalClose: 'click',
  cardFlip: 'cardFlip',
  save: 'success',
  error: 'error',
  purchase: 'coin',
  nextDay: 'nextDay',
} as const;

// ========== MOOD CHANGE SOUNDS ==========
export const MOOD_SOUNDS = {
  becameHappy: 'moodHappy',
  becameSad: 'moodSad',
  becameAngry: 'hiss',
  becameContent: 'purr',
} as const;

// ========== EMPIRE VIEW SOUNDS ==========
export const EMPIRE_SOUNDS = {
  petCat: 'purr',
  feedCat: 'catEating',
  playWithCat: 'catPlaying',
  catMeow: 'meow',
  propInteraction: 'meow',
} as const;

// ========== HELPER FUNCTIONS ==========

/**
 * Get sound for a game action
 */
export function getSoundForAction(action: GameAction): SoundType | undefined {
  return GAME_ACTION_SOUNDS[action];
}

/**
 * Get sound for an activity
 */
export function getSoundForActivity(activity: string): SoundType | undefined {
  return ACTIVITY_SOUNDS[activity];
}
```

---

## Files to Modify

### 1. Update `useGameEvents.ts`

Add automatic sound triggering in the dispatcher:

```typescript
import { getSoundForAction } from '@/config/gameEventSounds';

// In dispatchAction function:
const dispatchAction = useCallback(
  <A extends GameAction>(action: A, payload?: GameActionPayloads[A]) => {
    // 1. Execute the core game action
    // ... existing switch statement ...

    // 2. Apply all side effects
    // ... existing effects code ...

    // 3. NEW: Play action sound if configured
    const sound = getSoundForAction(action);
    if (sound) {
      playSound(sound);
    }
  },
  [actions, trackObjective, addBattlePassXP, updateCoopProgress, playSound]
);
```

### 2. Update `CatActivityPopups.tsx`

Import mapping from config instead of inline definition:

```typescript
import { ACTIVITY_SOUNDS } from '@/config/gameEventSounds';

// Remove inline ACTIVITY_SOUNDS constant (lines 104-118)
```

---

## Complete Event-to-Sound Mapping Table

| Category | Event | Sound Type | Audio Source |
|----------|-------|------------|--------------|
| **Game Actions** | FEED_CATS | catEating | cat-purr.wav |
| | FEED_SINGLE_CAT | catEating | cat-purr.wav |
| | DO_CHORE | coin | synth |
| | BUY_RESOURCE | coin | synth |
| | USE_MEDICINE | success | synth |
| | USE_TOYS | catPlaying | cute-cat-meow.mp3 |
| | COMFORT_CAT | purr | cat-purr.wav |
| | SELL_CAT | coin | synth |
| | TRAIN_CAT | catTraining | cat-attention-meow.wav |
| | REST_CAT | catSleeping | cat-purr.wav |
| | BREED_CATS | success | synth |
| | SOCIALIZE_CATS | friendship | cat-sweet-meow.wav |
| | GROUP_ACTIVITY | catPlaying | cute-cat-meow.mp3 |
| | CAT_SHOW | achievement | cat-purring-and-meow.mp3 |
| **Activities** | eating | catEating | cat-purr.wav |
| | playing | catPlaying | cute-cat-meow.mp3 |
| | sleeping | catSleeping | cat-purr.wav |
| | grooming | catGrooming | cat-sweet-meow.wav |
| | exploring | catExploring | cat-attention-meow.wav |
| | hunting | catHunting | cat-meow.mp3 |
| | stretching | catStretching | cat-purr.wav |
| | cuddling | catCuddling | cat-sweet-meow.wav |
| | training | catTraining | cat-attention-meow.wav |
| | mischief | catMischief | funny-cat-meow.mp3 |
| | zoomies | catZoomies | cute-cat-meow-2.mp3 |
| | sunbathing | catSunbathing | cat-purr.wav |
| | birdwatching | catBirdwatching | cat-attention-meow.wav |
| **Relationships** | friendshipFormed | friendship | cat-sweet-meow.wav |
| | friendshipStrengthened | heartBurst | cat-sweet-meow.wav |
| | rivalryStarted | rivalry | cat-angry-meow.wav |
| | rivalryWorsened | sparkClash | cat-angry-meow.wav |
| | reconciliation | friendship | cat-sweet-meow.wav |
| **Notifications** | giftReceived | giftReceived | cute-cat-meow.mp3 |
| | tradeReceived | tradeReceived | cat-attention-meow.wav |
| | friendRequest | meow | cat-meow.mp3 |
| | dailyEvent | dailyEvent | cat-attention-meow.wav |
| **Achievements** | unlock | achievement | cat-purring-and-meow.mp3 |
| | milestone | levelUp | lion-roar.wav |
| | challengeProgress | challengeProgress | cat-meow-fx.mp3 |
| | challengeComplete | challengeComplete | cat-purring-and-meow.mp3 |
| **UI** | buttonClick | click | synth |
| | cardFlip | cardFlip | synth |
| | save | success | synth |
| | error | error | synth |
| | purchase | coin | synth |
| | nextDay | nextDay | synth |
| **Moods** | becameHappy | moodHappy | cute-cat-meow.mp3 |
| | becameSad | moodSad | cat-hungry-meow.wav |
| | becameContent | purr | cat-purr.wav |
| **Empire** | petCat | purr | cat-purr.wav |
| | feedCat | catEating | cat-purr.wav |
| | playWithCat | catPlaying | cute-cat-meow.mp3 |

---

## Implementation Order

1. Create `src/config/gameEventSounds.ts` with all mappings
2. Update `useGameEvents.ts` to auto-play sounds on dispatch
3. Update `CatActivityPopups.tsx` to use shared config
4. Update documentation in `docs/SOUND_SYSTEM.md`

---

## Benefits

- **Single source of truth** for event-to-sound mappings
- **Automatic sound triggering** through game event dispatcher
- **Consistent sound usage** across all components
- **Easy customization** - change one file to update all sounds
- **Better documentation** - clear mapping table for reference
- **Type safety** - TypeScript ensures valid sound types

