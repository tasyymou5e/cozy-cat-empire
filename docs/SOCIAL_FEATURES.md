# Cat Farm - Social Features Documentation

> **📚 Related Documentation:**
> - [docs/COMPONENTS.md](COMPONENTS.md) - Component architecture
> - [docs/DATABASE_DESIGN.md](DATABASE_DESIGN.md) - Database schema
> - [docs/CAT_VISUALS_AND_GALLERY.md](CAT_VISUALS_AND_GALLERY.md) - Cat display & gallery

## Overview

Cat Farm includes extensive social features enabling player-to-player interaction and cat-to-cat relationships. This document covers friends systems, trading, gifting, notifications, player profiles, content validation, and cat relationship mechanics.

---

## Table of Contents

1. [Player Social Systems](#player-social-systems)
   - [Friends System](#friends-system)
   - [Player Profiles](#player-profiles)
   - [Username System](#username-system)
   - [Content Validation](#content-validation)
   - [Notifications](#notifications)
2. [Cat Gifting System](#cat-gifting-system)
3. [Player Trading System](#player-trading-system)
4. [@Mention System](#mention-system)
5. [Cat Relationship System](#cat-relationship-system)
   - [Relationship Levels](#relationship-levels)
   - [Personality Compatibility](#personality-compatibility)
   - [Social Groups](#social-groups)
   - [Relationship Events](#relationship-events)
6. [UI Components](#ui-components)
7. [Database Tables](#database-tables)
8. [Real-Time Updates](#real-time-updates)
9. [Activity Logging](#activity-logging)

---

## Player Social Systems

### Friends System

**Hook:** `src/hooks/useFriends.ts`

Manages friend relationships between players including sending, accepting, and declining requests.

#### Interfaces

```typescript
interface Friend {
  id: string;                    // Friendship record ID
  friend_id: string;             // Friend's user ID
  display_name: string | null;   // Friend's display name
  username: string | null;       // Friend's @username
  avatar_emoji: string;          // Friend's avatar emoji
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  stats?: {
    total_show_wins: number;
    total_cats_owned: number;
    total_kittens_bred: number;
  };
}

interface FriendRequest {
  id: string;                    // Request record ID
  user_id: string;               // Sender's user ID
  display_name: string | null;   // Sender's display name
  username: string | null;       // Sender's @username
  avatar_emoji: string;          // Sender's avatar emoji
  created_at: string;
}
```

#### Hook Returns

```typescript
{
  friends: Friend[];                    // List of accepted friends
  pendingRequests: FriendRequest[];     // Incoming friend requests
  loading: boolean;
  fetchFriends: () => Promise<void>;
  sendFriendRequest: (username: string) => Promise<{ success: boolean; error?: string }>;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendshipId: string) => Promise<void>;
}
```

#### Usage Example

```tsx
const { friends, pendingRequests, sendFriendRequest, acceptRequest } = useFriends(userId);

// Send a friend request by display name OR @username
const result = await sendFriendRequest('PlayerName');
// OR
const result = await sendFriendRequest('cool_cat42');

if (result.success) {
  toast.success('Friend request sent!');
}

// Accept an incoming request
await acceptRequest(requestId);
```

#### Key Features
- Search friends by display name OR @username (case-insensitive)
- Prevents self-friending
- Prevents duplicate friend requests
- Both parties can view and manage friendship
- Friend stats displayed (show wins, cats, kittens)

---

### Player Profiles

**Hook:** `src/hooks/usePlayerProfile.ts`

Manages the current player's profile data including display name, avatar, and username.

#### Interface

```typescript
interface PlayerProfile {
  id: string;
  display_name: string | null;
  avatar_emoji: string;
  username: string | null;
}
```

#### Hook Returns

```typescript
{
  profile: PlayerProfile | null;
  loading: boolean;
  fetchProfile: () => Promise<void>;
  updateProfile: (displayName: string, avatarEmoji: string, username?: string) => Promise<{ success: boolean; error?: string }>;
}
```

#### Avatar Options

Available avatar emojis:
```typescript
const AVATAR_OPTIONS = [
  '😺', '😸', '😻', '😽', '🐱', '🐈', '🐈‍⬛', '😼', 
  '🙀', '😿', '😾', '🦁', '🐯', '🐆', '🐅', '🎀'
];
```

---

### Username System

Unique @usernames for social mentions and friend discovery.

#### Validation Rules

| Rule | Value | Description |
|------|-------|-------------|
| Minimum length | 3 | Short usernames reserved |
| Maximum length | 20 | Fits in UI elements |
| Allowed characters | `a-z`, `0-9`, `_` | Simple, clean format |
| Must start with | Letter | Prevents confusion |
| Case sensitivity | Insensitive | `CoolCat` = `coolcat` |
| Uniqueness | Required | Unique index enforced |

#### Database Constraint

```sql
CREATE UNIQUE INDEX profiles_username_unique_idx 
ON public.profiles (LOWER(username)) 
WHERE username IS NOT NULL;
```

#### Usage
- Friend search by @username
- @mentions in messages
- Unique player identification

---

### Content Validation

**Edge Function:** `supabase/functions/validate-display-name/index.ts`

Validates display names and usernames for inappropriate content during signup and profile editing.

#### Profanity Filter Features

| Feature | Description |
|---------|-------------|
| Word list | 100+ common profane words in multiple languages |
| Leetspeak detection | Catches `@$$`, `sh1t`, `f*ck`, `pr0n`, etc. |
| Character normalization | Strips spaces, underscores, repeated chars |
| False positive whitelist | Prevents blocking words like "assessment" |
| Multi-language | Basic English, Spanish, Portuguese support |

#### Normalization Pipeline

1. Convert to lowercase
2. Replace leetspeak characters (`0`→`o`, `@`→`a`, `$`→`s`, etc.)
3. Remove repeated characters (`fuuuck`→`fuck`)
4. Strip spaces and underscores between letters

#### Validation Response

```typescript
interface ValidationResult {
  valid: boolean;
  available: boolean;
  error?: string;
  profanityViolation?: boolean;
  suggestions?: string[];
}
```

#### Example Usage

```typescript
// Validate display name
const response = await fetch('/functions/v1/validate-display-name', {
  method: 'POST',
  body: JSON.stringify({ displayName: 'CoolPlayer' })
});

// Validate username
const response = await fetch('/functions/v1/validate-display-name', {
  method: 'POST',
  body: JSON.stringify({ 
    username: 'cool_cat42',
    action: 'validate_username'
  })
});
```

---

### Notifications

**Hook:** `src/hooks/useNotifications.ts`

Aggregates notifications from friend requests, cat gifts, and trade offers with real-time updates.

#### Interface

```typescript
interface Notification {
  id: string;
  type: 'friend_request' | 'gift' | 'trade';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: Record<string, unknown>;
}
```

#### Hook Returns

```typescript
{
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  clearAll: () => void;
  refetch: () => Promise<void>;
}
```

#### Real-Time Subscriptions

The hook subscribes to three Supabase channels:
- `friend-notifications` - INSERT events on `player_friends`
- `gift-notifications` - INSERT events on `cat_gifts`
- `trade-notifications` - INSERT events on `trade_offers`

Each event triggers a toast notification and refetches the notification list.

---

## Cat Gifting System

**Hook:** `src/hooks/useCatGifts.ts`

Enables players to send cats as gifts to friends.

#### Interface

```typescript
interface CatGift {
  id: string;
  sender_id: string;
  recipient_id: string;
  cat_data: Cat;                           // Full cat object
  message: string | null;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  sender_name?: string;
  recipient_name?: string;
}
```

#### Hook Returns

```typescript
{
  receivedGifts: CatGift[];               // Pending gifts for the user
  sentGifts: CatGift[];                   // All gifts sent by user
  loading: boolean;
  sendGift: (recipientId: string, cat: Cat, message?: string) => Promise<{ success: boolean; error?: string }>;
  acceptGift: (giftId: string) => Promise<Cat | null>;  // Returns cat data on success
  declineGift: (giftId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
  newGiftAlert: CatGift | null;           // For popup dialog
  clearNewGift: () => void;
}
```

#### Gift Flow

1. **Sending a Gift:**
   - Select a cat from your collection
   - Choose a friend as recipient
   - Optionally add a message (supports @mentions)
   - Cat is removed from sender's collection when gift is sent
   - Logs activity to `player_activity_log`

2. **Receiving a Gift:**
   - Real-time notification appears
   - `GiftReceivedDialog` popup shows cat details
   - Accept: Cat is added to recipient's collection
   - Decline: Gift status updated, cat data lost

3. **Gift Statuses:**
   - `pending`: Awaiting recipient action
   - `accepted`: Cat transferred to recipient
   - `declined`: Gift rejected

#### Real-Time Updates

Subscribes to `cat-gifts-changes` channel:
- INSERT events: Triggers `newGiftAlert` popup and refetch
- UPDATE events: Refetches gift list

---

## Player Trading System

**Hook:** `src/hooks/useTrading.ts`

Enables complex player-to-player trades with cats, money, and resources.

#### Interfaces

```typescript
interface TradeOffer {
  id: string;
  sender_id: string;
  recipient_id: string;
  offered_cats: Cat[];
  offered_money: number;
  offered_resources: Partial<Resources>;
  requested_cats: Cat[];                   // Not currently used
  requested_money: number;
  requested_resources: Partial<Resources>; // Not currently used
  message: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  created_at: string;
  expires_at: string;                      // 7 days from creation
  sender_name?: string;
  recipient_name?: string;
}

interface TradeData {
  recipientId: string;
  offeredCats: Cat[];
  offeredMoney: number;
  offeredResources: Partial<Resources>;
  requestedMoney: number;
  requestedResources: Partial<Resources>;
  message?: string;
}
```

#### Hook Returns

```typescript
{
  incomingTrades: TradeOffer[];           // Pending trades for user
  outgoingTrades: TradeOffer[];           // All trades sent by user
  loading: boolean;
  createTrade: (tradeData: TradeData) => Promise<{ success: boolean; error?: string }>;
  acceptTrade: (tradeId: string) => Promise<TradeOffer | null>;
  declineTrade: (tradeId: string) => Promise<boolean>;
  cancelTrade: (tradeId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
  newTradeAlert: TradeOffer | null;       // For popup dialog
  clearNewTrade: () => void;
}
```

#### Trade Flow

1. **Creating a Trade:**
   - Select friend as recipient
   - Choose cats to offer (multi-select)
   - Set money to offer and request
   - Add optional message (supports @mentions)
   - Offered cats and money are removed immediately from sender

2. **Receiving a Trade:**
   - Real-time notification appears
   - `TradeReceivedDialog` popup shows offer details
   - Accept: Receive offered cats/money, pay requested money
   - Decline: Trade status updated

3. **Managing Trades:**
   - Cancel pending outgoing trades
   - View trade history with status

4. **Trade Expiration:**
   - Trades expire 7 days after creation (database default)

---

## @Mention System

**Status:** Planned Feature (components not yet created)

Allows users to tag friends in chat and trading messages using @username syntax.

### MentionTextarea Component

**Location:** `src/components/game/MentionTextarea.tsx` (planned)

**Props:**
```typescript
interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  friends: Friend[];
  disabled?: boolean;
  className?: string;
}
```

### Features
| Feature | Description |
|---------|-------------|
| `@` trigger | Autocomplete activates when `@` is typed |
| Fuzzy search | Matches username and display_name |
| Keyboard nav | Arrow keys + Enter to select |
| Visual mentions | `@username` highlighted in text |
| Friends priority | Only shows friends (can expand later) |
| Escape to close | ESC key closes dropdown |

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `@` | Open autocomplete |
| `↑/↓` | Navigate suggestions |
| `Enter` | Select suggestion |
| `Escape` | Close dropdown |
| `Tab` | Select first/highlighted |

### Integration Points
- `TradingPanel.tsx` - Trade messages
- `CatGiftingPanel.tsx` - Gift messages

### MentionBadge Component

**Location:** `src/components/game/MentionBadge.tsx` (planned)

Renders @mentions as styled badges in displayed messages:

```typescript
interface MentionBadgeProps {
  username: string;
  displayName?: string;
  avatarEmoji?: string;
}
```

### Mention Resolution

When displaying messages, resolve @mentions:

```typescript
// Parse message text and convert @username to MentionBadge
function renderMessageWithMentions(message: string, friends: Friend[]): React.ReactNode {
  return message.replace(
    /@(\w+)/g,
    (match, username) => {
      const friend = friends.find(f => f.username === username);
      return friend 
        ? `<MentionBadge username="${username}" displayName="${friend.display_name}" />`
        : match;
    }
  );
}
```

### Security Considerations

| Concern | Solution |
|---------|----------|
| XSS via mention | Only allow valid username chars `[a-z0-9_]` |
| Spam mentions | Rate limit mentions per message (max 5) |
| Privacy | Only show friends in autocomplete |
| Username scraping | Search limited to authenticated users |

---

## Cat Relationship System

**Hook:** `src/hooks/useRelationships.ts`

Manages social relationships between cats within the game.

### Relationship Levels

**Type Definition:** `src/types/relationships.ts`

```typescript
type RelationshipLevel = 'enemy' | 'rival' | 'neutral' | 'friend' | 'bestFriend';

interface CatRelationship {
  catId1: string;
  catId2: string;
  level: RelationshipLevel;
  score: number;           // -100 to 100
  lastInteraction: number; // Day number
}

const RELATIONSHIP_THRESHOLDS = {
  enemy: -60,      // score <= -60
  rival: -20,      // score <= -20
  neutral: 19,     // score <= 19
  friend: 59,      // score <= 59
  bestFriend: 100, // score > 59
};
```

#### Visual Indicators

| Level | Emoji | Color |
|-------|-------|-------|
| enemy | 💔 | text-red-500 |
| rival | 😾 | text-orange-500 |
| neutral | 😐 | text-muted-foreground |
| friend | 💚 | text-green-500 |
| bestFriend | 💕 | text-pink-500 |

### Relationship Decay System

Relationships deteriorate over time if cats don't interact, encouraging regular socialization.

**Decay Constants:**
```typescript
const RELATIONSHIP_DECAY = {
  GRACE_PERIOD_DAYS: 3,        // Days before decay starts
  MODERATE_THRESHOLD_DAYS: 5,  // Days for moderate decay
  SEVERE_THRESHOLD_DAYS: 7,    // Days for severe decay
  LIGHT_DECAY: 1,              // Points lost per day (3-4 days)
  MODERATE_DECAY: 2,           // Points lost per day (5-6 days)
  SEVERE_DECAY: 3,             // Points lost per day (7+ days)
  MIN_DECAY_SCORE: -20,        // Don't decay below rival level
};
```

**Decay Schedule:**
| Days Since Interaction | Decay | Notes |
|------------------------|-------|-------|
| 0-2 days | 0/day | Grace period - no decay |
| 3-4 days | -1/day | Light decay |
| 5-6 days | -2/day | Moderate decay |
| 7+ days | -3/day | Severe decay |

**Decay Limits:**
- Minimum score for decay: -20 (rival level)
- Enemies don't decay further
- New relationships protected during grace period

**Decay Event Messages:**
- "{cat1} and {cat2} haven't spent time together lately..."
- "{cat1} seems to have forgotten about {cat2}..."
- "The bond between {cat1} and {cat2} is fading..."
- "{cat1} and {cat2} are growing apart..."

---

## Relationship Maintenance UI

### Decay Info Interface

```typescript
// src/types/relationships.ts
interface RelationshipDecayInfo {
  daysSinceInteraction: number;
  isInGracePeriod: boolean;
  isDecaying: boolean;
  decayLevel: 'none' | 'light' | 'moderate' | 'severe';
  daysUntilDecay: number;
}

function getDecayInfo(relationship: CatRelationship, currentDay: number): RelationshipDecayInfo;
function getDecayWarningColor(decayLevel: string): string;
function getDecayWarningText(decayLevel: string): string;
```

### Warning Badge System

Visual indicators on relationship cards based on decay status:

| Decay Level | Days Inactive | Badge Color | Warning Text |
|-------------|---------------|-------------|--------------|
| none | 0-2 | - | - |
| light | 3-4 | Yellow | Losing 1 point/day |
| moderate | 5-6 | Orange | Losing 2 points/day |
| severe | 7+ | Red | Losing 3 points/day |

**Components with warning badges:**
- `RelationshipPanel.tsx` - Bonds tab
- `RelationshipDirectory.tsx` - Grid view
- `SocialCalendarPanel.tsx` - Calendar view

### Last Interaction Display

Shows "X days ago" on each relationship card:
- "Today" for same-day interaction
- "1 day ago" for yesterday
- "X days ago" for older

### Decay Prevention Reminders

**Hook:** `src/hooks/useRelationshipReminders.ts`

```typescript
function useRelationshipReminders(
  relationships: CatRelationship[],
  cats: Cat[],
  currentDay: number,
  enabled?: boolean
): {
  needsAttentionCount: number;
  decayingCount: number;
  warningCount: number;
  needsAttention: CatRelationship[];
}
```

**Features:**
- Shows toast notification on game load
- "⚠️ Cat Bonds Fading!" for actively decaying relationships
- "💭 Time to Socialize!" for relationships in warning zone
- Shows once per game day

### Relationship Maintenance Streak

Tracks consecutive days where all friendships are maintained within the grace period.

**State in useRelationships:**
```typescript
{
  maintenanceStreak: number;        // Current streak days
  longestMaintenanceStreak: number; // All-time best
  lastMaintenanceDay: number | null; // Last day streak was updated
}
```

**Display:** 🔥 badge in RelationshipPanel header showing current streak

**Persistence:** Saved to cloud in relationships JSONB structure:
```typescript
{
  relationships: CatRelationship[],
  events: RelationshipEvent[],
  maintenanceStreak: number,
  longestMaintenanceStreak: number,
  lastMaintenanceDay: number | null
}
```

---

## Social Calendar Panel

**Component:** `src/components/game/SocialCalendarPanel.tsx`

Dedicated view for relationship maintenance prioritization with Quick Socialize integration.

```typescript
interface SocialCalendarPanelProps {
  cats: Cat[];
  relationships: CatRelationship[];
  currentDay: number;
  catCostumes?: Record<string, string>;
  onSocialize?: (cat1Id: string, cat2Id: string) => void;
  /** Callback to navigate to Socialize panel with pre-selected cats */
  onQuickSocialize?: (cat1Id: string, cat2Id: string) => void;
}
```

**Features:**
- Groups relationships by urgency level
- Shows decay status badges with icons
- Summary badges at top (Urgent/Warning/Attention/Healthy counts)
- Visual cat pairs with avatars
- Scrollable list for many relationships
- **Quick Socialize buttons** for neglected relationships (2+ days)

**Urgency Groups:**
| Group | Criteria | Icon | Color |
|-------|----------|------|-------|
| Urgent | 7+ days | 🚨 | Red |
| Warning | 5-6 days | ⚠️ | Orange |
| Attention | 3-4 days | 💭 | Yellow |
| Healthy | 0-2 days | ✅ | Green |

**Access:** Calendar tab in RelationshipPanel

---

## Quick Socialize Feature

**Purpose:** Streamlines relationship maintenance by allowing players to navigate directly from the Social Calendar to the Socialize panel with a neglected cat pair pre-selected.

### User Flow

1. User opens **Relationships** tab → **Calendar** sub-tab
2. User sees relationships grouped by urgency with "Quick Socialize" buttons
3. User clicks "Quick Socialize" on a neglected pair (2+ days inactive)
4. App navigates to **Social** tab with both cats pre-selected in dropdowns
5. Visual indicator shows "Quick Socialize pair selected from Calendar"
6. User clicks "Socialize" button to complete the action
7. Selection clears automatically after socializing

### Implementation

**State Management in CatFarm.tsx:**
```typescript
const [quickSocializePair, setQuickSocializePair] = useState<{cat1Id: string, cat2Id: string} | null>(null);

const handleQuickSocialize = useCallback((cat1Id: string, cat2Id: string) => {
  setQuickSocializePair({ cat1Id, cat2Id });
  setSideTab('social');  // Navigate to social tab
  playSound?.('click');
}, [playSound]);

const clearQuickSocializePair = useCallback(() => {
  setQuickSocializePair(null);
}, []);
```

**Props Flow:**
```
CatFarm
  └── RelationshipPanel (onQuickSocialize={handleQuickSocialize})
        └── SocialCalendarPanel (onQuickSocialize={onQuickSocialize})
              └── RelationshipSection (onQuickSocialize)
                    └── Button "Quick Socialize" (onClick)

CatFarm
  └── SocializePanel (initialCat1Id, initialCat2Id, onClearSelection)
```

**SocializePanel Props:**
```typescript
interface SocializePanelProps {
  cats: Cat[];
  treats: number;
  getRelationship: (catId1: string, catId2: string) => CatRelationship | null;
  onSocialize: (cat1Id: string, cat2Id: string) => void;
  catCostumes?: Record<string, string>;
  /** Pre-selected first cat ID from Quick Socialize */
  initialCat1Id?: string;
  /** Pre-selected second cat ID from Quick Socialize */
  initialCat2Id?: string;
  /** Callback when pre-selection is cleared after use */
  onClearSelection?: () => void;
}
```

**Visual Feedback:**
- Toast notification: "🤝 Quick Socialize - {Cat1} and {Cat2} are ready to bond!"
- Visual indicator in SocializePanel with Sparkles icon
- Pair indicator clears after successful socialization

### Personality Compatibility

Compatibility scores determine relationship change rates during interactions.

```typescript
const PERSONALITY_COMPATIBILITY: Record<CatPersonality, Record<CatPersonality, number>> = {
  lazy:        { lazy: 10, playful: -5, affectionate: 15, independent: 5, curious: 0, shy: 10 },
  playful:     { lazy: -5, playful: 10, affectionate: 15, independent: -10, curious: 20, shy: -5 },
  affectionate:{ lazy: 15, playful: 15, affectionate: 20, independent: -15, curious: 10, shy: 5 },
  independent: { lazy: 5, playful: -10, affectionate: -15, independent: 5, curious: 0, shy: 10 },
  curious:     { lazy: 0, playful: 20, affectionate: 10, independent: 0, curious: 15, shy: 5 },
  shy:         { lazy: 10, playful: -5, affectionate: 5, independent: 10, curious: 5, shy: 15 },
};
```

**Best Pairings:**
- Playful + Curious (+20)
- Affectionate + Affectionate (+20)
- Affectionate + Playful (+15)
- Affectionate + Lazy (+15)

**Worst Pairings:**
- Affectionate + Independent (-15)
- Playful + Independent (-10)

### Hook Returns

```typescript
{
  relationships: CatRelationship[];
  events: RelationshipEvent[];          // Last 100 events
  groups: CatGroup[];                   // Detected social groups
  lastEventId: string | null;           // For animation triggers
  
  // Relationship Management
  getRelationship: (catId1: string, catId2: string) => CatRelationship | null;
  updateRelationship: (catId1: string, catId2: string, change: number, day: number) => void;
  addEvent: (cat1: Cat, cat2: Cat, type: EventType, message: string, scoreChange: number, day: number) => void;
  
  // Socialization
  socializeCats: (cat1: Cat, cat2: Cat, day: number) => { success: boolean; message: string };
  processDailyRelationships: (cats: Cat[], day: number) => void;
  processRelationshipDecay: (cats: Cat[], day: number) => void;  // Handle decay
  
  // Analysis
  detectGroups: (cats: Cat[]) => void;
  getHappinessModifier: (catId: string) => number;
  getBreedingCompatibility: (cat1Id: string, cat2Id: string) => { canBreed: boolean; bonus: number; message: string };
  
  // State Management
  removeCatRelationships: (catId: string) => void;
  loadRelationships: (data: SaveData) => void;
  getRelationshipSaveData: () => SaveData;
}
```

### Social Groups

Groups are automatically detected using graph analysis (connected components).

```typescript
interface CatGroup {
  id: string;
  name: string;          // "The Cozy Crew", "Nap Squad", etc.
  memberIds: string[];
  leaderCatId: string;   // Cat with most connections
  type: 'friendly' | 'outcasts' | 'rivals';
}
```

**Group Names Pool:**
- The Cozy Crew, Nap Squad, The Purr Pack, Whisker Gang
- Sunny Spot Club, The Cuddle Clique, Treat Team, Meow Mob
- The Loners (for outcasts)

### Relationship Events

```typescript
interface RelationshipEvent {
  id: string;
  catId1: string;
  catId2: string;
  catName1: string;
  catName2: string;
  type: 'positive' | 'negative' | 'neutral';
  message: string;
  scoreChange: number;
  day: number;
}
```

**Positive Event Messages:**
- "{cat1} and {cat2} shared treats together"
- "{cat1} groomed {cat2} affectionately"
- "{cat1} and {cat2} played with the same toy"
- "{cat1} napped next to {cat2}"
- "{cat1} and {cat2} played together"
- "{cat1} shared a sunbeam with {cat2}"
- "{cat1} and {cat2} had a kitten together" (+15 points)

**Negative Event Messages:**
- "{cat1} hissed at {cat2}"
- "{cat1} stole {cat2}'s spot"
- "{cat1} and {cat2} fought over food"

**Decay Event Messages:**
- "{cat1} and {cat2} haven't spent time together lately..."
- "{cat1} seems to have forgotten about {cat2}..."
- "The bond between {cat1} and {cat2} is fading..."
- "{cat1} and {cat2} are growing apart..."

### Breeding Compatibility

Relationship affects breeding success:

| Level | Can Breed | Bonus | Effect |
|-------|-----------|-------|--------|
| enemy | No | 0 | "Enemies refuse to breed!" |
| rival | Yes | -10 | "50% breeding failure risk" |
| neutral | Yes | 0 | "Neutral relationship" |
| friend | Yes | +10 | "+10% kitten health" |
| bestFriend | Yes | +20 | "+20% kitten stats!" + **Perfect Match Achievement** |

### Perfect Match Achievement

Breeding best friend cats (relationship score 60+) unlocks the "Perfect Match" achievement and triggers:
- Special message: "💕 Perfect Match! [cat1] and [cat2] (best friends) had a kitten!"
- Achievement sound effect
- Activity logged with `wasBestFriendBreed: true`

### Happiness Modifier

Relationships affect cat happiness:

| Level | Happiness Modifier |
|-------|-------------------|
| bestFriend | +5 per relationship |
| friend | +2 per relationship |
| neutral | 0 |
| rival | -2 per relationship |
| enemy | -5 per relationship |

---

## UI Components

### Player Social Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `FriendsPanel` | `src/components/game/FriendsPanel.tsx` | Friends list, requests, add friends |
| `PlayerProfilePanel` | `src/components/game/PlayerProfilePanel.tsx` | Edit display name, avatar, username |
| `NotificationCenter` | `src/components/game/NotificationCenter.tsx` | Notification dropdown in header |
| `NotificationSettings` | `src/components/game/NotificationSettings.tsx` | Push notification preferences |
| `MentionTextarea` | `src/components/game/MentionTextarea.tsx` | @mention autocomplete textarea (planned) |
| `MentionBadge` | `src/components/game/MentionBadge.tsx` | Styled @mention display (planned) |

### Trading & Gifting Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `TradingPanel` | `src/components/game/TradingPanel.tsx` | Create and manage trades |
| `TradeReceivedDialog` | `src/components/game/TradeReceivedDialog.tsx` | Incoming trade popup |
| `CatGiftingPanel` | `src/components/game/CatGiftingPanel.tsx` | Send and receive cat gifts |
| `GiftReceivedDialog` | `src/components/game/GiftReceivedDialog.tsx` | Incoming gift popup |

### Cat Relationship Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `RelationshipPanel` | `src/components/game/RelationshipPanel.tsx` | View all relationships, groups, history |
| `RelationshipNetworkGraph` | `src/components/game/RelationshipNetworkGraph.tsx` | Interactive force-directed graph |
| `RelationshipDirectory` | `src/components/game/RelationshipDirectory.tsx` | Grid view of relationships |
| `SocialCalendarPanel` | `src/components/game/SocialCalendarPanel.tsx` | Relationship decay management |
| `SocializePanel` | `src/components/game/SocializePanel.tsx` | Manual cat socialization |
| `MatchmakingPanel` | `src/components/game/MatchmakingPanel.tsx` | AI-suggested cat pairings |
| `GroupActivitiesPanel` | `src/components/game/GroupActivitiesPanel.tsx` | Group bonding activities |

### Component Details

#### FriendsPanel

**Props:**
```typescript
interface FriendsPanelProps {
  userId: string | undefined;
}
```

**Tabs:**
1. **Friends** - List of accepted friends with stats and @usernames
2. **Requests** - Pending incoming requests with accept/decline
3. **Add** - Search by display name or @username and send friend requests

#### TradingPanel

**Props:**
```typescript
interface TradingPanelProps {
  userId: string | undefined;
  cats: Cat[];
  money: number;
  resources: Resources;
  onTradeComplete: (removeCats: string[], addCats: Cat[], moneyChange: number, resourceChanges: Partial<Resources>) => void;
  catCostumes?: Record<string, string>;
}
```

**Tabs:**
1. **Create** - Select friend, cats, money to offer/request (supports @mentions in message)
2. **Incoming** - Pending trades with accept/decline
3. **Outgoing** - Sent trades with cancel option

#### CatGiftingPanel

**Props:**
```typescript
interface CatGiftingPanelProps {
  userId: string | undefined;
  cats: Cat[];
  onGiftSent: (catId: string) => void;
  onGiftReceived: (cat: Cat) => void;
  catCostumes?: Record<string, string>;
}
```

**Tabs:**
1. **Send** - Select cat and recipient (supports @mentions in message)
2. **Received** - Pending gifts with accept/decline
3. **Sent** - Gift history with statuses

#### RelationshipNetworkGraph

**Props:**
```typescript
interface RelationshipNetworkGraphProps {
  cats: Cat[];
  relationships: CatRelationship[];
  onCatClick?: (catId: string) => void;
}
```

**Features:**
- Force-directed layout algorithm
- Color-coded relationship lines
- Hover to highlight connections
- Toggle neutral relationships
- Animated best friend and enemy lines
- Interactive tooltips

#### GroupActivitiesPanel

**Props:**
```typescript
interface GroupActivitiesPanelProps {
  cats: Cat[];
  groups: CatGroup[];
  treats: number;
  toys: number;
  onGroupActivity: (groupId: string, activityType: 'play' | 'treat' | 'nap') => void;
}
```

**Activities:**
| Activity | Cost | Happiness Bonus | Relationship Bonus |
|----------|------|-----------------|-------------------|
| Group Playtime 🎾 | 1 toy | +10 | +5 |
| Treat Party 🍬 | 2 treats | +8 | +8 |
| Group Nap 😴 | Free | +5 | +3 |

---

## Database Tables

### profiles

User profile data for social features.

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  avatar_emoji TEXT DEFAULT '😺',
  username TEXT UNIQUE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique username index (case-insensitive)
CREATE UNIQUE INDEX profiles_username_unique_idx 
ON public.profiles (LOWER(username)) 
WHERE username IS NOT NULL;
```

### player_friends

Friend relationships between players.

```sql
CREATE TABLE public.player_friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,               -- Request sender
  friend_id UUID NOT NULL,             -- Request recipient
  status TEXT DEFAULT 'pending',       -- pending, accepted, blocked
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_friendship UNIQUE(user_id, friend_id),
  CONSTRAINT no_self_friend CHECK(user_id != friend_id)
);
```

**RLS Policies:**
- Users can view their own friendships (either side)
- Users can send requests (INSERT with user_id check)
- Both parties can update status
- Both parties can delete friendship

### cat_gifts

Cat gifting records.

```sql
CREATE TABLE public.cat_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  cat_data JSONB NOT NULL,             -- Full Cat object
  message TEXT,
  status TEXT DEFAULT 'pending',       -- pending, accepted, declined
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**RLS Policies:**
- Users can send gifts (INSERT with sender_id check)
- Recipients can update status
- Both parties can view

### trade_offers

Player-to-player trades.

```sql
CREATE TABLE public.trade_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  offered_cats JSONB DEFAULT '[]',
  offered_money INTEGER DEFAULT 0,
  offered_resources JSONB DEFAULT '{}',
  requested_cats JSONB DEFAULT '[]',
  requested_money INTEGER DEFAULT 0,
  requested_resources JSONB DEFAULT '{}',
  message TEXT,
  status TEXT DEFAULT 'pending',       -- pending, accepted, declined, cancelled
  expires_at TIMESTAMPTZ DEFAULT now() + interval '7 days',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**RLS Policies:**
- Users can create trades (INSERT with sender_id check)
- Both parties can update status
- Both parties can view

### public_profiles (View)

Public-safe view of profiles for social features.

```sql
CREATE VIEW public.public_profiles AS
SELECT id, display_name, avatar_emoji, created_at
FROM public.profiles;
```

**Note:** This view intentionally excludes `username` for privacy. Use the `profiles` table directly when username access is needed (with proper RLS).

---

## Real-Time Updates

### Supabase Channels

The social features use multiple Supabase real-time channels:

```typescript
// Friend Notifications
supabase.channel('friend-notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'player_friends',
    filter: `friend_id=eq.${userId}`
  }, callback)

// Gift Notifications
supabase.channel('gift-notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'cat_gifts',
    filter: `recipient_id=eq.${userId}`
  }, callback)

// Trade Notifications
supabase.channel('trade-notifications')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'trade_offers',
    filter: `recipient_id=eq.${userId}`
  }, callback)
```

### Toast Notifications

Real-time events trigger toast notifications:
- 👥 "New Friend Request!" - Someone wants to be your friend
- 🎁 "New Cat Gift!" - Someone sent you a cat
- 📦 "New Trade Offer!" - Someone wants to trade with you

---

## Activity Logging

Social actions are logged to `player_activity_log`:

### Friend Activity Logging

```typescript
// Friend request sent
logPlayerActivity(userId, {
  activityType: 'friend_request_sent',
  activityDescription: `Sent friend request to ${displayName}`,
  metadata: { target_user_id: friendId, target_username: username }
});

// Friend request accepted
logPlayerActivity(userId, {
  activityType: 'friend_request_accepted',
  activityDescription: `Accepted friend request from ${displayName}`,
  metadata: { friend_user_id: senderId, friend_username: username }
});

// Friend removed
logPlayerActivity(userId, {
  activityType: 'friend_removed',
  activityDescription: `Removed ${displayName} from friends`,
  metadata: { removed_user_id: friendId, removed_username: username }
});
```

### Gift Activity Logging

```typescript
// Gift sent
logPlayerActivity(userId, {
  activityType: 'gift_sent',
  activityDescription: `Sent ${cat.name} as a gift`,
  metadata: { cat_name: cat.name, cat_breed: cat.breed, recipient_id: recipientId }
});

// Gift received
logPlayerActivity(userId, {
  activityType: 'gift_received',
  activityDescription: `Received ${gift.cat_data.name} as a gift`,
  metadata: { cat_name: gift.cat_data.name, cat_breed: gift.cat_data.breed, sender_id: gift.sender_id }
});
```

### Trade Activity Logging

```typescript
// Trade created
logPlayerActivity(userId, {
  activityType: 'trade_created',
  activityDescription: `Created a trade offer with ${offeredCats.length} cat(s)`,
  metadata: { offered_cats: offeredCats.map(c => c.name), offered_money, recipient_id }
});

// Trade completed
logPlayerActivity(userId, {
  activityType: 'trade_completed',
  activityDescription: 'Completed a trade',
  metadata: { trade_id, received_cats: cats.map(c => c.name), received_money, sender_id }
});
```

---

## File Structure

```
src/
├── hooks/
│   ├── useFriends.ts           # Friend management (with username support)
│   ├── usePlayerProfile.ts     # Profile management (with username)
│   ├── useNotifications.ts     # In-app notifications
│   ├── useCatGifts.ts          # Cat gifting
│   ├── useTrading.ts           # Player trading
│   ├── useRelationships.ts     # Cat relationships
│   ├── useRelationshipReminders.ts # Decay reminders
│   └── usePlayerActivityLog.ts # Activity logging
├── components/game/
│   ├── FriendsPanel.tsx        # Friends UI
│   ├── PlayerProfilePanel.tsx  # Profile UI
│   ├── NotificationCenter.tsx  # Notification dropdown
│   ├── NotificationSettings.tsx# Push notification preferences
│   ├── TradingPanel.tsx        # Trading UI
│   ├── TradeReceivedDialog.tsx # Incoming trade popup
│   ├── CatGiftingPanel.tsx     # Gifting UI
│   ├── GiftReceivedDialog.tsx  # Incoming gift popup
│   ├── RelationshipPanel.tsx   # Relationship overview
│   ├── RelationshipNetworkGraph.tsx # Force-directed graph
│   ├── RelationshipDirectory.tsx    # Grid view
│   ├── SocialCalendarPanel.tsx      # Calendar view
│   ├── SocializePanel.tsx      # Manual socialization
│   ├── MatchmakingPanel.tsx    # AI pairings
│   └── GroupActivitiesPanel.tsx# Group bonding
├── types/
│   └── relationships.ts        # Relationship types
└── supabase/functions/
    └── validate-display-name/  # Content validation edge function
```

---

## Integration with Game State

Cat relationship data is saved and loaded with the cloud save system:

```typescript
// In useCloudSave.ts
const saveData = {
  game_state: gameState,
  kittens_bred: kittensBred,
  relationships: {
    relationships: relationshipSystem.relationships,
    events: relationshipSystem.events,
    maintenanceStreak: relationshipSystem.maintenanceStreak,
    longestMaintenanceStreak: relationshipSystem.longestMaintenanceStreak,
    lastMaintenanceDay: relationshipSystem.lastMaintenanceDay
  }
};

// Loading
relationshipSystem.loadRelationships(savedData.relationships);
```

---

## Future Enhancements

1. **@Mention Notifications** - Notify users when mentioned in messages
2. **Global @Mention Search** - Search all users, not just friends
3. **Cat Mentions** - @cat_name to mention specific cats
4. **Mention History** - Recently mentioned users at top of autocomplete
5. **Rich Previews** - Hover on mention to see profile card
6. **Username Change Cooldown** - Limit username changes to prevent abuse
