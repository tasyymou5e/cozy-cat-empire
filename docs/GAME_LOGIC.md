# Cat Farm - Game Logic & Flow

## Overview
Cat Farm is an idle/management game where players build a cat empire through breeding, training, and cat shows. This document covers all game mechanics and logic flows.

---

## Core Game Loop

```
Day N starts
    ↓
Player performs actions:
  - Feed cats
  - Do chores (earn money)
  - Buy resources
  - Train cats
  - Socialize cats
  - Enter cat shows
  - Breed cats
  - Buy/sell cats
  - Take photos
  - Customize cats
    ↓
Player clicks "Next Day"
    ↓
Daily Processing:
  1. Decrease cat hunger (-10)
  2. Update cat happiness based on relationships
  3. Check for sick cats (hunger < 20 → health damage)
  4. Process random relationship events
  5. Check for cat deaths (health ≤ 0)
  6. Trigger random daily event (60% chance)
  7. Refresh market (every 3 days)
  8. Decrease cooldowns
  9. Age cats
  10. Check achievements
    ↓
Day N+1 starts
```

---

## Cat System

### Cat Creation
```typescript
function createCat(type: 'stray' | 'adopted' | 'pure'): Cat {
  return {
    id: generateId(),
    type,
    breed: getRandomBreed(type),
    name: getUniqueName(),
    health: 100,
    happiness: 100,
    hunger: 50,
    value: BREEDS[breed].baseValue + random(0-50),
    age: type === 'stray' ? random(1-3) : 1,
    personality: randomPersonality(),
    showWins: 0,
    isForSale: false,
    grade: generateRandomGrade(), // 1-20
    tricksLearned: [],
    trickProgress: { sit: 0, paw: 0, rollOver: 0, jump: 0, fetch: 0 },
    restLevel: 100,
    feedingScore: 0,
    lastTrainingDay: 0,
    appearance: generateDefaultAppearance(breed), // Breed-specific defaults
  };
}
```

### Cat Costs
| Type | Cost |
|------|------|
| Stray | $0 |
| Adopted | $50 |
| Pure Breed | $200 |

### Breed Values & Rarity
| Breed | Base Value | Rarity |
|-------|------------|--------|
| Stray | $30 | 1 |
| Tabby | $80 | 2 |
| Persian | $200 | 4 |
| Siamese | $180 | 4 |
| Maine Coon | $250 | 5 |
| British Shorthair | $220 | 4 |
| Ragdoll | $280 | 5 |
| Bengal | $350 | 6 |

### Personality Types
- **Lazy**: Prefers rest, slow happiness decay
- **Playful**: Gains happiness from toys, needs more activity
- **Affectionate**: Bonds easily, social butterfly
- **Independent**: Slower relationship building, self-sufficient
- **Curious**: Learns tricks faster, explores more
- **Shy**: Takes longer to bond but forms deep connections

---

## Cat Renaming System

### Inline Rename Feature
- Click pencil icon on CatCard to enter edit mode
- Type new name directly in input field
- Confirm with checkmark button
- Cancel with X button to revert

### Random Name Generator
- Shuffle button generates contextual names
- Combines breed-specific, personality-based, and universal names

### Breed-Specific Names
```typescript
const BREED_NAMES: Record<CatBreed, string[]> = {
  'siamese': ['Sakura', 'Miko', 'Yuki', 'Suki', 'Kiko', 'Hana', 'Wasabi', 'Tempura', 'Sake', 'Nori', 'Tofu', 'Mochi'],
  'persian': ['Duchess', 'Prince', 'Valentino', 'Anastasia', 'Cleopatra', 'Empress', 'Countess', 'Marquis', 'Vivienne', 'Reginald'],
  'maine-coon': ['Bear', 'Moose', 'Timber', 'Ranger', 'Hunter', 'Maple', 'Everest', 'Grizzly', 'Kodiak', 'Aspen', 'Summit'],
  'british-shorthair': ['Winston', 'Churchill', 'Wellington', 'Sherlock', 'Watson', 'Paddington', 'Biscuit', 'Earl Grey', 'Crumpet'],
  'ragdoll': ['Marshmallow', 'Velvet', 'Cashmere', 'Fluffernutter', 'Snuggles', 'Cloud', 'Pillow', 'Cottontail', 'Silky'],
  'bengal': ['Rajah', 'Sheba', 'Zara', 'Jungle', 'Safari', 'Tigris', 'Savanna', 'Leo', 'Panther', 'Aztec', 'Sahara'],
  'tabby': ['Stripes', 'Marble', 'Autumn', 'Caramel', 'Butterscotch', 'Toffee', 'Cinnamon', 'Tiger', 'Amber'],
  'stray': ['Scrappy', 'Lucky', 'Rascal', 'Scout', 'Maverick', 'Bandit', 'Dusty', 'Patches', 'Scruffy', 'Streetwise'],
};
```

