

# Create Game Event Sound Mapping Documentation

## Overview

Create a new documentation file `docs/GAME_EVENT_SOUNDS.md` that documents the centralized event-to-sound mapping system implemented in `src/config/gameEventSounds.ts`.

---

## File to Create

| File | Description |
|------|-------------|
| `docs/GAME_EVENT_SOUNDS.md` | Documentation for game event sound mapping configuration |

---

## Documentation Structure

### 1. Overview Section
- Purpose of the event sound mapping system
- Relationship to `src/config/sounds.ts`
- How it enables automatic sound triggering

### 2. Architecture Diagrams
- Before/After architecture showing the refactoring
- Flow from GameEvent to SoundType to AudioSource

### 3. Configuration File Reference
- Location: `src/config/gameEventSounds.ts`
- All exported constants with descriptions:
  - `GAME_ACTION_SOUNDS`
  - `ACTIVITY_SOUNDS`
  - `RELATIONSHIP_SOUNDS`
  - `NOTIFICATION_SOUNDS`
  - `ACHIEVEMENT_SOUNDS`
  - `UI_SOUNDS`
  - `MOOD_SOUNDS`
  - `EMPIRE_SOUNDS`

### 4. Integration with useGameEvents
- How the dispatcher automatically triggers sounds
- The `playSound` optional config parameter
- Code example showing usage

### 5. Complete Event-to-Sound Mapping Table
- All categories with their events, sound types, and audio sources
- Organized by: Game Actions, Activities, Relationships, Notifications, Achievements, UI, Moods, Empire

### 6. Helper Functions
- `getSoundForAction(action)` - returns SoundType for GameAction
- `getSoundForActivity(activity)` - returns SoundType for activity key

### 7. How to Extend
- Adding new game action sounds
- Adding new activity sounds
- Adding new event categories

---

## Content Source

The documentation will be based on:
- Actual implementation in `src/config/gameEventSounds.ts`
- Integration in `src/hooks/useGameEvents.ts`
- User-provided comprehensive mapping table

---

## Cross-References

The new document will link to:
- `docs/SOUND_SYSTEM.md` - For SoundType to AudioSource mapping
- `docs/SOUND_LIBRARY.md` - For available audio files

And `docs/SOUND_SYSTEM.md` will be updated to reference this new document.

