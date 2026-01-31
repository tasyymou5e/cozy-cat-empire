# Cat Farm - Hooks Architecture

## Overview

Cat Farm uses a modular hooks architecture organized into three tiers:
1. **Domain Hooks** (`src/hooks/game/`) - Core game logic, unit-tested
2. **Feature Hooks** (`src/hooks/`) - Progress tracking, social features, UI state
3. **Aggregator Hooks** - Combine multiple hooks for components

---

## Directory Structure

```
src/hooks/
├── game/                      # Core game domain (unit-tested)
│   ├── types.ts               # Shared types, utilities, GameActions interface
│   ├── useBreeding.ts         # Cat breeding logic
│   ├── useBulkActions.ts      # Mass operations (heal all, train all)
│   ├── useCatManagement.ts    # Add/sell/rename/comfort cats
│   ├── useCatShows.ts         # Show competition logic
│   ├── useCostumes.ts         # Costume purchase/equip
│   ├── useGameCore.ts         # Daily cycle, chores, upgrades
│   ├── useResources.ts        # Resource management
│   ├── useSaveLoad.ts         # Local save/load
│   ├── useTraining.ts         # Trick training, socialization
│   └── __tests__/             # Unit tests for all domain hooks
├── handlers/                  # Event handler composition
│   ├── useAudioHandlers.ts    # Sound effect triggers
│   ├── useCloudHandlers.ts    # Cloud save handlers
│   ├── useRewardHandlers.ts   # Reward claiming
│   └── useSocialHandlers.ts   # Gift/trade handlers
├── admin/                     # Admin dashboard hooks
│   ├── useAdminAuth.ts
│   ├── useAdminData.ts
│   ├── useAdminActivityLog.ts
│   ├── useAdminCorruptedSaves.ts  # Game save corruption detection/repair
│   ├── useAdminRateLimit.ts
│   ├── useSecurityLinter.ts
│   └── useSecurityHistory.ts
├── useCatFarmState.ts         # Master aggregator for CatFarm
├── useCatFarmSystems.ts       # Core systems (auth, sound, haptics)
├── useCatFarmUIState.ts       # UI state (tabs, modals, dialogs)
└── [feature hooks]            # Individual feature hooks
```

---

## Core Concepts

### 1. GameHookDependencies

All domain hooks receive a standardized dependency object:

```typescript
interface GameHookDependencies {
  state: GameState;                                    // Current game state (read-only)
  setState: React.Dispatch<React.SetStateAction<GameState>>; // State updater
  showMessage: (msg: string, type?: MessageType) => void;    // User feedback
  playSound?: (type: SoundType) => void;              // Sound effects
  onChallengeProgress?: (type: ChallengeType, increment?: number) => void; // Progress tracking
  logActivity?: (params: LogActivityParams) => void;  // Analytics
  relationshipSystem: RelationshipSystem;             // Cat relationships
  kittensBreed: number;                               // Breeding counter
  setKittensBreed: React.Dispatch<React.SetStateAction<number>>;
  checkAchievements: (newState: GameState, extraKittens?: number) => GameState;
}
```

### 2. GameActions Interface

Domain hooks return actions matching the GameActions interface (44 total actions):

| Domain | Actions Count | Examples |
|--------|---------------|----------|
| Cat Management | 10 | `addCat`, `sellCat`, `renameCat`, `comfortCat` |
| Resources | 6 | `buyResource`, `feedCats`, `useMedicine` |
| Training | 4 | `trainCat`, `restCat`, `socializeCats` |
| Shows | 1 | `catShow` |
| Breeding | 1 | `breedCats` |
| Bulk Actions | 6 | `healAllSickCats`, `trainAllAvailableCats` |
| Save/Load | 6 | `saveGame`, `loadGame`, `resetGame` |
| Costumes | 2 | `buyCostume`, `equipCostume` |
| Core/Daily | 8 | `doChore`, `upgradeHouse`, `nextDay` |

---

## Progress Tracking Hooks

### useDailyObjectives

Tracks daily tasks that reset each day.

```typescript
interface UseDailyObjectivesReturn {
  objectives: DailyObjective[];      // Current day's objectives
  allCompleted: boolean;             // All objectives done
  bonusClaimed: boolean;             // Bonus reward claimed
  updateProgress: (type: ObjectiveType, amount?: number) => void;
  claimBonus: () => number;          // Returns bonus coins
  refreshObjectives: () => void;     // Force new objectives
  loading: boolean;
}
```

**Objective Types:**
- `feed_cats`, `train_cats`, `win_shows`, `breed_kittens`
- `earn_money`, `buy_resources`, `comfort_cats`

**Storage:** localStorage + cloud sync when authenticated

---

### useWeeklyChallenges

Weekly goals with rewards and achievement integration.

```typescript
interface UseWeeklyChallengesReturn {
  challenges: WeeklyChallenge[];     // Active challenges
  updateProgress: (type: ChallengeType, increment?: number) => void;
  claimReward: (challengeId: string) => Promise<void>;
  stats: PlayerChallengeStats;       // Streaks, totals
  loading: boolean;
}
```

