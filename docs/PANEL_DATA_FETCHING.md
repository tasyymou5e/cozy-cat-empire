# Panel Data Fetching Patterns

> **Last Updated:** January 2026  
> **Status:** Documented

## Overview

Cat Farm uses two distinct patterns for how panel components receive their data. This document establishes when to use each pattern for consistency and maintainability.

---

## The Two Patterns

### Pattern A: Props-Based (Recommended for Game State)

Panels receive all data and callbacks through props. The parent component (`CatFarm.tsx`) manages state and passes it down.

**Example: `ResourcePanel`**
```tsx
interface ResourcePanelProps {
  resources: GameState['resources'];
  money: number;
  catCount: number;
  onBuyResource: (resource: keyof Resources, cost: number) => void;
  onFeedCats: () => void;
  onUseToys: () => void;
}

export function ResourcePanel({
  resources,
  money,
  catCount,
  onBuyResource,
  onFeedCats,
  onUseToys,
}: ResourcePanelProps) {
  // Component uses only props, no data fetching
}
```

**Characteristics:**
- ✅ Data passed via props from parent
- ✅ Callbacks passed for mutations
- ✅ No internal data fetching hooks
- ✅ Pure presentation + local UI state only
- ✅ Easy to test with mock props

---

### Pattern B: Hook-Based (Recommended for Server State)

Panels receive minimal identifying props (like `userId`) and fetch their own data using custom hooks.

**Example: `FriendsPanel`**
```tsx
interface FriendsPanelProps {
  userId: string | undefined;
}

export function FriendsPanel({ userId }: FriendsPanelProps) {
  const {
    friends,
    pendingRequests,
    loading,
    sendFriendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
  } = useFriends(userId);
  
  // Component fetches its own data via hook
}
```

**Characteristics:**
- ✅ Receives only identity props (userId, catId, etc.)
- ✅ Fetches data internally via custom hook
- ✅ Manages its own loading/error states
- ✅ Encapsulates data logic completely
- ✅ Independent of parent's data structure

---

## When to Use Each Pattern

### Use Pattern A (Props-Based) When:

| Scenario | Example Panels |
|----------|----------------|
| Data is already in game state | `ResourcePanel`, `BreedingPanel`, `TrainingPanel` |
| Data is shared across multiple panels | `StatusBar`, `CatCard` |
| Mutations need central tracking | `ChorePanel` (tracked for objectives) |
| Performance: avoid redundant fetches | Core game data panels |
| Testing is a priority | All game logic panels |

### Use Pattern B (Hook-Based) When:

| Scenario | Example Panels |
|----------|----------------|
| Data is user-specific server state | `FriendsPanel`, `PlayerProfilePanel` |
| Data is independent of game state | `TradingPanel`, `CatGiftingPanel` |
| Panel needs real-time subscriptions | `NotificationCenter` |
| Encapsulation is more important | Social features |
| Panel may be used standalone | Profile editor, settings |

---

## Current Panel Classification

### Props-Based Panels (Pattern A)

| Panel | Props Received | Notes |
|-------|----------------|-------|
| `ResourcePanel` | resources, money, catCount, callbacks | Core game state |
| `BreedingPanel` | cats, cooldown, hasSpace, onBreed | Uses game state + relationship hook ref |
| `TrainingPanel` | cats, treats, toys, day, callbacks | Core game state |
| `ChorePanel` | onDoChore callback only | Minimal props, stateless |
| `MarketPanel` | listings, money, hasSpace, onBuy | Core game state |
| `CostumeShopPanel` | cats, money, ownedCostumes, callbacks | Core game state |
| `AchievementsPanel` | achievements, progress | Core game state |
| `CatShowPanel` | cats, cooldown, money, onEnter | Core game state |
| `BulkActionsPanel` | cats, resources, callbacks | Core game state |

### Hook-Based Panels (Pattern B)

