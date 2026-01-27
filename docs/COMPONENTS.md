# Cat Farm - Component Architecture

## Overview
Cat Farm uses a modular component architecture with 82+ game components, 44 custom hooks, 45+ UI components (40+ shadcn/ui primitives + custom components), and supporting components for error handling and navigation.

---

## Main Game Components

### CatFarm.tsx (Master Orchestrator)
The central component that manages all game panels and state.

**Location:** `src/components/game/CatFarm.tsx`

**Responsibilities:**
- Initializes all game hooks (useGameState, useSoundEffects, useConfetti, etc.)
- Manages tab-based sidebar layout
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
- `showStars?: boolean`

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

### PaperCatAvatar.tsx
High-quality vector cat avatar using Paper.js with animated costume support.

**Props:**
- `cat: Cat`
- `equippedCostumeId?: string`
- `size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'`
- `showCostume?: boolean`
- `animated?: boolean`
- `className?: string`

### AnimatedCostumeSVG.tsx
Renders costume overlays with animated effects (glows, sparkles, flowing).

**Props:**
- `costume: VectorCostume`
- `size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'`
- `isAnimated?: boolean`
- `className?: string`

**Features:**
- CSS animation classes for glow, flow, shimmer, rainbow effects
- Particle system for sparkles, stars, hearts, magic particles
- Respects `prefers-reduced-motion` and graphics config

### CatVisual.tsx
Unified cat visual component for consistent display.

### CatPortrait.tsx
AI portrait generation and display with confirmation dialogs.

**Props:**
- `cat: Cat`
- `equippedCostumeId?: string`
- `onPortraitGenerated?: (catId: string, portraitUrl: string) => void`

**States:** `idle`, `generating`, `complete`, `error`

**Features:**
- Falls back to CatAvatar if no portrait
- Confirmation dialog before generation (shows credit cost)
- Outdated portrait detection via appearance hash
- Generate/Regenerate/Update buttons
- Tier-based border styling
- Error display with retry option

### BatchPortraitGenerator.tsx
Batch generate portraits for multiple cats at once.

**Props:**
- `cats: Cat[]`
- `catCostumes: Record<string, string>`
- `onPortraitGenerated?: (catId: string, portraitUrl: string) => void`

**Features:**
- Identifies cats needing portraits (no portrait or outdated)
- Confirmation dialog with total count and estimated cost
- Progress tracking during generation
- Results summary with success/failure counts
- Abort functionality during batch processing

### UnifiedCatCard.tsx
Alternative cat card implementation with unified styling.

### CatCardReaction.tsx
Animated reaction display for cat cards.

---

## Skeleton Components

### CatCardSkeleton.tsx
Loading skeleton for cat cards.

**Props:**
- `compact?: boolean`

### CatGridSkeleton.tsx
Loading skeleton for cat grids.

**Props:**
- `count?: number`
- `compact?: boolean`

### PanelSkeleton.tsx
Loading skeleton for panels.

**Props:**
- `rows?: number`
- `showHeader?: boolean`
- `showButtons?: boolean`

### StatusBarSkeleton.tsx
Loading skeleton for status bar.

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

### TradingCard.tsx
Display trading card for cats.

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
View all cat relationships with maintenance features.

**Props:**
```typescript
interface RelationshipPanelProps {
  cats: Cat[];
  relationships: CatRelationship[];
  groups: CatGroup[];
  events: RelationshipEvent[];
  catCostumes?: Record<string, string>;
  currentDay?: number;
  maintenanceStreak?: number;
  needsAttentionCount?: number;
}
```

**Tabs (5):**
- Bonds - Filtered relationship list with warning badges
- Calendar - SocialCalendarPanel integration
- Network - RelationshipNetworkGraph
- Groups - Social group cards
- History - Event timeline

**Displays:**
- Maintenance streak badge (🔥)
- Needs attention count badge
- Friend/rival count badges
- Decay warning badges on each relationship
- Last interaction display

### RelationshipNetworkGraph.tsx
Visual network graph of cat relationships.

### SocialCalendarPanel.tsx
Dedicated view for relationship maintenance prioritization.

**Props:**
```typescript
interface SocialCalendarPanelProps {
  cats: Cat[];
  relationships: CatRelationship[];
  currentDay: number;
  catCostumes?: Record<string, string>;
  onSocialize?: (cat1Id: string, cat2Id: string) => void;
}
```

**Features:**
- Groups relationships by urgency (Urgent/Warning/Attention/Healthy)
- Shows decay status with color-coded badges
- Visual cat pairs with avatars
- Summary badges at top

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

### LeaderboardHistoryChart.tsx
Historical ranking visualization.

### LeaderboardRewardsPanel.tsx
Claim periodic leaderboard rewards.

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

### ProfileSetupDialog.tsx
New user profile setup dialog.

### CatGiftingPanel.tsx
Gift cats to friends.

**Features:**
- Select cat to gift
- Choose recipient from friends
- Optional message
- Track sent/received gifts

### GiftReceivedDialog.tsx
Dialog popup when receiving a gift.

### TradeReceivedDialog.tsx
Dialog popup when receiving a trade offer.

### NotificationCenter.tsx
Real-time notification dropdown.

**Notification Types:**
- Friend requests
- Cat gifts received
- Trade offers
- Challenge completions

### NotificationSettings.tsx
Push notification preferences.

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
- **Restore from Cloud** - Manual recovery button with confirmation dialog for suspected data sync issues

### BulkActionsPanel.tsx
Mass cat management operations.

