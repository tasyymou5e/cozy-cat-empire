# Cat Farm Game - Knowledge Base

> **📚 Full Documentation:** See `/docs/` folder for comprehensive documentation:
> - [docs/COMPONENTS.md](docs/COMPONENTS.md) - Component architecture
> - [docs/GAME_LOGIC.md](docs/GAME_LOGIC.md) - Game mechanics & flow
> - [docs/DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md) - Database schema
> - [docs/SECURITY.md](docs/SECURITY.md) - Security & RLS policies
> - [docs/TECH_STACK.md](docs/TECH_STACK.md) - Technology stack
> - [docs/ERROR_LOGGING.md](docs/ERROR_LOGGING.md) - Error logging system

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

**Features:**
- Breed-specific defaults applied on cat creation
- Full customization via CatCustomization page
- Random appearance generation available

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
- Friends (20+), Best Friends (50+), Soul Mates (80+)
- Rivals (-20 to -49), Enemies (-50 to -79), Nemesis (-80 to -100)

**Features:**
- Dynamic events affect scores
- Compatibility affects breeding success
- Groups form automatically among friends
- Happiness modifiers based on relationships

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

### 8. Costume System (`src/types/costumes.ts`, `src/components/game/CostumeShopPanel.tsx`)

**Categories:**
- Hats (8 costumes): Party Hat, Crown, Wizard Hat, etc.
- Outfits (4 costumes): Tuxedo, Princess Dress, etc.
- Accessories (4 costumes): Bow Tie, Glasses, etc.
- Special (4 costumes): Astronaut Suit, Superhero Cape, etc.

**Features:**
- 16 total costumes with prices $50-$500
- Costumes can be bought and equipped to cats
- Some costumes are rare/seasonal

### 9. Show Events (`src/types/showEvents.ts`)

**Show Tiers:**
- Local, Regional, National, International
- Each with different entry fees and prize pools

**Seasonal Events:**
- Spring, Summer, Fall, Winter events
- Special events with bonus rewards

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

### 13. Authentication (`src/contexts/AuthContext.tsx`)

**Features:**
- Email/password authentication via Supabase
- Session management
- Auto-confirm email signups

### 14. Cloud Saves (`src/hooks/useCloudSave.ts`)

**Features:**
- Auto-save every 5 minutes when logged in
- Manual save/load buttons
- Syncs game state, kittens bred, relationships

**Database Table:** `game_saves`
- `user_id`, `game_state` (JSONB), `kittens_bred`, `relationships`, `last_played_at`

### 15. Global Leaderboard (`src/hooks/useGlobalLeaderboard.ts`, `src/components/game/GlobalLeaderboardPanel.tsx`)

**Leaderboard Categories:**
- Show Wins, Cats Owned, Kittens Bred, Money Earned, Achievements

**Features:**
- Real-time updates
- Player stats synced on cloud save
- Displays top players with avatars

**Database Table:** `player_stats`
- `user_id`, `display_name`, `avatar_emoji`, `total_show_wins`, `total_cats_owned`, etc.

### 16. Friends System (`src/hooks/useFriends.ts`, `src/components/game/FriendsPanel.tsx`)

**Features:**
- Send/accept/decline friend requests
- View friends list with stats
- Search friends by username

**Database Table:** `player_friends`
- `user_id`, `friend_id`, `status` (pending/accepted/blocked)

### 17. Player Profile (`src/hooks/usePlayerProfile.ts`, `src/components/game/PlayerProfilePanel.tsx`)

**Features:**
- Edit display name and avatar emoji
- View personal stats

**Database Table:** `profiles`
- `id`, `display_name`, `avatar_emoji`, `username`

### 18. Cat Gifting (`src/hooks/useCatGifts.ts`, `src/components/game/CatGiftingPanel.tsx`)

**Features:**
- Send cats as gifts to friends
- Accept/decline received gifts
- Optional gift message
- Real-time notifications

**Database Table:** `cat_gifts`
- `sender_id`, `recipient_id`, `cat_data` (JSONB), `message`, `status`

### 19. Player Trading (`src/hooks/useTrading.ts`, `src/components/game/TradingPanel.tsx`)

**Features:**
- Create trade offers with cats and money
- Accept/decline/cancel trades
- Real-time trade notifications
- 7-day expiration on trade offers

**Database Table:** `trade_offers`
- `sender_id`, `recipient_id`, `offered_cats`, `offered_money`, `requested_money`, `status`

