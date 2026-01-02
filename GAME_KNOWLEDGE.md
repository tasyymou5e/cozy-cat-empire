# Cat Farm Game - Knowledge Base

## Overview
Cat Farm is a browser-based idle/management game where players build a cat empire. Start with a small apartment and grow to own a 100-acre farm with dozens of cats.

---

## Core Systems

### 1. Cat System (`src/types/game.ts`)

**Cat Interface:**
```typescript
interface Cat {
  id: string;
  type: 'stray' | 'adopted' | 'pure';
  breed: CatBreed; // 8 breeds with different values/rarity
  name: string;
  health: number; // 0-100, dies at 0
  happiness: number; // 0-100
  hunger: number; // 0-100, affects health if low
  value: number; // Base sell price
  age: number;
  personality: CatPersonality; // 6 types
  showWins: number;
  isForSale: boolean;
  grade: number; // 1-20 grading system
  tricksLearned: TrickId[];
  trickProgress: Record<TrickId, number>;
  restLevel: number; // 0-100
  feedingScore: number;
  lastTrainingDay: number;
}
```

**Breeds (by value):**
- Stray ($30) → Tabby ($80) → Persian ($200) → Siamese ($180) → Maine Coon ($250) → British Shorthair ($220) → Ragdoll ($280) → Bengal ($350)

**Personalities:**
- Lazy, Playful, Affectionate, Independent, Curious, Shy

### 2. Grading System (`src/types/grading.ts`)

**Grade Tiers (1-20):**
- Tiers: common (1-4), fine (5-8), rare (9-12), elite (13-16), legendary (17-20)
- Colors: gray → green → blue → purple → gold
- Stars: 0-5 based on grade

**Tricks:**
- Sit, Paw, Roll Over, Jump, Fetch
- Each has difficulty (1-5), grade bonus, and show bonus
- Progress 0-100 per trick, needs 100 to learn

### 3. Relationship System (`src/types/relationships.ts`, `src/hooks/useRelationships.ts`)

**Relationship Scores:**
- -100 to +100 scale
- Friends (20+), Best Friends (50+), Soul Mates (80+)
- Rivals (-20 to -49), Enemies (-50 to -79), Nemesis (-80 to -100)

**Features:**
- Dynamic events affect scores
- Compatibility affects breeding success
- Groups form automatically among friends
- Happiness modifiers based on relationships

### 4. Game State (`src/hooks/useGameState.ts`)

**Resources:**
- Food, Medicine, Toys, Treats

**Housing Progression:**
- Apartment (5 cats) → House (10 cats, $500) → Mansion (25 cats, $2000) → Farm (50+ cats, $10000)
- Farm can expand to 100 acres

**Daily Cycle:**
- Each day: hunger decreases, happiness changes
- Low hunger affects health
- Cats can die if health reaches 0
- Market refreshes every 3 days

### 5. Sound System (`src/hooks/useSoundEffects.ts`)

**Sound Types:**
- click, success, error, meow, purr, hiss
- friendship, rivalry, levelUp, coin, achievement, nextDay

**Music Moods:**
- morning, afternoon, evening, night (cycle with days)
- celebration (triggered by wins/achievements)
- tense (triggered by negative events)

**Features:**
- Procedural audio using Web Audio API
- Chord progressions change with mood
- Separate volume controls for SFX and music

### 6. Confetti System (`src/hooks/useConfetti.ts`)

**Triggers:**
- Achievements unlock → Star confetti
- Cat show wins → Big celebration burst

---

## Components

### Main Game (`src/components/game/CatFarm.tsx`)
- Master component orchestrating all panels
- 8-tab sidebar layout
- Audio controls in header

### Cat Display (`src/components/game/CatCard.tsx`)
- Shows cat stats, relationships, tricks
- Grade badge with tier styling
- Comfort button for upset cats (20-second timer)
- Heal and Sell buttons

### Panels:
- **ActionPanel**: Add cats, next day
- **ChorePanel**: Earn money through tasks
- **ResourcePanel**: Buy/use resources
- **MarketPanel**: Buy cats from NPC sellers
- **BreedingPanel**: Pair cats for kittens
- **TrainingPanel**: Teach tricks, manage rest
- **SocializePanel**: Build relationships
- **MatchmakingPanel**: Suggested pairings
- **GroupActivitiesPanel**: Group bonding
- **RelationshipPanel**: View all relationships
- **AchievementsPanel**: Track progress
- **SaveLoadPanel**: Persist game state

### Support Components:
- **StatusBar**: Money, day, house, cat show
- **MessageBar**: Game notifications
- **GradeBadge**: Visual grade display
- **ComfortButton**: 20-second comfort timer
- **RelationshipAnimations**: Floating emojis

---

## Achievements (`src/types/game.ts`)

| ID | Name | Target |
|----|------|--------|
| first_cat | First Friend | 1 cat |
| cat_collector | Cat Collector | 10 cats |
| cat_empire | Cat Empire | 50 cats |
| show_winner | Show Winner | 5 wins |
| champion | Champion Breeder | 25 wins |
| millionaire | Cat Millionaire | $10,000 |
| breeder | First Litter | 1 kitten |
| master_breeder | Master Breeder | 10 kittens |
| homeowner | Homeowner | Upgrade to house |
| farmer | Farmer | Own a farm |
| land_baron | Land Baron | 100 acres |
| first_friendship | New Friendship | 2 cats friends |
| social_butterfly | Social Butterfly | 5+ friendships |
| peacemaker | Peacemaker | Rival → Friend |
| perfect_match | Perfect Match | Breed best friends |
| drama_queen | Drama Queen | 3+ rivalries |
| clique_leader | Clique Leader | 4+ member group |

---

## Key Mechanics

### Breeding
- Requires 2 cats, no cooldown active
- Relationship affects success rate
- Kitten inherits parent traits + grade averaging
- Enemies may refuse to breed

### Cat Shows
- Eligible: health ≥70, happiness ≥60
- Score = health + happiness + (rarity×10) + (wins×5) + friend bonus
- Winners get money, increased value, show wins

### Training
- Costs 2 treats per session
- Grade determines progress gain
- Rest level affects success
- Learning a trick boosts grade

### Comforting
- Available when happiness <50 or more enemies than friends
- 20-second hold timer
- Boosts happiness +30, health +5

---

## File Structure

```
src/
├── components/game/     # All game UI components
├── hooks/
│   ├── useGameState.ts  # Core game logic
│   ├── useRelationships.ts
│   ├── useSoundEffects.ts
│   └── useConfetti.ts
├── types/
│   ├── game.ts          # Cat, GameState, constants
│   ├── grading.ts       # Grade system
│   └── relationships.ts # Relationship types
└── contexts/
    └── SoundContext.tsx # Sound provider
```

---

## Tech Stack
- React 18 + TypeScript
- Vite build tool
- Tailwind CSS + shadcn/ui components
- Web Audio API for sound
- canvas-confetti for celebrations
- localStorage for saves