### Personality-Based Names
```typescript
const PERSONALITY_NAMES: Record<CatPersonality, string[]> = {
  'lazy': ['Snoozer', 'Dreamer', 'Sleepy', 'Cozy', 'Lounger', 'Napkin', 'Slumber', 'Dozer', 'Yawnie', 'Pillow'],
  'playful': ['Zoom', 'Bounce', 'Sparky', 'Frisky', 'Zippy', 'Turbo', 'Rocket', 'Dash', 'Peppy', 'Zinger'],
  'affectionate': ['Cuddles', 'Sweetie', 'Honey', 'Lovebug', 'Snugglepuff', 'Huggy', 'Smoochie', 'Darling', 'Angel'],
  'independent': ['Maverick', 'Solo', 'Rebel', 'Sphinx', 'Mystery', 'Enigma', 'Lone Wolf', 'Rogue', 'Drifter'],
  'curious': ['Scout', 'Explorer', 'Sherlock', 'Detective', 'Peepers', 'Nosy', 'Snoop', 'Inquisitor', 'Seeker'],
  'shy': ['Whisper', 'Shadow', 'Misty', 'Ghost', 'Phantom', 'Bashful', 'Wallflower', 'Timid', 'Hush'],
};
```

### Universal Names
```typescript
const UNIVERSAL_NAMES = [
  'Whiskers', 'Mittens', 'Luna', 'Oliver', 'Bella', 'Max', 'Coco',
  'Biscuit', 'Muffin', 'Cookie', 'Sir Fluffington', 'Lord Meowington',
  'Gandalf', 'Yoda', 'Dumbledore', 'Felix', 'Ginger', 'Pepper',
];
```

### Name Generation Logic
```typescript
const generateRandomName = () => {
  const breedNames = BREED_NAMES[cat.breed] || [];
  const personalityNames = PERSONALITY_NAMES[cat.personality] || [];
  const combinedNames = [...breedNames, ...personalityNames, ...UNIVERSAL_NAMES];
  const randomIndex = Math.floor(Math.random() * combinedNames.length);
  return combinedNames[randomIndex];
};
```

---

## Cat Appearance System

### Appearance Options
```typescript
interface CatAppearance {
  furColor: FurColor;
  pattern: FurPattern;
  patternColor?: string;
  eyeColor: EyeColor;
  hairLength: HairLength;
  facialFeatures: FacialFeature[];
}
```

### Available Options

**Fur Colors:**
- orange, black, white, gray, brown, cream, ginger, calico

**Patterns:**
- solid, tabby, spotted, tuxedo, bicolor, calico

**Eye Colors:**
- green, blue, amber, gold, heterochromia, copper

**Hair Lengths:**
- short, medium, fluffy

**Facial Features:**
- normal, scar, eyepatch, whiskers_long, grumpy, cute_blush

### Breed Defaults
```typescript
function generateDefaultAppearance(breed: CatBreed): CatAppearance {
  // Returns breed-appropriate defaults
  // e.g., Siamese gets cream fur, blue eyes
  // Bengal gets spotted pattern, gold eyes
}
```

---

## Grading System (1-20)

### Grade Generation
```typescript
const GRADE_WEIGHTS = [
  { min: 1, max: 4, weight: 40 },   // Common: 40%
  { min: 5, max: 8, weight: 30 },   // Fine: 30%
  { min: 9, max: 12, weight: 18 },  // Rare: 18%
  { min: 13, max: 16, weight: 9 },  // Elite: 9%
  { min: 17, max: 20, weight: 3 },  // Legendary: 3%
];
```

