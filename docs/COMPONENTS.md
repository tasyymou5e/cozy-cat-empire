# Cat Farm - Component Architecture

## Overview
Cat Farm uses a modular component architecture with 35+ game components, UI primitives from shadcn/ui, and supporting components for error handling and navigation.

---

## Main Game Components

### CatFarm.tsx (Master Orchestrator)
The central component that manages all game panels and state.

**Location:** `src/components/game/CatFarm.tsx`

**Responsibilities:**
- Initializes all game hooks (useGameState, useSoundEffects, useConfetti, etc.)
- Manages 15-tab sidebar layout
- Audio controls and theme switching
- Cloud save synchronization
- Notification center integration
- VIP badge display
- Daily rewards modal

**Key Props Passed Down:**
- `state` - Full GameState object
- `actions` - All game action handlers
- `playSound` - Sound effect trigger function
- `relationshipSystem` - Cat relationships manager

---

## Cat Display Components

### CatCard.tsx
Displays individual cat information with interactive elements.

**Features:**
- Cat stats (health, happiness, hunger, grade)
- Relationship indicators
- Trick progress badges
- Costume display
- Comfort button for upset cats
- Heal and Sell action buttons

### CatDetailModal.tsx
Full-screen modal for detailed cat view.

**Features:**
- Complete stat breakdown
- Trick list with progress bars
- Relationship graph
- Training history
- Costume equip interface

### GradeBadge.tsx
Visual grade tier indicator.

**Props:**
- `grade: number` (1-20)
- `size?: 'sm' | 'md' | 'lg'`

**Tier Colors:**
- Common (1-4): Gray
- Fine (5-8): Green
- Rare (9-12): Blue
- Elite (13-16): Purple
- Legendary (17-20): Gold

---

## Action Panels

### ActionPanel.tsx
Primary actions for cat management.

**Actions:**
- Add Stray Cat ($0)
- Adopt Cat ($50)
- Buy Pure Breed ($200)
- Advance to Next Day

### ChorePanel.tsx
Earn money through daily tasks.

**Chore Types:**
- Clean Litter ($15 base)
- Groom Cats ($25 base)
- Play Session ($20 base)
- Vet Checkup ($40 base)
- Socialize ($30 base)

### ResourcePanel.tsx
Resource management and purchasing.

**Resources:**
- Food (10 coins per 5 units)
- Medicine (25 coins per 5 units)
- Toys (15 coins per 5 units)
- Treats (8 coins per 5 units)

---

## Market & Commerce

### MarketPanel.tsx
Buy cats from NPC sellers.

**Features:**
- 4 rotating listings (refresh every 3 days)
- Multiple sellers: Happy Paws Shelter, Elite Breeders, etc.
- Cat preview with stats and price

### CostumeShopPanel.tsx
Purchase and equip cat costumes.

**Categories:**
- Hats (8 costumes)
- Outfits (4 costumes)
- Accessories (4 costumes)
- Special (4 costumes)
- VIP Exclusive (3 costumes - streak locked)

### TradingPanel.tsx
Player-to-player trading.

**Features:**
- Create trade offers
- Offer cats and/or money
- Request money in return
- Accept/decline/cancel trades
- 7-day expiration

---

## Breeding & Training

### BreedingPanel.tsx
Cat breeding interface.

**Requirements:**
- 2+ cats of opposite or compatible types
- No active breeding cooldown
- Relationship compatibility check

### TrainingPanel.tsx
Teach tricks to cats.

**Tricks Available:**
- Sit, Paw, Roll Over, Jump, Fetch
- Each requires treats and rest level
- Grade determines progress rate

---

## Social & Relationship Panels

### SocializePanel.tsx
Manual cat socialization.

**Features:**
- Select two cats to socialize
- Personality compatibility affects bonus
- Costs resources

### MatchmakingPanel.tsx
AI-suggested cat pairings.

**Algorithms:**
- Personality compatibility
- Breeding potential
- Relationship improvement opportunities

### GroupActivitiesPanel.tsx
Group bonding activities.

**Activities:**
- Group play sessions
- Nap parties
- Treat sharing

### RelationshipPanel.tsx
View all cat relationships.

**Displays:**
- Relationship matrix
- Friend/enemy counts
- Social groups/cliques

---

## Leaderboard & Competition

### LeaderboardPanel.tsx
Local cat rankings.

**Categories:**
- By grade
- By show wins
- By value

### GlobalLeaderboardPanel.tsx
Cross-player competition.

**Categories:**
- Show Wins
- Cats Owned
- Kittens Bred
- Money Earned
- Achievements

### CatShowPanel.tsx
Cat show entry and management.

**Show Tiers:**
- Local (no requirements)
- Regional (5+ wins)
- National (15+ wins)
- Championship (30+ wins)

