# Cat Farm - Component Architecture

## Overview
Cat Farm uses a modular component architecture with 45+ game components, 29 custom hooks, UI primitives from shadcn/ui, and supporting components for error handling and navigation.

---

## Main Game Components

### CatFarm.tsx (Master Orchestrator)
The central component that manages all game panels and state.

**Location:** `src/components/game/CatFarm.tsx`

**Responsibilities:**
- Initializes all game hooks (useGameState, useSoundEffects, useConfetti, etc.)
- Manages 16-tab sidebar layout
- Audio controls and theme switching
- Cloud save synchronization
- Notification center integration
- VIP badge display
- Daily rewards modal
- What's New popup for returning players

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
- **Inline rename feature** with pencil icon
- **Random name generator** with breed/personality-based suggestions

**Rename Feature:**
- Click pencil icon to enter edit mode
- Shuffle button generates random names based on:
  - Breed-specific names (Japanese for Siamese, Royal for Persian, etc.)
  - Personality-based names (Snoozer for Lazy, Zoom for Playful)
  - Universal fallback names
- Confirm with checkmark, cancel with X

**Props:**
- `cat: Cat` - Cat data
- `onSell?: (catId: string) => void`
- `onHeal?: (catId: string) => void`
- `onComfort?: (catId: string) => void`
- `onRename?: (catId: string, newName: string) => void`
- `compact?: boolean`
- `relationships?: CatRelationship[]`
- `allCats?: Cat[]`
- `equippedCostumeId?: string`
- `reaction?: { type: 'positive' | 'negative', emoji: string }`

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

### CatAvatar.tsx
Cat avatar display with costume support.

**Props:**
- `cat: Cat`
- `costumeId?: string`
- `size?: 'sm' | 'md' | 'lg' | 'xl'`
- `showPose?: boolean`

### CatPortrait.tsx
Cat portrait display component for generated portraits.

**Props:**
- `cat: Cat`
- `portraitUrl?: string`
- `showFallback?: boolean`

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

## Photo Booth Components

### PhotoBooth.tsx
Interactive photo taking interface.

**Location:** `src/components/game/PhotoBooth.tsx`

**Features:**
- Background selection (16 options: nature, fantasy, seasonal, solid)
- Cat pose selection (7 poses)
- Frame selection (7 frame styles)
- Sticker placement (24 stickers across 5 categories)
- Draggable sticker positioning with scale/rotation
- Export options: download, copy, share, save to gallery

**Props:**
- `cat: Cat`
- `equippedCostumeId?: string`

### GalleryPhotoCard.tsx
Photo display card with actions.

**Features:**
- Photo thumbnail with cat name
- Favorite toggle
- Delete button
- Click to open lightbox

**Props:**
- `photo: GalleryPhoto`
- `onToggleFavorite: (id: string) => void`
- `onDelete: (id: string) => void`
- `onClick: (photo: GalleryPhoto) => void`

### PhotoLightbox.tsx
Full-screen photo viewer.

**Features:**
- Full-resolution photo display
- Navigation between photos
- Photo metadata display
- Share and download options

### DraggableSticker.tsx
Draggable stickers for photo customization.

**Features:**
- Drag to reposition
- Click to select/deselect
- Remove button on selection
- Scale and rotation support

**Props:**
- `sticker: PlacedSticker`
- `onUpdate: (id: string, updates: Partial<PlacedSticker>) => void`
- `onRemove: (id: string) => void`
- `containerRef: RefObject<HTMLElement>`

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
16-step new player onboarding with category badges.

**Categories:**
- `basics` - Core gameplay (welcome, first cat, caring, earning, expanding)
- `economy` - Money and resources (earning money)
- `cats` - Cat management (grades, costumes, breeding, relationships)
- `social` - Multiplayer features (friends, trading, challenges)
- `features` - Advanced features (bulk actions, photo booth, cloud save)

**Steps (16 total):**
1. Welcome to Cat Farm!
2. Getting Your First Cat
3. Caring for Your Cats
4. Earning Money
5. Cat Grades & Training
6. Dress Up Your Cats
7. Breeding Kittens
8. Cat Relationships
9. Bulk Actions
10. Make Friends & Trade
11. Weekly Challenges
12. Photo Booth & Portraits
13. Cat Collection
14. Save Your Progress
15. Expanding Your Empire
16. You're Ready!

### WhatsNewPopup.tsx
Changelog popup for returning players.

**Features:**
- Shows new features since last visit
- Version-based tracking via localStorage
- Category badges (major, feature, improvement)
- Styled version sections with highlights
- Manual "What's New" button in header

**Version Tracking:**
- `cat-farm-last-seen-version` in localStorage
- Only shows after tutorial is complete
- Displays 1-2 most recent versions

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

## Bulk Actions & Leaderboard Components

### BulkActionsPanel.tsx
Mass cat management operations panel.

**Features:**
- Status summary badges (sick/tired/unhappy/trainable counts)
- Heal All, Rest All, Comfort All, Train All buttons
- Multi-select mode for bulk selling
- Resource cost display on buttons
- Confirmation dialog for irreversible sales

### LeaderboardHistoryChart.tsx
Historical ranking visualization.

**Features:**
- Line chart showing rank progression over time
- Category-based filtering
- Current rank and best rank display
- Trend indicator (up/down/steady)

### LeaderboardRewardsPanel.tsx
Leaderboard reward claiming interface.

**Features:**
- Daily/weekly/monthly reward tiers
- Individual and "Claim All" buttons
- Reward structure information
- Coin and badge rewards display

### NotificationSettings.tsx
Push notification preferences management.

**Features:**
- Toggle settings for different notification types
- Push notification subscription/unsubscription
- Per-category preferences (friends, gifts, trades)

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
│                   └── CatReactionProvider
│                       └── Router
│                           ├── Index (→ CatFarm)
│                           ├── Auth
│                           ├── CatCollection
│                           ├── CatPhotoBooth
│                           ├── CatGallery
│                           ├── CatCustomization
│                           ├── Leaderboard
│                           ├── Stats
│                           └── NotFound
```

---

## Best Practices

### Component Design
- Keep components focused and single-purpose
- Use TypeScript interfaces for props
- Prefer composition over inheritance
- Use React.memo for expensive renders

### State Management
- Local state for UI-only concerns
- useGameState for game logic
- Context for cross-cutting concerns (auth, sound)
- React Query for server state

### Code Organization
- One component per file
- Co-locate tests and styles
- Export from index files
- Use barrel imports