### 20. Notifications (`src/hooks/useNotifications.ts`, `src/components/game/NotificationCenter.tsx`)

**Notification Types:**
- Friend requests
- Cat gifts received
- Trade offers

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

**Features:**
- Status summary badges showing sick/tired/unhappy/trainable counts
- Resource cost indicators on action buttons
- Disabled states when no cats need action
- Multi-select mode with Select All/Deselect All
- Confirmation dialog for irreversible bulk sell

---

## Components

### Main Game (`src/components/game/CatFarm.tsx`)
- Master component orchestrating all panels
- 16-tab sidebar layout (includes Bulk Actions)
- Audio controls in header
- Notification center
- Cloud sync indicator
- What's New popup for returning players

### Cat Display (`src/components/game/CatCard.tsx`)
- Shows cat stats, relationships, tricks
- Grade badge with tier styling
- Comfort button for upset cats (20-second timer)
- Heal and Sell buttons
- **Inline rename feature** with pencil icon
- **Random name generator** with breed/personality-based suggestions

**Name Generator (`CatCard.tsx`):**
- Breed-specific names (Japanese for Siamese, Royal for Persian, etc.)
- Personality-based names (Snoozer for Lazy, Zoom for Playful, etc.)
- Universal fallback names
- Shuffle button for random selection

### Panels:
- **ActionPanel**: Add cats, next day
- **ChorePanel**: Earn money through tasks
- **ResourcePanel**: Buy/use resources
- **MarketPanel**: Buy cats from NPC sellers
- **CostumeShopPanel**: Buy and equip costumes
- **BreedingPanel**: Pair cats for kittens
- **TrainingPanel**: Teach tricks, manage rest
- **SocializePanel**: Build cat relationships
- **MatchmakingPanel**: Suggested pairings
- **GroupActivitiesPanel**: Group bonding
- **RelationshipPanel**: View all cat relationships
- **LeaderboardPanel**: Local cat rankings
- **GlobalLeaderboardPanel**: Global player rankings
- **FriendsPanel**: Manage friends and requests
- **PlayerProfilePanel**: Edit profile
- **CatGiftingPanel**: Send/receive cat gifts
- **TradingPanel**: Create and manage trades
- **AchievementsPanel**: Track progress
- **SaveLoadPanel**: Persist game state
- **BulkActionsPanel**: Mass cat management operations
- **LeaderboardRewardsPanel**: Claim leaderboard rewards
- **LeaderboardHistoryChart**: Historical ranking visualization

### Photo Booth Components:
- **PhotoBooth.tsx**: Interactive photo taking interface
- **GalleryPhotoCard.tsx**: Photo display card with actions
- **PhotoLightbox.tsx**: Full-screen photo viewer
- **DraggableSticker.tsx**: Draggable stickers for photos
- **CatPortrait.tsx**: Cat portrait display component
- **CatAvatar.tsx**: Cat avatar with costume support

### Support Components:
- **StatusBar**: Money, day, house, cat show (React.forwardRef)
- **MessageBar**: Game notifications (React.forwardRef)
- **GradeBadge**: Visual grade display
- **ComfortButton**: 20-second comfort timer
- **RelationshipAnimations**: Floating emojis
- **MoodAnimations**: Cat mood indicators
- **TutorialSystem**: 16-step new player tutorial with category badges
- **WhatsNewPopup**: Changelog popup for returning players
- **KeyboardShortcutsHelp**: Keyboard shortcuts modal
- **DailyEventToast**: Daily event notifications
- **NotificationCenter**: Real-time notifications dropdown
- **NotificationSettings**: Push notification preferences

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

### Cat Renaming
- Inline editing via pencil icon on CatCard
- Random name generator with shuffle button
- Breed-specific names (e.g., Japanese names for Siamese)
- Personality-based names (e.g., "Snoozer" for lazy cats)
- Universal fallback names
- Validation: Names must be unique

**Breed-Specific Names:**
| Breed | Theme | Examples |
|-------|-------|----------|
| Siamese | Japanese/Thai | Sakura, Miko, Yuki, Wasabi, Mochi |
| Persian | Royal/Fancy | Duchess, Prince, Anastasia, Cleopatra |
| Maine Coon | Nature/Rugged | Bear, Moose, Timber, Everest, Grizzly |
| British Shorthair | British | Winston, Churchill, Sherlock, Paddington |
| Ragdoll | Soft/Cuddly | Marshmallow, Velvet, Cashmere, Snuggles |
| Bengal | Wild/Exotic | Rajah, Sheba, Safari, Tigris, Panther |
| Tabby | Classic | Stripes, Marble, Autumn, Caramel |
| Stray | Street Smart | Scrappy, Lucky, Rascal, Bandit |

