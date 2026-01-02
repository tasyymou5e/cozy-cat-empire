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
    // ... other stats
  };
  
  return kitten;
}
```

### Breeding Cooldown
- 5 days after successful breeding
- 2 days after failed attempt

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