### Grade Tiers
| Tier | Range | Color | Stars |
|------|-------|-------|-------|
| Common | 1-4 | Gray | 0-1 |
| Fine | 5-8 | Green | 1-2 |
| Rare | 9-12 | Blue | 2-3 |
| Elite | 13-16 | Purple | 3-4 |
| Legendary | 17-20 | Gold | 4-5 |

### Grade Improvements
- Learning tricks: +1-3 grade
- High feeding score: +0-2 grade
- Age bonus (up to 5 days): +0-1 grade
- Show wins: +0.5 per win

---

## Trick System

### Available Tricks
| Trick | Difficulty | Grade Bonus | Show Bonus |
|-------|------------|-------------|------------|
| Sit | 1 | +1 | +5% |
| Paw | 2 | +1 | +8% |
| Roll Over | 3 | +2 | +12% |
| Jump | 4 | +2 | +15% |
| Fetch | 5 | +3 | +20% |

### Training Mechanics
- Costs 2 treats per session
- Progress = base + (grade × 2) + (rest level / 10)
- Cat needs 100 progress to learn trick
- Rest level decreases 10 per training session
- Can only train once per day per cat

---

## Relationship System

### Relationship Score Range
| Level | Score Range | Effects |
|-------|-------------|---------|
| Enemy | -100 to -60 | -5 happiness, breeding blocked |
| Rival | -59 to -20 | -2 happiness, breeding penalty |
| Neutral | -19 to 19 | No effects |
| Friend | 20 to 59 | +2 happiness |
| Best Friend | 60 to 100 | +5 happiness, breeding bonus |

### Personality Compatibility
```typescript
PERSONALITY_COMPATIBILITY = {
  lazy: { lazy: 10, playful: -5, affectionate: 15, independent: 5, curious: 0, shy: 10 },
  playful: { lazy: -5, playful: 10, affectionate: 15, independent: -10, curious: 20, shy: -5 },
  affectionate: { lazy: 15, playful: 15, affectionate: 20, independent: -15, curious: 10, shy: 5 },
  independent: { lazy: 5, playful: -10, affectionate: -15, independent: 5, curious: 0, shy: 10 },
  curious: { lazy: 0, playful: 20, affectionate: 10, independent: 0, curious: 15, shy: 5 },
  shy: { lazy: 10, playful: -5, affectionate: 5, independent: 10, curious: 5, shy: 15 },
};
```

### Relationship Events
**Positive Events:**
- Playing together: +3-8 points
- Sharing treats: +5-10 points
- Grooming: +4-7 points
- Napping together: +2-5 points

**Negative Events:**
- Fighting over food: -5-10 points
- Territory disputes: -3-8 points
- Jealousy (show wins): -3-5 points

---

## Cat Shows

### Show Tiers
| Tier | Min Wins | Min Grade | Entry Fee | Reward Multiplier |
|------|----------|-----------|-----------|-------------------|
| Local | 0 | 1 | $0 | 1.0x |
| Regional | 5 | 5 | $50 | 1.5x |
| National | 15 | 10 | $100 | 2.0x |
| Championship | 30 | 15 | $200 | 3.0x |

### Show Eligibility
- Health ≥ 70
- Happiness ≥ 60
- Grade ≥ Tier minimum

### Scoring Algorithm
```typescript
score = cat.health 
      + cat.happiness 
      + (BREEDS[cat.breed].rarity × 10)
      + (cat.showWins × 5)
      + friendBonus        // +5 per friend in show
      + gradeBonus         // (grade - minGrade) × 3
      + trickBonus         // +5-20% per trick
      + costumeBonus       // costume.showBonus

threshold = 200 × difficultyModifier  // 1.0 - 1.45 based on tier

won = Math.random() × threshold < score
```

### Show Cooldown
- 20 days between shows
- Timer starts after any show entry

### Seasonal Events
Bonus multipliers during special seasons:
- Spring: +10%
- Summer: +15%
- Autumn: +12%
- Winter: +20%

---

## Breeding System

