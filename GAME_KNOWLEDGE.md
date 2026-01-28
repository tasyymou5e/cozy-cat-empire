# Cat Farm Game - Knowledge Base

> **📚 Full Documentation:** See `/docs/` folder for comprehensive documentation:
> - [docs/COMPONENTS.md](docs/COMPONENTS.md) - Component architecture
> - [docs/GAME_LOGIC.md](docs/GAME_LOGIC.md) - Game mechanics & flow
> - [docs/DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md) - Database schema
> - [docs/SECURITY.md](docs/SECURITY.md) - Security & RLS policies
> - [docs/TECH_STACK.md](docs/TECH_STACK.md) - Technology stack
> - [docs/ERROR_LOGGING.md](docs/ERROR_LOGGING.md) - Error logging system
> - [docs/SOCIAL_FEATURES.md](docs/SOCIAL_FEATURES.md) - Social & multiplayer features
> - [docs/GAMIFICATION_IMPROVEMENTS_PLAN.md](docs/GAMIFICATION_IMPROVEMENTS_PLAN.md) - Gamification systems plan

## Overview
Cat Farm is a browser-based idle/management game where players build a cat empire. Start with a small apartment and grow to own a 100-acre farm with dozens of cats. Features cloud saves, global leaderboards, social features, cat gifting, player trading, VIP rewards, weekly challenges, photo booth, and cat customization.

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
  appearance?: CatAppearance; // Custom appearance options
  portraitUrl?: string; // AI-generated portrait
  appearanceHash?: string; // Hash for detecting outdated portraits
  specialization?: 'show_star' | 'social_butterfly' | 'dynasty_builder'; // Specialization path
}
```

**Breeds (by value):**
- Stray ($30) → Tabby ($80) → Persian ($200) → Siamese ($180) → Maine Coon ($250) → British Shorthair ($220) → Ragdoll ($280) → Bengal ($350)

**Personalities:**
- Lazy, Playful, Affectionate, Independent, Curious, Shy

### 2. Cat Appearance System (`src/types/catAppearance.ts`)

**Appearance Options:**
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

**Fur Colors:** orange, black, white, gray, brown, cream, ginger, calico
**Patterns:** solid, tabby, spotted, tuxedo, bicolor, calico
**Eye Colors:** green, blue, amber, gold, heterochromia, copper
**Hair Lengths:** short, medium, fluffy
**Facial Features:** normal, scar, eyepatch, whiskers_long, grumpy, cute_blush

### Appearance Inheritance (`src/lib/appearanceInheritance.ts`)

When breeding cats, kittens inherit visual traits from their parents:

**Inheritance Rules:**
| Trait | Parent 1 | Parent 2 | Mutation |
|-------|----------|----------|----------|
| Fur Color | 45% | 45% | 10% |
| Pattern | 45% | 45% | 10% |
| Eye Color | 45% | 45% | 10% |
| Hair Length | Dominance (fluffy > medium > short) | | 10% |
| Facial Feature | 10% | 5% | 5% |

**Relationship Bonus Effects:**
- Best friends (>20 bonus): 5% mutation (stable genetics)
- Good friends (>10 bonus): 8% mutation
- Neutral: 10% mutation (default)
- Rivals (<0 bonus): 15% mutation (unstable genetics)

### 3. Grading System (`src/types/grading.ts`)

**Grade Tiers (1-20):**
- Tiers: common (1-4), fine (5-8), rare (9-12), elite (13-16), legendary (17-20)
- Colors: gray → green → blue → purple → gold
- Stars: 0-5 based on grade

**Tricks:**
- Sit, Paw, Roll Over, Jump, Fetch
- Each has difficulty (1-5), grade bonus, and show bonus
- Progress 0-100 per trick, needs 100 to learn

### 4. Relationship System (`src/types/relationships.ts`, `src/hooks/useRelationships.ts`)

**Relationship Scores:**
- -100 to +100 scale
- Friends (20+), Best Friends (60+)
- Rivals (-20 to -59), Enemies (-60 to -100)

**Features:**
- Dynamic events affect scores
- Compatibility affects breeding success
- Groups form automatically among friends
- Happiness modifiers based on relationships
- **Relationship Decay System** - relationships deteriorate over time without interaction
- **Warning Badges** - ⚠️ icons show relationships needing attention (2+ days inactive)
- **Last Interaction Display** - shows "X days ago" on relationship cards
- **Decay Prevention Reminder** - toast notifications when relationships are fading
- **Maintenance Streak** - tracks consecutive days all friendships are maintained
- **Social Calendar** - dedicated view grouping relationships by urgency

**Relationship Decay Rules:**
| Days Since Interaction | Decay Amount | Effect |
|------------------------|--------------|--------|
| 3+ days | -1 point/day | Slow fade |
| 5+ days | -2 points/day | Noticeable decline |
| 7+ days | -3 points/day | Significant deterioration |

- **Grace Period**: 3 days before decay starts
- **Minimum Threshold**: Decay stops at -20 (rival level) - won't create enemies automatically
- **Decay Events**: Generated when relationship level drops due to decay

### 5. Game State (`src/hooks/useGameState.ts`)

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

### 6. Sound System (`src/hooks/useSoundEffects.ts`)

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

### 7. Confetti System (`src/hooks/useConfetti.ts`)

**Triggers:**
- Achievements unlock → Star confetti
- Cat show wins → Big celebration burst
- Challenge completions → Challenge burst

### 8. Graphics Settings System

**Files:**
- `src/config/graphics.ts` - Default configuration and tier visuals
- `src/hooks/useGraphicsSettings.ts` - Runtime settings hook with localStorage persistence
- `src/components/game/GraphicsSettingsPanel.tsx` - Settings UI component

**17 Configurable Options:**

| Category | Settings |
|----------|----------|
| Performance | Avatar Quality (low/medium/high), Enable Animations, Force Reduced Motion |
| Effects | Costume Animations, Particle Effects, Tier Glows, Sparkle Effects, Card Flip Animation |
| Display | Card Border Style (tier/simple/none), Prefer AI Portraits, Show Costume on Portrait, Costume Rendering (auto/vector/emoji) |
| Portraits | Portrait Quality (standard/premium), Show Outdated Indicator, Auto-Prompt Outdated |
| Hidden | Vector Engine (paperjs/simple), Avatar Breed Features |

**Key Features:**
- localStorage persistence with version tracking (`cat-farm-graphics-settings`)
- Respects `prefers-reduced-motion` system accessibility preference
- `effectiveAnimations` computed value for easy consumption in components
- Reset to defaults button
- Performance presets: Maximum Quality, Balanced, Performance Mode
- **Portrait Quality**: Premium uses `gemini-3-pro-image-preview` for higher quality AI portraits

**Hook API:**
```typescript
const { settings, updateSetting, resetToDefaults, isReducedMotion, effectiveAnimations } = useGraphicsSettings();
```

**Performance Impact Estimates:**
- Disabling animations: ~15% CPU savings during idle
- Low avatar quality: ~40% rendering cost reduction per tier step
- Disabling particles: ~8% GPU savings
- Disabling tier glows: ~5% GPU savings

See [Graphics Settings Documentation](./docs/GRAPHICS_SETTINGS.md) for full details on all settings.

### 8.1. AI Portrait System

**Enhanced Portrait Generation:**
The AI portrait system uses comprehensive prompt engineering to ensure portraits **exactly match** cat properties:

**Edge Function:** `supabase/functions/generate-cat-portrait/index.ts`

**Prompt Components:**
1. **STYLE_PROMPT** - Consistent "Studio Ghibli meets mobile game" aesthetic
2. **BREED_CHARACTERISTICS** - Face shape, expression, body type for each of 8 breeds
3. **FUR_DESCRIPTIONS** - Detailed fur color descriptions (orange, black, white, gray, brown, cream, ginger, calico)
4. **PATTERN_DESCRIPTIONS** - Pattern rendering (solid, tabby, spotted, tuxedo, bicolor, calico)
5. **EYE_DESCRIPTIONS** - Eye color with gemstone comparisons (green, blue, amber, gold, heterochromia, copper)
6. **PERSONALITY_EXPRESSIONS** - Expression based on 6 personalities
7. **COSTUME_RENDER_INSTRUCTIONS** - Detailed placement and style for all 20 costumes

**Outdated Portrait Detection:**
- `usePortraitStatus.ts` hook tracks cats with outdated portraits
- `computeAppearanceHash()` includes breed, appearance, costume, and personality
- `PortraitOutdatedBadge.tsx` shows ⚠️ icon when portrait needs updating
- Batch regeneration available via `BatchPortraitGenerator.tsx`

**Portrait Quality Modes:**
| Mode | Model | Best For |
|------|-------|----------|
| Standard | `gemini-2.5-flash` | Fast generation, good quality |
| Premium | `gemini-3-pro-image-preview` | Highest quality, detailed costumes |

See [Cat Visual System Documentation](./docs/CAT_VISUAL_SYSTEM.md) for full details.

### 9. Performance Systems

**Route-Level Code Splitting:**
- All 24 pages use React.lazy() for on-demand loading
- PageLoader fallback with animated cat emoji
- Admin pages loaded separately from main game

**Bundle Optimization (`vite.config.ts`):**
- 11 manual chunks separating vendor, UI, and feature code
- Paper.js lazy-loaded only when PaperCatAvatar used
- Charts only loaded on Stats/Admin pages

**Prefetching (`src/lib/routePrefetch.ts`, `src/hooks/usePrefetch.ts`):**
- Critical routes prefetched during idle time
- PrefetchLink component for hover-based prefetching
- Admin routes prefetched when admin section accessed

**Service Worker (`public/sw.js`):**
- Cache-first for static assets (JS, CSS, images)
- Network-first for HTML with offline fallback
- Automatic cache cleanup on version updates

**Virtual Scrolling (`src/components/game/VirtualizedCatGrid.tsx`):**
- Uses react-virtuoso for lists >20 cats
- Falls back to regular grid for smaller lists
- Memoized CatCardItem wrapper for efficient rendering

**Debounced Search (`src/hooks/useDebouncedSearch.ts`):**
- 300ms debounce delay
- Used in CatCollection, AdminUsers, RelationshipDirectory
- Prevents expensive filtering on every keystroke

### 10. Costume System (`src/types/costumes.ts`, `src/lib/costumeVectors.ts`)

**Categories:**
- Hats (8 costumes): Party Hat, Crown, Wizard Hat, etc.
- Outfits (4 costumes): Tuxedo, Princess Dress, etc.
- Accessories (4 costumes): Bow Tie, Glasses, Necklace, Scarf
- Special (4 costumes): Astronaut, Superhero Cape, Dragon, Unicorn, Angel Wings
- VIP Exclusive (3 costumes): Bronze Collar, Silver Cape, Gold Crown

**Animated Costume Effects:**
| Costume | Animation | Effect |
|---------|-----------|--------|
| Crown | glow-gold | Golden pulsing glow |
| Wizard Hat | sparkle + particles | Twinkling stars |
| Superhero Cape | flow | Flowing cape movement |
| Angel Wings | flutter + sparkles | Wing flutter + sparkle particles |
| Dragon | glow-fire | Fiery red/orange glow |
| Unicorn | rainbow + magic | Rainbow color shift + magic particles |
| VIP Bronze Collar | shimmer-bronze | Bronze shimmer effect |
| VIP Silver Cape | flow + sparkles | Flowing + silver sparkle particles |
| VIP Gold Crown | glow-vip + sparkles | Rainbow VIP glow + gold sparkles |

**Features:**
- 19 costumes with full vector SVG definitions
- Animated effects for legendary/VIP items
- Particle systems (sparkles, stars, hearts, magic)
- Respects reduced motion preferences

**Data Integrity Invariants:**
1. **Ownership Validation**: A costume can only be equipped if it exists in `ownedCostumes`
2. **Sale Cleanup**: When a cat is sold (single or bulk), its entry is automatically removed from `catCostumes`
3. **Costume Validation**: `getCostumeById()` validates costume existence before equipping
4. **Error Feedback**: Invalid operations produce user-visible error messages and error sounds

### 9. Show Events (`src/types/showEvents.ts`)

**Show Tiers:**
- Local, Regional, National, Championship
- Each with different entry fees and prize pools

### 10. Daily Events (`src/types/dailyEvents.ts`)

**Event Types:**
- Random daily events affecting money, resources, reputation
- Cat-specific effects (health, happiness, hunger changes)

### 11. Photo Booth System (`src/pages/CatPhotoBooth.tsx`, `src/components/game/PhotoBooth.tsx`)

**Features:**
- Take photos of cats with customizable backgrounds
- 16 background options (nature, fantasy, seasonal, solid)
- 7 cat poses (sitting, playful, sleepy, proud, silly, waving, bouncing)
- 7 frame styles (polaroid, heart, star, vintage, gold, rainbow, paws)
- 24 stickers across categories (hearts, stars, text, animals, effects)
- Draggable sticker positioning with scale and rotation
- Export photos (download, copy, share)
- Save to cloud gallery for logged-in users

### 12. Photo Gallery System (`src/pages/CatGallery.tsx`, `src/hooks/usePhotoGallery.ts`)

**Features:**
- Local storage with cloud sync
- Maximum 50 photos
- Favorites system
- Filter by cat name
- Sort by date or name
- Full-screen lightbox viewer
- Cloud sync for logged-in users

---

## Social & Multiplayer Systems

### 13. Authentication (`src/contexts/AuthContext.tsx`, `src/pages/Auth.tsx`)

**Features:**
- Email/password authentication via Supabase
- Session management
- Auto-confirm email signups
- Password reset functionality
- **Seasonal Themed Backgrounds:** AI-generated backgrounds that change with real-world seasons
- **Animated Farm Cats:** Interactive SVG cats that walk across the auth page
- **Seasonal Particle Effects:** Snowflakes (winter), cherry blossoms (spring), fireflies (summer), falling leaves (autumn)
- **Forced Profile Setup During Signup:**
  - Display name (required, 3-30 chars, alphanumeric + spaces/underscores/hyphens)
  - Avatar emoji selection (10 cat-themed options)
  - Unique display name validation with suggestions if taken
  - Data passed to Supabase via `options.data` metadata

**Signup Flow:**
1. User enters avatar emoji + display name + email + password
2. Client validates format (Zod schema)
3. Client checks display name availability via Supabase query
4. If taken, 5 alternative suggestions shown (cat-themed suffixes, random numbers, etc.)
5. On submit, `signUp()` passes metadata to Supabase
6. Database trigger `handle_new_user()` captures metadata and creates profile

**ProfileSetupDialog** (`src/components/game/ProfileSetupDialog.tsx`):
- Shows for legacy users (signed up before profile requirement) with NULL display_name
- Non-dismissable modal - must complete profile to continue
- Same validation and suggestion logic as signup form

### 14. Cloud Saves (`src/hooks/useCloudSave.ts`)

**Features:**
- Auto-save every 5 minutes when logged in
- Manual save/load buttons
- Syncs game state, kittens bred, relationships
- **Race Condition Protection:** Multi-layer defense preventing saves before cloud data loads
- **Restore from Cloud:** Manual restore button in Settings for suspected data issues

**Race Condition Safeguards:**
| Layer | Protection |
|-------|------------|
| Hook-level gate | `isLoaded` ref blocks saves until first `cloudLoad()` completes |
| Page-level guards | Empire, CatCollection, CatCustomization check `hasLoadedCloud` before saving |
| Empty state detection | Blocks saves with 0 cats on day 1 (unless `isNewUser` flag set) |
| Auto-save gating | `useAutoSave` checks `enabled` flag which includes `hasLoadedCloud` |

### 15. Global Leaderboard (`src/hooks/useGlobalLeaderboard.ts`, `src/components/game/GlobalLeaderboardPanel.tsx`)

**Leaderboard Categories:**
- Show Wins, Cats Owned, Kittens Bred, Money Earned, Achievements

**Features:**
- Real-time updates
- Player stats synced on cloud save
- Displays top players with avatars

### 16. Friends System (`src/hooks/useFriends.ts`, `src/components/game/FriendsPanel.tsx`)

**Features:**
- Send/accept/decline friend requests
- View friends list with stats
- Search friends by username

### 17. Player Profile (`src/hooks/usePlayerProfile.ts`, `src/components/game/PlayerProfilePanel.tsx`)

**Features:**
- Edit display name and avatar emoji
- View personal stats
- Profile setup dialog for legacy users

### 18. Cat Gifting (`src/hooks/useCatGifts.ts`, `src/components/game/CatGiftingPanel.tsx`)

**Features:**
- Send cats as gifts to friends
- Accept/decline received gifts
- Optional gift message
- Real-time notifications
- Gift received dialog popup

### 19. Player Trading (`src/hooks/useTrading.ts`, `src/components/game/TradingPanel.tsx`)

**Features:**
- Create trade offers with cats and money
- Accept/decline/cancel trades
- Real-time trade notifications
- 7-day expiration on trade offers
- Trade received dialog popup

### 20. Notifications (`src/hooks/useNotifications.ts`, `src/components/game/NotificationCenter.tsx`)

**Notification Types:**
- Friend requests
- Cat gifts received
- Trade offers
- Challenge completions

**Features:**
- Real-time push notifications via Supabase Realtime
- Bell icon with unread count badge
- Click to navigate to relevant tab

### 21. Bulk Actions System (`src/components/game/BulkActionsPanel.tsx`)

**Bulk Action Functions:**
- Heal All Sick: Heal cats with health < 70 (costs 1 medicine per cat)
- Rest All Tired: Rest cats with restLevel < 50 (free)
- Comfort All Unhappy: Comfort cats with happiness < 50 (free)
- Train All Available: Train all untrained cats today (costs 1 treat + 1 toy per cat)
- Sell Selected: Multi-select cats for bulk selling with confirmation dialog

---

## Components

### Main Game (`src/components/game/CatFarm.tsx`)
- Master component orchestrating all panels
- Category-based tab navigation (5 categories with sub-tabs)
- Audio controls in header
- Quick Access dropdown menu
- **Empire Button in Header** - Featured button for logged-in users (Castle icon)
- Notification center
- Cloud sync indicator
- What's New popup for returning players
- Mobile bottom navigation support

### Navigation Components:
- **GameHeader.tsx**: Header with Empire button, audio controls, Quick Access menu, notifications
- **CategoryTabBar.tsx**: Two-tier grouped tab navigation with 5 categories (Farm, Cats, Social, Progress, Settings)
- **QuickAccessMenu.tsx**: Header dropdown with recent tabs and external page links
- **MobileBottomNav.tsx**: Fixed bottom navigation for mobile devices
- **MobileMenuSheet.tsx**: Full-screen mobile menu sheet
- **Breadcrumbs.tsx**: Navigation breadcrumbs for external pages

### Cat Display Components:
- **CatCard.tsx**: Individual cat display with stats, actions, inline rename
- **CatDetailModal.tsx**: Full-screen cat details
- **CatAvatar.tsx**: Cat avatar with costume support
- **CatVisual.tsx**: Unified cat visual display
- **CatPortrait.tsx**: AI portrait generation with confirmation dialogs
- **PaperCatAvatar.tsx**: High-quality vector avatars with Paper.js
- **AnimatedCostumeSVG.tsx**: Animated costume overlays (glows, particles)
- **UnifiedCatCard.tsx**: Alternative cat card implementation
- **GradeBadge.tsx**: Visual grade display
- **CatCardSkeleton.tsx**: Loading skeleton for cat cards

### Action Panels:
- **ActionPanel.tsx**: Add cats, next day
- **ChorePanel.tsx**: Earn money through tasks
- **ResourcePanel.tsx**: Buy/use resources
- **MarketPanel.tsx**: Buy cats from NPC sellers
- **CostumeShopPanel.tsx**: Buy and equip costumes
- **BreedingPanel.tsx**: Pair cats for kittens
- **TrainingPanel.tsx**: Teach tricks, manage rest
- **SocializePanel.tsx**: Build cat relationships
- **MatchmakingPanel.tsx**: Suggested pairings
- **GroupActivitiesPanel.tsx**: Group bonding
- **RelationshipPanel.tsx**: View all cat relationships
- **CatShowPanel.tsx**: Enter cat shows

### Social Panels:
- **LeaderboardPanel.tsx**: Local cat rankings
- **GlobalLeaderboardPanel.tsx**: Global player rankings
- **FriendsPanel.tsx**: Manage friends and requests
- **PlayerProfilePanel.tsx**: Edit profile
- **CatGiftingPanel.tsx**: Send/receive cat gifts
- **TradingPanel.tsx**: Create and manage trades
- **NotificationCenter.tsx**: Real-time notifications dropdown
- **NotificationSettings.tsx**: Push notification preferences

### Progress Panels:
- **AchievementsPanel.tsx**: Track progress
- **DailyRewardsPanel.tsx**: Daily login rewards
- **WeeklyChallengesPanel.tsx**: Weekly challenge tracking
- **LeaderboardRewardsPanel.tsx**: Claim leaderboard rewards
- **LeaderboardHistoryChart.tsx**: Historical ranking visualization

### Photo Booth Components:
- **PhotoBooth.tsx**: Interactive photo taking interface
- **GalleryPhotoCard.tsx**: Photo display card with actions
- **PhotoLightbox.tsx**: Full-screen photo viewer
- **DraggableSticker.tsx**: Draggable stickers for photos
- **BatchPortraitGenerator.tsx**: Batch generate portraits for multiple cats with outdated detection
- **PortraitOutdatedBadge.tsx**: Visual indicator for outdated/missing portraits

### Utility Components:
- **StatusBar.tsx**: Money, day, house, cat show
- **StatusBarSkeleton.tsx**: Loading skeleton for status bar
- **MessageBar.tsx**: Game notifications
- **SaveLoadPanel.tsx**: Persist game state with **Restore from Cloud** button for manual recovery
- **BulkActionsPanel.tsx**: Mass cat management operations
- **ComfortButton.tsx**: 20-second comfort timer

### Animation Components:
- **RelationshipAnimations.tsx**: Floating emojis
- **RelationshipParticles.tsx**: Particle effects
- **RelationshipNetworkGraph.tsx**: Visual relationship graph
- **MoodAnimations.tsx**: Cat mood indicators
- **CatActivityPopups.tsx**: Activity popup notifications
- **CatCardReaction.tsx**: Cat reaction animations
- **ChallengeProgressAnimation.tsx**: Challenge completion effects
- **AnimatedCostumeSVG.tsx**: Animated costume effects (glow, flow, sparkle)

### Tutorial & Help:
- **TutorialSystem.tsx**: 16-step new player tutorial with category badges
- **WhatsNewPopup.tsx**: Changelog popup for returning players
- **KeyboardShortcutsHelp.tsx**: Keyboard shortcuts modal
- **DailyEventToast.tsx**: Daily event notifications
- **AnnouncementBanner.tsx**: System announcements

### Dialog Components:
- **GiftReceivedDialog.tsx**: Gift notification popup
- **TradeReceivedDialog.tsx**: Trade notification popup
- **ProfileSetupDialog.tsx**: New user profile setup
- **TradingCard.tsx**: Trading card display

### Skeleton Components:
- **CatCardSkeleton.tsx**: Cat card loading state
- **CatGridSkeleton.tsx**: Cat grid loading state
- **PanelSkeleton.tsx**: Panel loading state
- **StatusBarSkeleton.tsx**: Status bar loading state

---

## Custom Hooks (45 total)

### Core Game Hooks:
- **useGameState.ts**: Core game logic + bulk actions
- **useRelationships.ts**: Cat relationships
- **useSoundEffects.ts**: Audio system
- **useConfetti.ts**: Celebration effects
- **useHaptics.ts**: Mobile haptic feedback
- **useKeyboardShortcuts.ts**: Keyboard navigation
- **useGraphicsSettings.ts**: Runtime graphics customization (17 settings including portrait quality)

### Empire Hooks:
- **useRoamingCats.ts**: AI movement for Empire scene

### Cloud & Persistence:
- **useCloudSave.ts**: Cloud persistence
- **usePhotoGallery.ts**: Local + cloud photo gallery
- **useCloudGallery.ts**: Cloud gallery operations

### Portrait System Hooks:
- **usePortraitStatus.ts**: Track outdated portraits across all cats
- **usePortraitCredits.ts**: Portrait credit management
- **usePortraitOutdatedToast.tsx**: Portrait update notifications

### Social Features:
- **useFriends.ts**: Friends system
- **useCatGifts.ts**: Cat gifting
- **useTrading.ts**: Player trading
- **useNotifications.ts**: Real-time notifications
- **usePushNotifications.ts**: Web push notifications
- **usePlayerProfile.ts**: Profile management
- **usePlayerStats.ts**: Player statistics
- **usePlayerActivityLog.ts**: Activity logging
- **useCoopChallenges.ts**: Cooperative challenges
- **useRelationshipReminders.ts**: Relationship decay notifications

### Leaderboard & Rewards:
- **useGlobalLeaderboard.ts**: Global rankings
- **useLeaderboardHistory.ts**: Historical rankings
- **useLeaderboardRewards.ts**: Reward claiming
- **useDailyLoginRewards.ts**: Login streaks + VIP
- **useWeeklyChallenges.ts**: Challenge tracking
- **useChallengeAchievements.ts**: Challenge-achievement linking
- **useDailyObjectives.ts**: Daily objectives tracking
- **useLuckyWheel.ts**: Daily spin wheel
- **useBattlePass.ts**: Seasonal battle pass
- **useMilestones.ts**: Milestone celebrations
- **useCollectionProgress.ts**: Collection progress tracking
- **useLegacy.ts**: Cat retirement/Hall of Fame
- **useSpecializations.ts**: Cat specialization paths

### Admin Hooks:
- **useAdminAuth.ts**: Admin authentication
- **useAdminData.ts**: Admin data queries
- **useAdminActivityLog.ts**: Admin activity logging
- **useAdminAIData.ts**: AI usage metrics
- **useAdminCorruptedSaves.ts**: Game save corruption detection and repair
- **useAdminRateLimit.ts**: Admin action rate limiting
- **useSecurityLinter.ts**: Database security scanning
- **useSecurityHistory.ts**: Security scan history tracking

### Utility Hooks:
- **useErrorLogger.ts**: Error logging system with rate limiting
- **useInfiniteScroll.ts**: Infinite scroll utility
- **use-mobile.tsx**: Mobile detection
- **use-toast.ts**: Toast notifications

---

## Pages

- **Index.tsx**: Main game page
- **Auth.tsx**: Login/signup
- **CatCollection.tsx**: Trading card view
- **CatPhotoBooth.tsx**: Photo booth page
- **CatGallery.tsx**: Photo gallery page
- **CatCustomization.tsx**: Cat appearance editor
- **CatRelationships.tsx**: Full-page relationship network
- **Empire.tsx**: Interactive cat dwelling visualization
- **Leaderboard.tsx**: Global leaderboard page
- **Stats.tsx**: Player statistics
- **AdminAuth.tsx**: Admin login
- **admin/**: Admin dashboard pages
  - AdminDashboard.tsx
  - AdminUsers.tsx
  - AdminProfileRepair.tsx
  - AdminGameSaveRepair.tsx (corrupted save detection & repair)
  - AdminStatistics.tsx
  - AdminErrorLogs.tsx
  - AdminModeration.tsx
  - AdminAnnouncements.tsx
  - AdminGameConfig.tsx
  - AdminBattlePass.tsx
  - AdminNotifications.tsx
  - AdminAIMetrics.tsx
  - AdminSecurity.tsx
  - AdminScheduledJobs.tsx
  - AdminTutorialAnalytics.tsx
  - AdminSettings.tsx

---

## Empire System

### Overview
The Empire page (`/empire`) provides an interactive visual dwelling where players can watch their cats roam, play, and interact. The scene adapts based on the player's current house tier.

### Files
- `src/pages/Empire.tsx` - Main page component
- `src/components/empire/EmpireScene.tsx` - Scene container with background
- `src/components/empire/RoamingCat.tsx` - Individual roaming cat
- `src/components/empire/EmpireInteractionMenu.tsx` - Quick action popover
- `src/hooks/empire/useRoamingCats.ts` - AI movement logic
- `src/config/empire.ts` - Zone themes and configuration
- `src/types/empire.ts` - TypeScript types

### Zone Themes
| House Tier | Background | Floor | Ambiance |
|------------|------------|-------|----------|
| Apartment | Warm beige walls | Gray carpet | Cozy small space |
| House | Light blue walls | Wooden floor | Spacious home |
| Mansion | Purple/gold walls | Marble floor | Luxurious |
| Farm | Green sky/nature | Grass field | Open countryside |

### Roaming AI
Cats move randomly within the scene:
- Movement interval: 3-8 seconds per cat
- Position bounds: x(10-90%), y(30-90%)
- Facing direction calculated from movement delta
- Z-index based on Y position (depth illusion)

### Quick Actions
Click any cat to open interaction menu:
- **Pet**: +5 happiness, plays purr sound
- **Feed**: -1 food, +15 hunger
- **Play**: -1 toy, +10 happiness
- **View Details**: Navigate to cat customization
- **Photo Booth**: Navigate with cat selected

---

## Edge Functions (14 total)

- **process-leaderboard-rewards**: Process periodic leaderboard rewards
- **generate-weekly-challenges**: Generate new weekly challenges
- **generate-cat-portrait**: AI-powered cat portrait generation with enhanced prompt engineering
  - Modular prompt builder with breed, appearance, costume, personality components
  - Supports Standard (`gemini-2.5-flash`) and Premium (`gemini-3-pro-image-preview`) quality modes
  - Costume-specific rendering instructions for all 20 costumes
  - Consistent "Studio Ghibli meets mobile game" art style
- **send-push-notification**: Send web push notifications
- **send-password-reset**: Password reset email
- **send-admin-alert**: Admin alert notifications
- **admin-delete-user**: Admin user deletion
- **cleanup-error-logs**: Daily cleanup of error logs older than 30 days
- **manage-portrait-credits**: Portrait credit management
- **run-security-linter**: Database security scanning
- **sync-health-check**: Data integrity validation (runs every 10 minutes via cron)
  - Validates saves played within last 24 hours
  - Checks cat count vs space limit, required fields, duplicate IDs, portrait URLs
  - Logs results to `sync_health_log` table
- **recover-lost-cats**: Recover lost cats from save snapshots
- **validate-display-name**: Server-side display name and username validation
  - Validates display name format (3-30 chars, alphanumeric + spaces/underscores/hyphens)
  - Validates username format (3-20 chars, starts with letter, alphanumeric + underscores)
  - **Profanity filter** with leetspeak detection and bypass prevention
  - Checks case-insensitive uniqueness for both display names and usernames
  - Returns suggestions if name/username is taken
  - XSS prevention via regex

---

## Database Tables

### Core Tables:
- **profiles**: User profile information
- **game_saves**: Game state persistence
- **player_stats**: Leaderboard statistics

### Social Tables:
- **player_friends**: Friend relationships
- **cat_gifts**: Cat gifting
- **trade_offers**: Player trading

### Progress Tables:
- **daily_login_rewards**: Login streaks
- **weekly_challenges**: Challenge definitions
- **player_challenge_progress**: Individual progress
- **player_challenge_stats**: Aggregate stats
- **leaderboard_rewards**: Periodic rewards
- **leaderboard_snapshots**: Historical data
- **rank_history**: Rank tracking
- **rewards_processing_log**: Processing log

### Photo Tables:
- **gallery_photos**: Photo metadata

### Logging Tables:
- **error_logs**: Application errors
- **player_activity_log**: Player activities
- **sync_health_log**: Data integrity check results (cron job)
- **save_snapshots**: Point-in-time save snapshots for recovery

### Admin Tables:
- **admin_activity_log**: Admin actions
- **auth_attempts_log**: Authentication attempts
- **user_roles**: User role assignments
- **announcements**: System announcements
- **ai_usage_log**: AI usage tracking
- **security_scan_history**: Security scan results

### Notification Tables:
- **push_subscriptions**: Web push subscriptions

---

## Storage Buckets

- **photo-gallery**: Photo booth images (public)
- **cat-portraits**: AI-generated portraits (public)

---

## Gamification Systems

> See [docs/GAMIFICATION_IMPROVEMENTS_PLAN.md](docs/GAMIFICATION_IMPROVEMENTS_PLAN.md) for detailed implementation plan.

### Implemented Features:

| System | Description | Files |
|--------|-------------|-------|
| **Milestone Celebrations** | Visual celebrations for achievements with titles and rewards | `src/types/milestones.ts`, `src/hooks/useMilestones.ts`, `src/components/game/MilestonePopup.tsx` |
| **Daily Objectives** | 3 rotating daily goals with bonus completion reward | `src/types/dailyObjectives.ts`, `src/hooks/useDailyObjectives.ts`, `src/components/game/DailyObjectivesPanel.tsx` |
| **Collection Progress** | Track completion across breeds, personalities, costumes, tricks | `src/types/collections.ts`, `src/hooks/useCollectionProgress.ts`, `src/components/game/CollectionProgressPanel.tsx` |
| **Lucky Wheel** | Daily spin with tiered prizes and VIP bonuses | `src/types/luckyWheel.ts`, `src/hooks/useLuckyWheel.ts`, `src/components/game/LuckyWheelPanel.tsx` |
| **Cat Legacy/Hall of Fame** | Retire legendary cats for permanent bonuses | `src/types/legacy.ts`, `src/hooks/useLegacy.ts`, `src/components/game/HallOfFamePanel.tsx` |
| **Specialization Paths** | Show Star, Social Butterfly, or Dynasty Builder paths | `src/types/specializations.ts`, `src/hooks/useSpecializations.ts`, `src/components/game/SpecializationPanel.tsx` |
| **Seasonal Battle Pass** | Free and premium reward tracks with XP progression | `src/types/battlePass.ts`, `src/hooks/useBattlePass.ts`, `src/components/game/BattlePassPanel.tsx` |
| **Cooperative Challenges** | Work with friends toward shared goals | `src/types/coopChallenges.ts`, `src/hooks/useCoopChallenges.ts`, `src/components/game/CoopChallengesPanel.tsx` |

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI, Lucide icons
- **State Management**: React Query, Context API
- **Backend**: Supabase (via Lovable Cloud)
- **Database**: PostgreSQL with JSONB
- **Real-time**: Supabase Realtime
- **Audio**: Web Audio API (procedural)
- **Charts**: Recharts
- **Animations**: canvas-confetti, tailwindcss-animate