**Personality-Based Names:**
| Personality | Theme | Examples |
|-------------|-------|----------|
| Lazy | Sleepy | Snoozer, Dreamer, Cozy, Pillow |
| Playful | Active | Zoom, Bounce, Sparky, Turbo |
| Affectionate | Loving | Cuddles, Sweetie, Lovebug |
| Independent | Aloof | Maverick, Solo, Rebel, Enigma |
| Curious | Inquisitive | Scout, Explorer, Sherlock |
| Shy | Gentle | Whisper, Shadow, Bashful |

### Breeding
- Requires 2 cats, no cooldown active
- Relationship affects success rate
- Kitten inherits parent traits + grade averaging
- Enemies may refuse to breed

### Cat Shows
- Eligible: health ≥70, happiness ≥60
- Score = health + happiness + (rarity×10) + (wins×5) + friend bonus
- Winners get money, increased value, show wins
- Multiple tiers: local, regional, national, international

### Training
- Costs 2 treats per session
- Grade determines progress gain
- Rest level affects success
- Learning a trick boosts grade

### Comforting
- Available when happiness <50 or more enemies than friends
- 20-second hold timer
- Boosts happiness +30, health +5

### Cat Gifting
- Select a cat and friend to gift
- Cat is removed from sender when accepted
- Cat is added to recipient's farm
- Declined gifts return nothing

### Trading
- Offer cats and/or money
- Request money in return
- Both parties must have required items
- Trades expire after 7 days

### Photo Booth
- Select background, pose, frame, and stickers
- Drag and position stickers on photo
- Download, copy, or share photos
- Save to cloud gallery (authenticated users)

---

## Database Schema

### Tables (Supabase):

**profiles**
- `id` (UUID, PK, references auth.users)
- `display_name` (TEXT)
- `avatar_emoji` (TEXT, default '😺')
- `username` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**game_saves**
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `game_state` (JSONB)
- `kittens_bred` (INTEGER)
- `relationships` (JSONB)
- `last_played_at` (TIMESTAMPTZ)

**player_stats**
- `id` (UUID, PK)
- `user_id` (UUID, FK, UNIQUE)
- `display_name`, `avatar_emoji`
- `total_show_wins`, `total_cats_owned`, `total_kittens_bred`
- `highest_cat_grade`, `total_money_earned`, `achievements_unlocked`

**player_friends**
- `id` (UUID, PK)
- `user_id`, `friend_id` (UUID, FK)
- `status` (TEXT: pending/accepted/blocked)

**cat_gifts**
- `id` (UUID, PK)
- `sender_id`, `recipient_id` (UUID)
- `cat_data` (JSONB)
- `message` (TEXT)
- `status` (TEXT: pending/accepted/declined)

**trade_offers**
- `id` (UUID, PK)
- `sender_id`, `recipient_id` (UUID)
- `offered_cats`, `requested_cats` (JSONB)
- `offered_money`, `requested_money` (INTEGER)
- `offered_resources`, `requested_resources` (JSONB)
- `status` (TEXT: pending/accepted/declined/cancelled)
- `expires_at` (TIMESTAMPTZ)

**gallery_photos**
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `cat_id`, `cat_name` (TEXT)
- `image_path` (TEXT)
- `background_id`, `pose_id`, `frame_id` (TEXT)
- `sticker_count` (INTEGER)
- `is_favorite` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**error_logs**
- `id` (UUID, PK)
- `user_id` (UUID, nullable)
- `error_type` (TEXT) - e.g., 'uncaught', 'promise', 'component', 'network', 'interaction'
- `error_message` (TEXT)
- `error_stack` (TEXT, nullable)
- `component_name` (TEXT, nullable)
- `route` (TEXT, nullable)
- `user_agent` (TEXT, nullable)
- `metadata` (JSONB) - additional context
- `created_at` (TIMESTAMPTZ)

### Storage Buckets:
- `photo-gallery` - Cat photos from photo booth (public)
- `cat-portraits` - AI-generated cat portraits (public)

---

## Error Logging System

### Error Logger (`src/hooks/useErrorLogger.ts`)