**Challenge Types:**
- `show_wins`, `breed_kittens`, `collect_cats`
- `earn_money`, `train_tricks`, `socialize_cats`

---

### useCollectionProgress

Tracks collection completion across categories.

```typescript
interface UseCollectionProgressReturn {
  progress: CollectionProgress;
  breedProgress: { collected: number; total: number; items: CollectionItem[] };
  personalityProgress: { collected: number; total: number; items: CollectionItem[] };
  costumeProgress: { collected: number; total: number; items: CollectionItem[] };
  trickProgress: { collected: number; total: number; items: CollectionItem[] };
  overallProgress: number;           // 0-100 percentage
  newlyCompletedSet: CollectionCategory | null;
  clearNewlyCompleted: () => void;
  getSetReward: (category: CollectionCategory) => SetReward;
}
```

**Set Rewards:**
| Category | Coins | Title | Bonus |
|----------|-------|-------|-------|
| breeds | 500 | Breed Master | +5% show score |
| personalities | 300 | Cat Whisperer | +5% happiness |
| costumes | 750 | Fashion Icon | - |
| tricks | 400 | Trick Master | +10% training speed |

---

### useMilestones

Tracks one-time achievement milestones.

```typescript
interface UseMilestonesReturn {
  milestones: Milestone[];
  checkMilestone: (type: MilestoneType, value: number) => Milestone | null;
  acknowledgePopup: (id: string) => void;
  pendingPopup: Milestone | null;
}
```

---

### useBattlePass

Seasonal battle pass progression.

```typescript
interface UseBattlePassReturn {
  season: BattlePassSeason | null;
  progress: BattlePassProgress | null;
  currentTier: number;
  currentXp: number;
  xpToNextTier: number;
  isPremium: boolean;
  addXp: (amount: number) => void;
  claimReward: (tierId: string, isPremiumReward: boolean) => Promise<void>;
  getUnclaimedRewards: () => BattlePassReward[];
  loading: boolean;
}
```

---

## State Management Hooks

### useCatFarmState (Master Aggregator)

Combines all hooks needed by CatFarm component:

```typescript
const farmState = useCatFarmState();

// Returns:
{
  // Core systems
  sound, confetti, haptics, auth, theme, isMobile,
  
  // Game state
  gameState, state, actions, kittensBreed, relationshipSystem,
  message, messageType, messageSystem,
  
  // Cloud & profile
  cloudSave, leaderboard, profile,
  
  // Progress systems
  weeklyChallenges, dailyRewards, objectives, milestones,
  collection, battlePass, luckyWheel,
  
  // Social systems
  gifts, trading, friends, coopChallenges,
  
  // Utility
  badgeCounts, ui, legacy, specializations,
}
```

---

### useCatFarmSystems

Core systems initialization:

```typescript
{
  sound: { playSound, toggleMusic, musicEnabled, soundEnabled },
  confetti: { fireConfetti, fireChallengeBurst },
  haptics: { vibrate, vibrateAchievement, vibrateError },
  auth: { user, signIn, signOut, loading },
  theme: { theme, setTheme },
  isMobile: boolean,
  getCatReaction: (catId: string) => CatReaction | undefined,
}
```

---

### useCatFarmUIState

UI state management:

```typescript
{
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedCat: Cat | null;
  setSelectedCat: (cat: Cat | null) => void;
  showDailyRewardsModal: boolean;
  setShowDailyRewardsModal: (show: boolean) => void;
  // ... more modal/dialog states
}
```

---

## Progress Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       User Action                                │
│              (e.g., trainCat, breedCats, catShow)               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Domain Hook                                  │
│   (useTraining, useBreeding, useCatShows)                       │
│   - Updates GameState                                           │
│   - Calls onChallengeProgress()                                 │
│   - Calls logActivity()                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│ useWeeklyChallenges│ │ useDailyObjectives│ │ useBattlePass    │
│ updateProgress()   │ │ updateProgress()   │ │ addXp()          │
└───────────────────┘ └───────────────────┘ └───────────────────┘
            │                 │                 │
            ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Progress Persistence                          │
│   - localStorage (immediate)                                     │
│   - Cloud sync (authenticated users)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Completion Triggers                           │
│   - Achievement unlock (checkAchievements)                      │
│   - Milestone popup (useMilestones)                             │
│   - Confetti burst (useConfetti)                                │
│   - Sound effect (useSound from SoundContext)                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Hook Integration Patterns

### Pattern 1: Progress Reporting

Domain hooks report progress via callback:

```typescript
// In useTraining.ts
const trainCat = useCallback((catId: string, trickId: TrickId) => {
  // ... training logic ...
  
  // Report progress to weekly challenges
  onChallengeProgress?.('train_tricks', 1);
  
  // Log for analytics
  logActivity?.({
    activity_type: 'training',
    activity_description: `Trained ${cat.name} on ${trickId}`,
    metadata: { catId, trickId },
  });
}, [onChallengeProgress, logActivity]);
```