### Requirements
- 2 cats minimum
- No breeding cooldown active
- Cats must not be enemies

### Breeding Outcome
```typescript
function breedCats(cat1, cat2): Cat | null {
  const compatibility = getBreedingCompatibility(cat1.id, cat2.id);
  
  if (!compatibility.canBreed) return null;
  
  // Success chance based on relationship
  if (compatibility.bonus < 0 && Math.random() < 0.5) {
    return null; // 50% fail for rivals
  }
  
  const kitten = {
    type: 'pure',
    breed: Math.random() < 0.5 ? cat1.breed : cat2.breed,
    grade: averageGrade(cat1, cat2) + compatibility.bonus/10,
    personality: inheritPersonality(cat1, cat2),
    appearance: inheritAppearance(cat1, cat2), // Mix parent appearances
    // ... other stats
  };
  
  return kitten;
}
```

### Breeding Cooldown
- 5 days after successful breeding
- 2 days after failed attempt

---

## Photo Booth System

### Available Assets

**Backgrounds (16 options):**
- Nature: garden, beach, forest, mountain
- Fantasy: castle, space, underwater, rainbow
- Seasonal: spring, summer, autumn, winter
- Solid: pink, blue, purple, gold

**Cat Poses (7 options):**
- sitting, playful, sleepy, proud, silly, waving, bouncing

**Frames (7 options):**
- polaroid, heart, star, vintage, gold, rainbow, paws

**Stickers (24 options across 5 categories):**
- Hearts: heart, sparkle-heart, floating-hearts
- Stars: star, shooting-star, constellation
- Text: meow, purrfect, cute, love
- Animals: butterfly, fish, mouse, bird
- Effects: sparkles, bubbles, confetti, rainbow

### Photo Creation Flow
```typescript
function createPhoto(cat: Cat, options: PhotoOptions): Photo {
  return {
    id: generateId(),
    catId: cat.id,
    catName: cat.name,
    backgroundId: options.background.id,
    poseId: options.pose.id,
    frameId: options.frame.id,
    stickers: options.stickers,
    createdAt: new Date(),
    isFavorite: false,
  };
}
```

### Export Options
- **Download**: Save as PNG to device
- **Copy**: Copy to clipboard
- **Share**: Native share dialog (if supported)
- **Save to Gallery**: Store in cloud (authenticated users)

---

## Photo Gallery System

### Storage
- Local: localStorage with 50 photo limit
- Cloud: Supabase storage bucket `photo-gallery`

### Sync Logic
```typescript
async function syncWithCloud() {
  // 1. Load cloud photos
  const cloudPhotos = await loadCloudPhotos();
  
  // 2. Merge with local (cloud wins on conflicts)
  const merged = mergePhotos(localPhotos, cloudPhotos);
  
  // 3. Upload new local photos to cloud
  for (const photo of newLocalPhotos) {
    await uploadToCloud(photo);
  }
  
  // 4. Update local storage
  persistPhotos(merged);
}
```

### Gallery Features
- Filter by cat name
- Sort by date (newest/oldest) or name
- Toggle favorites
- Delete with confirmation
- Full-screen lightbox viewer

---

## Economy

### Income Sources
| Source | Amount |
|--------|--------|
| Chores | $15-60 base + random bonus |
| Cat shows | $50-350 based on tier |
| Selling cats | Cat value (breed + wins + grade) |

### Expenses
| Expense | Cost |
|---------|------|
| Food (5 units) | $10 |
| Medicine (5 units) | $25 |
| Toys (5 units) | $15 |
| Treats (5 units) | $8 |
| Show entry | $0-200 |
| Costumes | $50-500 |

### Housing Upgrades
| House | Space | Cost |
|-------|-------|------|
| Apartment | 5 cats | Starting |
| House | 10 cats | $500 |
| Mansion | 25 cats | $2,000 |
| Farm | 50 cats | $10,000 |
| Farm Acres | +20 cats each | $5,000 each |

---

## Daily Events

### Event Probability
- 60% chance of daily event
- Weighted by event rarity

### Event Types
**Positive:**
- Found money (+$50-200)
- Cat talent discovered (+grade)
- Resource windfall (+5-10 resources)