| Panel | Props Received | Hook Used | Notes |
|-------|----------------|-----------|-------|
| `FriendsPanel` | userId | `useFriends` | Server state |
| `PlayerProfilePanel` | userId | `usePlayerProfile` | Server state |
| `TradingPanel` | userId, cats, money, resources | `useTrading` | Hybrid: props + hook |
| `CatGiftingPanel` | userId, cats, callbacks | `useCatGifts` | Hybrid: props + hook |
| `GlobalLeaderboardPanel` | - | `useGlobalLeaderboard` | Fully independent |
| `WeeklyChallengesPanel` | - | `useWeeklyChallenges` | Fully independent |
| `DailyRewardsPanel` | onClaim callback | `useDailyLoginRewards` | Hybrid |
| `LeaderboardRewardsPanel` | userId | `useLeaderboardRewards` | Server state |

### Hybrid Panels

Some panels use both patterns - receiving core game data via props while fetching supplementary server data internally:

```tsx
// TradingPanel: Hybrid approach
interface TradingPanelProps {
  userId?: string;          // Identity for hook
  cats: Cat[];              // Game state via props
  money: number;            // Game state via props
  resources: Resources;     // Game state via props
  onTradeComplete: (...) => void;  // Callback for game state changes
  catCostumes: Record<string, string>;
}

export function TradingPanel({ userId, cats, money, ... }: TradingPanelProps) {
  // Hook for server state (trade offers)
  const { offers, sendOffer, acceptOffer, ... } = useTrading(userId);
  
  // Props for game state (cats, money)
  // Combines both patterns
}
```

---

## Best Practices

### For Props-Based Panels

1. **Document all props with JSDoc**
   ```tsx
   interface PanelProps {
     /** Current resource amounts */
     resources: Resources;
     /** Callback when buying a resource */
     onBuyResource: (resource: keyof Resources, cost: number) => void;
   }
   ```

2. **Keep callbacks typed precisely**
   ```tsx
   // Good: Specific callback signature
   onBreed: (cat1Id: string, cat2Id: string) => void;
   
   // Avoid: Generic callback
   onAction: (...args: unknown[]) => void;
   ```

3. **Use the `dispatchAction` pattern for game state mutations**
   ```tsx
   onBreed={(cat1Id, cat2Id) => dispatchAction(GameActions.BREED_CATS, { cat1Id, cat2Id })}
   ```

### For Hook-Based Panels

1. **Handle loading states**
   ```tsx
   if (loading) {
     return <PanelSkeleton rows={4} />;
   }
   ```

2. **Handle error states gracefully**
   ```tsx
   if (error) {
     return <ErrorMessage message="Failed to load friends" onRetry={refetch} />;
   }
   ```

3. **Handle unauthenticated state**
   ```tsx
   if (!userId) {
     return <LoginPrompt message="Log in to view friends" />;
   }
   ```

4. **Provide loading feedback for mutations**
   ```tsx
   const [sending, setSending] = useState(false);
   
   const handleSend = async () => {
     setSending(true);
     await sendRequest();
     setSending(false);
   };
   ```

---

## Adding New Panels

When creating a new panel, follow this decision tree:

```
Does the panel need data from Supabase/server?
├── No → Use Pattern A (Props-Based)
│   └── Receive all data and callbacks via props
│
└── Yes → Is the data part of core game state (cats, money, resources)?
    ├── Yes → Use Pattern A + have parent fetch/manage
    │
    └── No → Is the data user-specific and independent?
        ├── Yes → Use Pattern B (Hook-Based)
        │   └── Create/use a custom hook for data fetching
        │
        └── Mixed → Use Hybrid approach
            └── Props for game state, hook for server state
```

---

## Migration Guide

If converting a panel from one pattern to another:

### Props → Hook-Based

1. Create or identify the appropriate data hook
2. Remove data props, keep only identity props (userId)
3. Add internal hook call
4. Add loading/error handling
5. Update parent component to stop passing data

### Hook → Props-Based

1. Move hook call to parent component
2. Add props interface for data and callbacks
3. Remove internal hook call
4. Pass data and callbacks from parent
5. Consider memoization if data is large

---

## Related Documentation

- [Components Guide](./COMPONENTS.md) - Component architecture
- [Architecture Audit](./ARCHITECTURE_AUDIT.md) - Codebase improvements
- [Game Logic](./GAME_LOGIC.md) - Game state management