**Features:**
- Heal All Sick
- Rest All Tired
- Comfort All Unhappy
- Train All Available
- Bulk Sell Selected

---

## Animation Components

### RelationshipAnimations.tsx
Floating emoji animations for relationship events.

**Animations:**
- Heart (+positive)
- Broken heart (-negative)
- Sparkles (best friends)

### RelationshipParticles.tsx
Particle effects for relationships.

### MoodAnimations.tsx
Cat mood indicators.

**Moods:**
- Happy (bouncing)
- Sad (drooping)
- Hungry (food icon)
- Sick (medicine icon)

### CatActivityPopups.tsx
Activity notification popups.

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

### AnnouncementBanner.tsx
System-wide announcement display.

---

## UI Primitives (shadcn/ui)

Located in `src/components/ui/`:

- accordion.tsx
- alert-dialog.tsx
- alert.tsx
- AnimatedBackground.tsx
- aspect-ratio.tsx
- avatar.tsx
- badge.tsx
- breadcrumb.tsx
- button.tsx
- calendar.tsx
- card.tsx
- carousel.tsx
- chart.tsx
- checkbox.tsx
- collapsible.tsx
- command.tsx
- context-menu.tsx
- dialog.tsx
- drawer.tsx
- dropdown-menu.tsx
- FloatingDecorations.tsx
- form.tsx
- GlassCard.tsx
- hover-card.tsx
- input-otp.tsx
- input.tsx
- label.tsx
- LoadingCat.tsx
- menubar.tsx
- navigation-menu.tsx
- pagination.tsx
- popover.tsx
- progress.tsx
- radio-group.tsx
- resizable.tsx
- scroll-area.tsx
- select.tsx
- separator.tsx
- sheet.tsx
- sidebar.tsx
- skeleton.tsx
- slider.tsx
- sonner.tsx
- switch.tsx
- table.tsx
- tabs.tsx
- textarea.tsx
- toast.tsx / toaster.tsx
- toggle-group.tsx
- toggle.tsx
- tooltip.tsx

---

## Navigation Components

### CategoryTabBar.tsx
Grouped two-tier tab navigation with 5 categories.

**Props:**
- `activeTab: string`
- `onTabChange: (tab: string) => void`
- `highlightedTab?: string`
- `badges?: Record<string, number>`

**Categories:** Farm, Cats, Social, Progress, Settings

### QuickAccessMenu.tsx
Quick access dropdown in header with recent tabs.

**Features:**
- Recent tabs section (last 4 visited)
- External page links
- Settings shortcut

### MobileBottomNav.tsx
Bottom navigation bar for mobile devices.

**Props:**
- `activeTab: string`
- `onTabChange: (tab: string) => void`
- `badges?: Record<string, number>`
- `onMoreClick: () => void`

### MobileMenuSheet.tsx
Full-screen mobile menu sheet.

### Breadcrumbs.tsx
Breadcrumb navigation for external pages.

---

## Settings Components

### GraphicsSettingsPanel.tsx
Runtime graphics settings UI.

**Settings Available:**
- Enable animations
- Enable particles
- Enable tier glows
- Avatar quality (low/medium/high)
- Card border style
- Portrait priority
- Costume animations
- Reduced motion

---

## Error Handling Components

### ErrorBoundary.tsx
React error boundary wrapper.

**Features:**
- Catches React component errors
- Logs to error_logs table with rate limiting
- Shows user-friendly fallback UI
- Retry button

### ErrorLoggerProvider.tsx
Global error handler provider.

**Captures:**
- Uncaught exceptions
- Unhandled promise rejections
- User interactions for correlation
- **Rate limiting**: 10 errors per minute max

---

## Stats Components

Located in `src/components/stats/`:

- AchievementShowcase.tsx
- CategoryPerformanceChart.tsx
- LeaderboardRankings.tsx
- RankProgressionChart.tsx
- RewardsHistory.tsx
- StatsOverviewCards.tsx
- WealthProgressionChart.tsx

---

## Admin Components

Located in `src/components/admin/`:

- ActivityFeed.tsx
- AdminLayout.tsx
- AdminRoute.tsx
- BulkActionsBar.tsx
- ChallengeForm.tsx
- ExportButton.tsx
- UserDetailModal.tsx

---

## Empire Components

Located in `src/components/empire/`:

### EmpireScene.tsx
Interactive cat dwelling visualization.

**Features:**
- Zone-based backgrounds matching house tier
- Roaming cats with AI movement
- Depth-based z-indexing (cats lower on screen appear in front)
- Quick interaction menu on cat click

**Props:**
- `cats: Cat[]`
- `houseSize: HouseSize`
- `catCostumes: Record<string, string>`
- `onPet: (catId: string) => void`
- `onFeed: (catId: string) => void`
- `onPlay: (catId: string) => void`

### RoamingCat.tsx
Individual roaming cat wrapper with movement animation.

**Features:**
- CSS-based position transitions
- Facing direction (left/right flip)
- Popover interaction menu on click
- Walking state animation

### EmpireInteractionMenu.tsx
Quick action popover for cats in Empire view.

**Actions:**
- Pet (+5 happiness)
- Feed (-1 food, +15 hunger)
- Play (-1 toy, +10 happiness)
- View Details
- Photo Booth

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
│                           ├── CatRelationships
│                           ├── Empire (→ EmpireScene)
│                           ├── Leaderboard
│                           ├── Stats
│                           ├── AdminAuth
│                           ├── admin/* (AdminRoute wrapped)
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