**Negative:**
- Vet emergency (-$100, cat needs medicine)
- Resource spoilage (-5 food/medicine)
- Reputation hit (-10 rep)

**Neutral:**
- Visitor (small money gift)
- Random cat bonus

---

## VIP System

### VIP Tiers
| Tier | Min Streak | Coin Mult | Resource Mult | Exclusive Reward |
|------|------------|-----------|---------------|------------------|
| Bronze | 30 days | 1.5x | 1.25x | VIP Bronze Collar |
| Silver | 60 days | 2.0x | 1.5x | VIP Silver Cape |
| Gold | 90 days | 2.5x | 2.0x | VIP Gold Crown |

### VIP Benefits
- Enhanced daily login rewards
- Exclusive costumes (cannot be purchased)
- VIP badge display
- Priority in future features

---

## Achievement System

### Achievement Types
| Type | Examples |
|------|----------|
| cats | first_cat (1), cat_collector (10), cat_empire (50) |
| showWins | show_winner (5), champion (25) |
| money | millionaire (10,000) |
| breeding | breeder (1), master_breeder (10) |
| house | homeowner, farmer |
| acres | land_baron (100) |
| friendship | first_friendship, social_butterfly |
| streak | streak_warrior, streak_champion |
| loginStreak | login_3_days, vip_bronze, vip_gold |

---

## Save System

### Local Storage
```typescript
interface LocalSave {
  gameState: GameState;
  kittensBreed: number;
  relationships: RelationshipSaveData;
}
```

### Cloud Save (Supabase)
```typescript
interface CloudSave {
  user_id: string;
  game_state: Json;
  kittens_bred: number;
  relationships: Json;
  last_played_at: timestamp;
}
```

### Auto-save Intervals
- Cloud: Every 5 minutes when logged in
- Local: On major actions (next day, purchases)

---

## Challenge System

### Weekly Challenges
- 5 challenges per week (2 easy, 2 medium, 1 hard)
- Auto-generated Mondays at 00:00 UTC
- Rewards: coins + optional badge

### Challenge Types
| Type | Description |
|------|-------------|
| show_wins | Win X cat shows |
| breed_kittens | Breed X kittens |
| collect_cats | Acquire X new cats |
| earn_money | Earn $X total |
| train_tricks | Teach X tricks |

### Streak Tracking
- Complete all 5 challenges in a week to maintain streak
- Streak bonuses at 3, 5, 10 weeks

---

## Bulk Actions System

### Heal All Sick Cats
```typescript
function healAllSickCats() {
  const sickCats = cats.filter(c => c.health < 70);
  if (resources.medicine < sickCats.length) return;
  sickCats.forEach(c => c.health = 100);
  resources.medicine -= sickCats.length;
}
```

### Rest All Tired Cats
```typescript
function restAllTiredCats() {
  const tiredCats = cats.filter(c => c.restLevel < 50);
  tiredCats.forEach(c => {
    c.restLevel = Math.min(100, c.restLevel + 20);
    c.happiness += 5;
    if (c.restLevel >= 80) c.grade += 0.25; // Bonus for well-rested
  });
}
```

### Comfort All Unhappy Cats
```typescript
function comfortAllUnhappyCats() {
  const unhappyCats = cats.filter(c => c.happiness < 50);
  unhappyCats.forEach(c => {
    c.happiness = Math.min(100, c.happiness + 30);
    c.health = Math.min(100, c.health + 5);
  });
}
```

### Train All Available Cats
```typescript
function trainAllAvailableCats() {
  const trainable = cats.filter(c => 
    c.lastTrainingDay < currentDay && 
    c.tricksLearned.length < 5
  );
  // Costs: 1 treat + 1 toy per cat
  if (resources.treats < trainable.length) return;
  if (resources.toys < trainable.length) return;
  
  trainable.forEach(c => {
    // Train next available trick
    // Apply rest bonus
    // Update lastTrainingDay
  });
}
```

### Bulk Sell
- Multi-select cats for batch selling
- Confirmation dialog (irreversible)
- Total value calculated: sum(value * (1 + showWins * 0.1))
- All selected cats removed, relationships cleaned up