### Pattern 2: Achievement Checking

Achievements are checked after state updates:

```typescript
// In useCatManagement.ts
const addCat = useCallback((type: Cat['type']) => {
  setState(prev => {
    const newState = { ...prev, cats: [...prev.cats, newCat] };
    return checkAchievements(newState);  // Check for unlocks
  });
}, [checkAchievements]);
```

### Pattern 3: Cloud Sync with Race Condition Protection

Cloud save hooks include multi-layer protection against race conditions:

```typescript
// In useCloudSave.ts
const cloudSave = useCallback(async (gameState, kittensBreed, relationships, options) => {
  // Layer 1: Block saves until initial cloud load completes
  if (!isLoadedRef.current) {
    console.warn('[CloudSync] Blocked save: Cloud data not yet loaded');
    return { success: false, error: 'Cloud data not loaded yet' };
  }
  
  // Layer 2: Block empty state saves on day 1 (likely race condition)
  if (gameState.cats.length === 0 && gameState.day === 1 && !options?.isNewUser) {
    console.warn('[CloudSync] Blocked save: Empty state on day 1');
    return { success: false, error: 'Blocked potential race condition save' };
  }
  
  // Layer 3: Pre-save integrity checks (auto-correct corruption)
  const correctedState = { ...gameState };
  const integrityIssues: string[] = [];
  
  if (correctedState.totalMoneyEarned < 0) {
    integrityIssues.push(`totalMoneyEarned: ${correctedState.totalMoneyEarned} → 0`);
    correctedState.totalMoneyEarned = 0;
  }
  
  if (correctedState.money < 0) {
    integrityIssues.push(`money: ${correctedState.money} → 0`);
    correctedState.money = 0;
  }
  
  // Log integrity issues if any were found
  if (integrityIssues.length > 0) {
    console.warn('[CloudSync] Auto-corrected integrity issues:', integrityIssues);
  }
  
  // ... proceed with save
}, []);
```

**Additional Page-Level Guards:**
- `Empire.tsx`: Checks `hasLoadedCloud` before `saveGame()`
- `CatCollection.tsx`: Guards `handlePortraitGenerated` with loading check
- `CatCustomization.tsx`: Guards `handleSave` with loading check
- `useAutoSave.ts`: `enabled` flag must include `hasLoadedCloud`

### Pattern 4: Data Integrity Safeguards

The `addReward` function in `useResources.ts` includes safeguards to prevent corruption:

```typescript
const addReward = useCallback(
  (coins: number, resources?: Partial<Resources>) => {
    // Safeguard: Never allow negative coin rewards
    if (coins < 0) {
      console.warn('[addReward] Attempted to add negative coins:', coins);
      return;
    }
    
    setState((prev) => ({
      ...prev,
      money: prev.money + coins,
      // Safeguard: Ensure totalMoneyEarned only increases
      totalMoneyEarned: Math.max(prev.totalMoneyEarned, prev.totalMoneyEarned + coins),
      resources: { /* ... */ },
    }));
  },
  [setState]
);
```

---

## Testing Strategy

Domain hooks in `src/hooks/game/` have unit tests:

```
src/hooks/game/__tests__/
├── useBreeding.test.ts
├── useBulkActions.test.ts
├── useCatManagement.test.ts
├── useCatShows.test.ts
├── useCostumes.test.ts        # Costume purchase/equip validation
├── useResources.test.ts
└── useTraining.test.ts
```

**Test Coverage Areas:**
- Costume buying with money validation
- Costume equipping with ownership checks
- Costume cleanup on cat sale (single and bulk)
- Resource management safeguards
- Breeding mechanics and compatibility

**Test Setup:**
- Vitest with jsdom environment
- Mocked dependencies via `src/test/mocks/`
- Coverage thresholds: 70% statements/functions/lines, 60% branches

---

## Best Practices

### Creating New Progress Hooks

1. Define state interface and persistence key
2. Implement localStorage persistence (offline-first)
3. Add cloud sync for authenticated users
4. Expose `updateProgress` callback for domain hooks
5. Handle date/period boundaries (daily reset, weekly expiry)

### Integrating with Domain Hooks

1. Add callback to `GameHookDependencies` if needed
2. Call callbacks at appropriate points in domain logic
3. Never import progress hooks directly in domain hooks
4. Maintain unidirectional data flow

### State Updates

1. Use functional setState: `setState(prev => ...)`
2. Always return new objects (immutability)
3. Check achievements after relevant state changes
4. Report progress after successful actions only

---

## Related Documentation

- [PANEL_DATA_FETCHING.md](./PANEL_DATA_FETCHING.md) - Component data patterns
- [COMPONENTS.md](./COMPONENTS.md) - Component architecture
- [GAME_LOGIC.md](./GAME_LOGIC.md) - Game mechanics
- [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) - Cloud storage schema
