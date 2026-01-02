# Cat Farm Game - Knowledge Base

## Overview
Cat Farm is a browser-based idle/management game where players build a cat empire. Start with a small apartment and grow to own a 100-acre farm with dozens of cats. Features cloud saves, global leaderboards, social features, cat gifting, and player trading.

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

### 7. Costume System (`src/types/costumes.ts`, `src/components/game/CostumeShopPanel.tsx`)

**Categories:**
- Hats (8 costumes): Party Hat, Crown, Wizard Hat, etc.
- Outfits (4 costumes): Tuxedo, Princess Dress, etc.
- Accessories (4 costumes): Bow Tie, Glasses, etc.
- Special (4 costumes): Astronaut Suit, Superhero Cape, etc.

**Features:**
- 16 total costumes with prices $50-$500
- Costumes can be bought and equipped to cats
- Some costumes are rare/seasonal

### 8. Show Events (`src/types/showEvents.ts`)

**Show Tiers:**
- Local, Regional, National, International
- Each with different entry fees and prize pools

**Seasonal Events:**
- Spring, Summer, Fall, Winter events
- Special events with bonus rewards

### 9. Daily Events (`src/types/dailyEvents.ts`)

**Event Types:**
- Random daily events affecting money, resources, reputation
- Cat-specific effects (health, happiness, hunger changes)

---

## Social & Multiplayer Systems

### 10. Authentication (`src/contexts/AuthContext.tsx`)

**Features:**
- Email/password authentication via Supabase
- Session management
- Auto-confirm email signups

### 11. Cloud Saves (`src/hooks/useCloudSave.ts`)

**Features:**
- Auto-save every 5 minutes when logged in
- Manual save/load buttons
- Syncs game state, kittens bred, relationships

**Database Table:** `game_saves`
- `user_id`, `game_state` (JSONB), `kittens_bred`, `relationships`, `last_played_at`

### 12. Global Leaderboard (`src/hooks/useGlobalLeaderboard.ts`, `src/components/game/GlobalLeaderboardPanel.tsx`)

**Leaderboard Categories:**
- Show Wins, Cats Owned, Kittens Bred, Money Earned, Achievements

**Features:**
- Real-time updates
- Player stats synced on cloud save
- Displays top players with avatars

**Database Table:** `player_stats`
- `user_id`, `display_name`, `avatar_emoji`, `total_show_wins`, `total_cats_owned`, etc.

### 13. Friends System (`src/hooks/useFriends.ts`, `src/components/game/FriendsPanel.tsx`)

**Features:**
- Send/accept/decline friend requests
- View friends list with stats
- Search friends by username

**Database Table:** `player_friends`
- `user_id`, `friend_id`, `status` (pending/accepted/blocked)

### 14. Player Profile (`src/hooks/usePlayerProfile.ts`, `src/components/game/PlayerProfilePanel.tsx`)

**Features:**
- Edit display name and avatar emoji
- View personal stats

**Database Table:** `profiles`
- `id`, `display_name`, `avatar_emoji`, `username`

### 15. Cat Gifting (`src/hooks/useCatGifts.ts`, `src/components/game/CatGiftingPanel.tsx`)

**Features:**
- Send cats as gifts to friends
- Accept/decline received gifts
- Optional gift message
- Real-time notifications

**Database Table:** `cat_gifts`
- `sender_id`, `recipient_id`, `cat_data` (JSONB), `message`, `status`

### 16. Player Trading (`src/hooks/useTrading.ts`, `src/components/game/TradingPanel.tsx`)

**Features:**
- Create trade offers with cats and money
- Accept/decline/cancel trades
- Real-time trade notifications
- 7-day expiration on trade offers

**Database Table:** `trade_offers`
- `sender_id`, `recipient_id`, `offered_cats`, `offered_money`, `requested_money`, `status`

### 17. Notifications (`src/hooks/useNotifications.ts`, `src/components/game/NotificationCenter.tsx`)

**Notification Types:**
- Friend requests
- Cat gifts received
- Trade offers

**Features:**
- Real-time push notifications via Supabase Realtime
- Bell icon with unread count badge
- Click to navigate to relevant tab

---

## Components

### Main Game (`src/components/game/CatFarm.tsx`)
- Master component orchestrating all panels
- 15-tab sidebar layout
- Audio controls in header
- Notification center
- Cloud sync indicator

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

### Support Components:
- **StatusBar**: Money, day, house, cat show (React.forwardRef)
- **MessageBar**: Game notifications (React.forwardRef)
- **GradeBadge**: Visual grade display
- **ComfortButton**: 20-second comfort timer
- **RelationshipAnimations**: Floating emojis
- **MoodAnimations**: Cat mood indicators
- **TutorialSystem**: New player tutorial
- **KeyboardShortcutsHelp**: Keyboard shortcuts modal
- **DailyEventToast**: Daily event notifications
- **NotificationCenter**: Real-time notifications dropdown

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

---

## Database Schema

### Tables (Supabase):

**profiles**
- `id` (UUID, PK, references auth.users)
- `display_name` (TEXT)
- `avatar_emoji` (TEXT, default '😺')
- `username` (TEXT)

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
- `offered_cats` (JSONB), `offered_money` (INTEGER)
- `requested_money` (INTEGER)
- `status` (TEXT: pending/accepted/declined/cancelled)
- `expires_at` (TIMESTAMPTZ)

---

## File Structure

```
src/
├── components/
│   ├── game/           # All game UI components (20+ files)
│   └── ui/             # shadcn/ui components
├── hooks/
│   ├── useGameState.ts      # Core game logic
│   ├── useRelationships.ts  # Cat relationships
│   ├── useSoundEffects.ts   # Audio system
│   ├── useConfetti.ts       # Celebrations
│   ├── useCloudSave.ts      # Cloud persistence
│   ├── useGlobalLeaderboard.ts
│   ├── useFriends.ts        # Friends system
│   ├── usePlayerProfile.ts  # Profile management
│   ├── useCatGifts.ts       # Cat gifting
│   ├── useTrading.ts        # Player trading
│   ├── useNotifications.ts  # Real-time notifications
│   └── useKeyboardShortcuts.ts
├── types/
│   ├── game.ts              # Cat, GameState, constants
│   ├── grading.ts           # Grade system
│   ├── relationships.ts     # Relationship types
│   ├── costumes.ts          # Costume definitions
│   ├── showEvents.ts        # Show tiers and events
│   └── dailyEvents.ts       # Daily random events
├── contexts/
│   ├── AuthContext.tsx      # Authentication
│   └── SoundContext.tsx     # Sound provider
├── integrations/
│   └── supabase/
│       ├── client.ts        # Supabase client
│       └── types.ts         # Generated types
└── pages/
    ├── Index.tsx            # Main game page
    ├── Auth.tsx             # Login/signup
    ├── CatCollection.tsx    # Trading card view
    └── NotFound.tsx
```

---

## Tech Stack
- React 18 + TypeScript
- Vite build tool
- Tailwind CSS + shadcn/ui components
- Supabase (Auth, Database, Realtime)
- Web Audio API for sound
- canvas-confetti for celebrations
- localStorage for local saves
- Cloud saves via Supabase