---

## Social Features

### FriendsPanel.tsx
Friend management.

**Features:**
- Send friend requests
- Accept/decline requests
- View friend stats
- Remove friends

### PlayerProfilePanel.tsx
Edit player profile.

**Editable Fields:**
- Display name
- Avatar emoji

### CatGiftingPanel.tsx
Gift cats to friends.

**Features:**
- Select cat to gift
- Choose recipient from friends
- Optional message
- Track sent/received gifts

### NotificationCenter.tsx
Real-time notification dropdown.

**Notification Types:**
- Friend requests
- Cat gifts received
- Trade offers
- Challenge completions

---

## Progress & Rewards

### AchievementsPanel.tsx
Track unlocked achievements.

**Categories:**
- Cat collection
- Show wins
- Breeding
- Property upgrades
- Social achievements
- VIP milestones

### DailyRewardsPanel.tsx
Daily login rewards.

**Features:**
- 7-day reward cycle
- Streak tracking
- VIP tier display and multipliers
- Next tier progress

### WeeklyChallengesPanel.tsx
Weekly challenge tracking.

**Challenge Types:**
- Win shows
- Breed kittens
- Collect cats
- Earn money
- Train tricks

---

## Utility Components

### StatusBar.tsx
Game status display (React.forwardRef).

**Displays:**
- Money
- Current day
- House size
- Cat count / capacity
- Next show countdown

### MessageBar.tsx
Game notifications (React.forwardRef).

**Message Types:**
- info (blue)
- success (green)
- warning (yellow)
- error (red)

### SaveLoadPanel.tsx
Local save management.

**Features:**
- Manual save/load
- Export/import JSON
- Cloud sync status

---

## Animation Components

### RelationshipAnimations.tsx
Floating emoji animations for relationship events.

**Animations:**
- Heart (+positive)
- Broken heart (-negative)
- Sparkles (best friends)

### MoodAnimations.tsx
Cat mood indicators.

**Moods:**
- Happy (bouncing)
- Sad (drooping)
- Hungry (food icon)
- Sick (medicine icon)

### ChallengeProgressAnimation.tsx
Challenge completion celebration.

### ComfortButton.tsx
20-second hold timer for comforting upset cats.

---

## Tutorial & Help

### TutorialSystem.tsx
New player onboarding.

**Steps:**
1. Welcome message
2. Get first cat
3. Feed and care
4. Enter cat show
5. Upgrade home

### KeyboardShortcutsHelp.tsx
Keyboard shortcuts modal.

**Shortcuts:**
- F - Feed cats
- N - Next day
- S - Save game
- 1-9 - Switch tabs
- ? - Show help

### DailyEventToast.tsx
Daily random event notifications.

---

## Trading Card Components

### TradingCard.tsx
Static trading card display.

### FlippableTradingCard.tsx
Interactive flip animation card.

---

## UI Primitives (shadcn/ui)

Located in `src/components/ui/`:

- accordion.tsx
- alert-dialog.tsx
- alert.tsx
- avatar.tsx
- badge.tsx
- button.tsx
- card.tsx
- checkbox.tsx
- dialog.tsx
- dropdown-menu.tsx
- form.tsx
- input.tsx
- label.tsx
- popover.tsx
- progress.tsx
- scroll-area.tsx
- select.tsx
- separator.tsx
- slider.tsx
- switch.tsx
- tabs.tsx
- toast.tsx / toaster.tsx
- tooltip.tsx

---

## Error Handling Components

### ErrorBoundary.tsx
React error boundary wrapper.

**Features:**
- Catches React component errors
- Logs to error_logs table
- Shows user-friendly fallback UI
- Retry button

### ErrorLoggerProvider.tsx
Global error handler provider.

**Captures:**
- Uncaught exceptions
- Unhandled promise rejections
- User interactions for correlation

---

## Component Hierarchy

```
App.tsx
├── ErrorBoundary
│   └── ErrorLoggerProvider
│       └── AuthProvider
│           └── ThemeProvider
│               └── SoundProvider
│                   └── Router
│                       ├── Index (→ CatFarm)
│                       ├── Auth
│                       ├── CatCollection
│                       ├── Leaderboard
│                       ├── Stats
│                       └── NotFound
```

---

## Best Practices

### Component Guidelines
1. Keep components focused and single-responsibility
2. Use TypeScript interfaces for all props
3. Prefer controlled components
4. Use semantic design tokens (not hardcoded colors)
5. Implement proper loading and error states
6. Use React.memo for expensive renders
7. Use React.forwardRef when exposing refs

### State Management
1. Local state for UI-only concerns
2. useGameState for game logic
3. Context for auth and sound
4. Custom hooks for feature logic