**Error Types Captured:**
- `uncaught` - Uncaught JavaScript exceptions via `window.onerror`
- `promise` - Unhandled promise rejections via `unhandledrejection` event
- `component` - React component errors (via ErrorBoundary)
- `network` - Failed network requests
- `interaction` - User interaction errors

**Features:**
- Automatic capture of uncaught errors and promise rejections
- User interaction tracking for debugging
- Browser and route context included
- Database logging to `error_logs` table (authenticated users only)
- Console logging fallback

### Error Boundary (`src/components/ErrorBoundary.tsx`)
- Graceful UI error handling for React components
- Automatically logs component errors with stack traces
- Shows user-friendly error message with retry option

### Error Logger Provider (`src/components/ErrorLoggerProvider.tsx`)
- Wraps app to initialize global error handlers
- Sets up window event listeners for error capture

---

## File Structure

```
src/
├── components/
│   ├── game/                   # Game UI components (45+ files)
│   │   ├── CatFarm.tsx         # Main game orchestrator
│   │   ├── CatCard.tsx         # Individual cat display + rename
│   │   ├── CatAvatar.tsx       # Cat avatar with costume
│   │   ├── CatPortrait.tsx     # Cat portrait display
│   │   ├── PhotoBooth.tsx      # Photo booth interface
│   │   ├── GalleryPhotoCard.tsx # Photo card display
│   │   ├── PhotoLightbox.tsx   # Full-screen photo viewer
│   │   ├── DraggableSticker.tsx # Draggable stickers
│   │   ├── BulkActionsPanel.tsx # Mass cat management
│   │   ├── ActionPanel.tsx     # Add cats, next day
│   │   ├── ChorePanel.tsx      # Earn money through tasks
│   │   ├── ResourcePanel.tsx   # Buy/use resources
│   │   ├── MarketPanel.tsx     # Buy cats from NPCs
│   │   ├── CostumeShopPanel.tsx
│   │   ├── BreedingPanel.tsx   # Cat breeding
│   │   ├── TrainingPanel.tsx   # Teach tricks
│   │   ├── SocializePanel.tsx  # Cat relationships
│   │   ├── MatchmakingPanel.tsx
│   │   ├── GroupActivitiesPanel.tsx
│   │   ├── RelationshipPanel.tsx
│   │   ├── LeaderboardPanel.tsx
│   │   ├── GlobalLeaderboardPanel.tsx
│   │   ├── LeaderboardHistoryChart.tsx
│   │   ├── LeaderboardRewardsPanel.tsx
│   │   ├── FriendsPanel.tsx
│   │   ├── PlayerProfilePanel.tsx
│   │   ├── CatGiftingPanel.tsx
│   │   ├── TradingPanel.tsx
│   │   ├── AchievementsPanel.tsx
│   │   ├── SaveLoadPanel.tsx
│   │   ├── CatShowPanel.tsx
│   │   ├── CatDetailModal.tsx
│   │   ├── StatusBar.tsx
│   │   ├── MessageBar.tsx
│   │   ├── GradeBadge.tsx
│   │   ├── ComfortButton.tsx
│   │   ├── TradingCard.tsx
│   │   ├── FlippableTradingCard.tsx
│   │   ├── RelationshipAnimations.tsx
│   │   ├── MoodAnimations.tsx
│   │   ├── TutorialSystem.tsx       # 16-step tutorial with categories
│   │   ├── WhatsNewPopup.tsx        # Changelog for returning players
│   │   ├── KeyboardShortcutsHelp.tsx
│   │   ├── DailyEventToast.tsx
│   │   ├── NotificationCenter.tsx
│   │   ├── NotificationSettings.tsx
│   │   ├── DailyRewardsPanel.tsx
│   │   └── WeeklyChallengesPanel.tsx
│   ├── ui/                     # shadcn/ui components (40+ files)
│   ├── stats/                  # Statistics components (6 files)
│   ├── admin/                  # Admin dashboard components
│   ├── ErrorBoundary.tsx       # React error boundary
│   ├── ErrorLoggerProvider.tsx # Global error handler
│   └── NavLink.tsx
├── hooks/                      # 29 custom hooks
│   ├── useGameState.ts         # Core game logic + bulk actions
│   ├── useRelationships.ts     # Cat relationships
│   ├── useSoundEffects.ts      # Audio system
│   ├── useConfetti.ts          # Celebrations
│   ├── useCloudSave.ts         # Cloud persistence
│   ├── useGlobalLeaderboard.ts
│   ├── useFriends.ts           # Friends system
│   ├── usePlayerProfile.ts     # Profile management
│   ├── useCatGifts.ts          # Cat gifting
│   ├── useTrading.ts           # Player trading
│   ├── useNotifications.ts     # Real-time notifications
│   ├── useKeyboardShortcuts.ts
│   ├── useErrorLogger.ts       # Error logging system
│   ├── useHaptics.ts           # Mobile haptic feedback
│   ├── useDailyLoginRewards.ts # Login streaks + VIP
│   ├── useWeeklyChallenges.ts  # Challenge tracking
│   ├── useLeaderboardHistory.ts # Historical rankings
│   ├── useLeaderboardRewards.ts # Reward claiming
│   ├── usePushNotifications.ts # Web push notifications
│   ├── useChallengeAchievements.ts # Challenge-achievement linking
│   ├── usePlayerStats.ts       # Player statistics
│   ├── usePhotoGallery.ts      # Local + cloud photo gallery
│   ├── useCloudGallery.ts      # Cloud gallery operations
│   ├── useInfiniteScroll.ts    # Infinite scroll utility
│   ├── useAdminAuth.ts         # Admin authentication
│   ├── useAdminData.ts         # Admin data queries
│   ├── useAdminActivityLog.ts  # Admin activity logging
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── types/
│   ├── game.ts                 # Cat, GameState, constants
│   ├── grading.ts              # Grade system
│   ├── relationships.ts        # Relationship types
│   ├── costumes.ts             # Costume definitions
│   ├── showEvents.ts           # Show tiers and events
│   ├── dailyEvents.ts          # Daily random events
│   ├── dailyRewards.ts         # VIP tier definitions
│   ├── challenges.ts           # Weekly challenge types
│   ├── gallery.ts              # Photo gallery types
│   ├── photoBooth.ts           # Photo booth assets
│   ├── catAppearance.ts        # Cat appearance options
│   └── changelog.ts            # Version changelog entries
├── contexts/
│   ├── AuthContext.tsx         # Authentication
│   ├── SoundContext.tsx        # Sound provider
│   └── CatReactionContext.tsx  # Cat reaction animations
├── integrations/
│   └── supabase/
│       ├── client.ts           # Supabase client
│       └── types.ts            # Generated types
├── lib/
│   └── utils.ts                # Utility functions
└── pages/
    ├── Index.tsx               # Main game page
    ├── Auth.tsx                # Login/signup
    ├── CatCollection.tsx       # Trading card view
    ├── CatPhotoBooth.tsx       # Photo booth page
    ├── CatGallery.tsx          # Photo gallery page
    ├── CatCustomization.tsx    # Cat appearance editor
    ├── Leaderboard.tsx         # Global leaderboard page
    ├── Stats.tsx               # Player statistics
    ├── AdminAuth.tsx           # Admin login
    ├── admin/                  # Admin dashboard pages
    └── NotFound.tsx

supabase/
├── config.toml                 # Supabase configuration
├── migrations/                 # Database migrations
└── functions/
    ├── process-leaderboard-rewards/
    ├── generate-weekly-challenges/
    ├── generate-cat-portrait/
    └── send-push-notification/
```

---

## Security

### Row-Level Security (RLS)

All tables have RLS enabled with appropriate policies:

**profiles**
- Authenticated users can view all public profiles (for social features)
- Users can only update their own profile

**game_saves**
- Users can only view/insert/update their own saves

**player_stats**
- Anyone can view leaderboard (public read)
- Users can only insert/update their own stats

**player_friends**
- Users can view/manage their own friendships
- Both parties can update friendship status

**cat_gifts**
- Users can send gifts (INSERT with sender check)
- Recipients can update gift status
- Both parties can view their gifts

**trade_offers**
- Users can create trades (INSERT with sender check)
- Both parties can update/view their trades

**gallery_photos**
- Users can only view/insert/update/delete their own photos

**error_logs**
- Only authenticated users can insert errors
- Users can only view their own error logs

---

## Tech Stack
- React 18 + TypeScript
- Vite build tool
- Tailwind CSS + shadcn/ui components
- Supabase (Auth, Database, Realtime, Storage)
- Web Audio API for sound
- canvas-confetti for celebrations
- html-to-image for photo exports
- localStorage for local saves
- Cloud saves via Supabase
