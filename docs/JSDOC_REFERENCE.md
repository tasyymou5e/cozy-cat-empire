# Cat Farm - JSDoc Reference

A comprehensive catalog of all JSDoc-documented modules, interfaces, types, functions, and hooks in the Cat Farm codebase.

---

## Table of Contents

1. [Hooks - Core Game Systems](#hooks---core-game-systems)
2. [Hooks - Social Features](#hooks---social-features)
3. [Hooks - Progress & Rewards](#hooks---progress--rewards)
4. [Hooks - Utilities](#hooks---utilities)
5. [Libraries & Utilities](#libraries--utilities)
6. [Type Definitions](#type-definitions)
7. [Admin Hooks](#admin-hooks)

---

## Hooks - Core Game Systems

### useErrorLogger

**File:** `src/hooks/useErrorLogger.ts`

**Purpose:** Comprehensive error logging and tracking system.

Captures and logs errors to the database including uncaught exceptions, unhandled promise rejections, component errors, and network failures. Automatically sets up global error handlers on mount.

**Interfaces:**

```typescript
interface ErrorLogData {
  error_type: string;
  error_message: string;
  error_stack?: string;
  component_name?: string;
  route?: string;
  metadata?: Record<string, unknown>;
}
```

**Functions:**

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `logError` | `data: ErrorLogData` | `Promise<void>` | Log a generic error to the database |
| `logInteractionError` | `eventType: string, target: string, error: Error` | `void` | Log user interaction errors |
| `logNetworkError` | `url: string, status: number, statusText: string, method: string` | `void` | Log failed HTTP requests |
| `logComponentError` | `componentName: string, error: Error, errorInfo?: { componentStack?: string }` | `void` | Log React component errors |
| `logCriticalError` | `error: Error, context: string` | `void` | Log critical errors with user notification |

**Usage Example:**

```tsx
const { logError, logComponentError, logNetworkError } = useErrorLogger();

// Log a generic error
logError({
  error_type: 'validation_error',
  error_message: 'Invalid input',
  metadata: { field: 'email' }
});

// Log a component error in error boundary
logComponentError('MyComponent', error, errorInfo);

// Log a network error
logNetworkError('/api/cats', 500, 'Internal Server Error', 'GET');
```

**Standalone Function:**

```typescript
export async function logErrorToDatabase(data: ErrorLogData & { user_id?: string }): Promise<void>
```

Use this in edge functions or utility files where React hooks are not available.

---

### useAutoSave

**File:** `src/hooks/useAutoSave.ts`  
**Module:** `hooks/useAutoSave`

**Purpose:** Automatic periodic cloud saves with change detection.

Only saves when state has actually changed since the last save, preventing unnecessary network requests. Includes retry logic for failed saves and comprehensive error logging.

**Interfaces:**

```typescript
interface AutoSaveStats {
  /** Timestamp of last successful save */
  lastSaveTime: string | null;
  /** Total saves performed */
  saveCount: number;
  /** Total save errors encountered */
  errorCount: number;
  /** Last error message */
  lastError: string | null;
  /** Whether a retry is in progress */
  isRetrying: boolean;
}

interface UseAutoSaveOptions {
  /** Interval in milliseconds between auto-save attempts (default: 1 minute) */
  intervalMs?: number;
  /** Whether auto-save is enabled - CRITICAL: Should include hasLoadedCloud check */
  enabled?: boolean;
  /** Callback when save starts */
  onSaveStart?: () => void;
  /** Callback when save completes successfully */
  onSaveComplete?: () => void;
  /** Callback when save fails (after all retries) */
  onSaveError?: (error: Error, retryCount: number) => void;
}
```

**Return Type:**

```typescript
{
  stats: AutoSaveStats;
  saveNow: () => Promise<void>;  // Trigger save (respects change detection)
  forceSave: () => Promise<void>; // Force save regardless of changes
}
```

**Usage Example:**

```tsx
const { stats, saveNow, forceSave } = useAutoSave(
  user?.id,
  state,
  kittensBreed,
  relationshipSystem.getRelationshipSaveData(),
  {
    intervalMs: 60 * 1000, // 1 minute
    enabled: isLoggedIn && hasLoadedCloud,
    onSaveStart: () => setCloudSyncing(true),
    onSaveComplete: () => {
      setCloudSyncing(false);
      setLastCloudSave(new Date().toISOString());
    },
    onSaveError: (error) => {
      setCloudSyncing(false);
      console.error('[AutoSave] Error:', error);
    },
  }
);
```

---

### useCloudSave

**File:** `src/hooks/useCloudSave.ts`

**Purpose:** Cloud save/load functionality for game persistence.

Provides functions to save and load game state to/from the cloud database. Requires user authentication to function. Detects external updates (e.g., by admin) via real-time subscriptions.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | `string \| undefined` | The authenticated user's ID |
| `onExternalUpdate` | `() => void` | Optional callback when save is updated externally |

**Return Type:**

```typescript
{
  cloudSave: (gameState, kittensBreed, relationshipData, options?) => Promise<{ success: boolean; error?: string }>;
  cloudLoad: () => Promise<{ data: CloudSaveData | null; error?: string }>;
  hasCloudSave: () => Promise<boolean>;
  getLastSaveTime: () => string | null;
  hasExternalUpdate: boolean;
  clearExternalUpdate: () => void;
  isLoaded: boolean;
}
```

**Usage Example:**

```tsx
const { cloudSave, cloudLoad, hasCloudSave, hasExternalUpdate } = useCloudSave(user?.id);
await cloudSave(gameState, kittensBreed, relationshipData);
const { data } = await cloudLoad();
```

---

### useConfetti

**File:** `src/hooks/useConfetti.ts`

**Purpose:** Confetti animations for celebrations, achievements, and challenge completions.

**Return Type:**

```typescript
{
  fireConfetti: () => void;        // Side-burst confetti
  fireCelebration: () => void;     // Big celebration burst (continuous)
  fireStars: () => void;           // Star-shaped confetti for achievements
  fireChallengeBurst: () => void;  // Burst from center with trophy colors
}
```

**Usage Example:**

```tsx
const { fireConfetti, fireCelebration, fireStars } = useConfetti();

// Simple side-burst confetti
fireConfetti();

// Big celebration with continuous bursts
fireCelebration();

// Star-shaped confetti for achievements
fireStars();

// Challenge completion burst
fireChallengeBurst();
```

---

### useHaptics

**File:** `src/hooks/useHaptics.ts`

**Purpose:** Mobile haptic feedback patterns for game events.

Only activates on mobile devices with vibration API support.

**Types:**

```typescript
type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
```

**Return Type:**

```typescript
{
  vibrate: (pattern?: HapticPattern) => void;
  vibrateProgress: () => void;      // Light tap for progress
  vibrateComplete: () => void;      // Success pattern for completion
  vibrateAchievement: () => void;   // Heavy + success pattern
  isSupported: boolean;
}
```

**Usage Example:**

```tsx
const { vibrate, vibrateComplete, isSupported } = useHaptics();

// Simple vibration
vibrate('light');

// Achievement celebration pattern
vibrateAchievement();

// Check if haptics are available
if (isSupported) {
  vibrateProgress();
}
```

---

## Hooks - Social Features

### useRelationships

**File:** `src/hooks/useRelationships.ts`  
**Module:** `hooks/useRelationships`

**Purpose:** Cat relationship management system.

Provides functionality for managing social relationships between cats, including friendships, rivalries, group detection, compatibility checks, and daily relationship events.

**Relationship Levels:**

| Level | Score Range | Description |
|-------|-------------|-------------|
| Soul Mates | 80+ | Best possible relationship |
| Best Friends | 50-79 | Strong positive bond |
| Friends | 20-49 | Positive relationship |
| Neutral | -19 to 19 | No strong feelings |
| Rivals | -49 to -20 | Mild animosity |
| Enemies | -79 to -50 | Strong dislike |
| Nemesis | -100 to -80 | Worst possible relationship |

**Interfaces:**

```typescript
interface RelationshipSaveData {
  relationships: CatRelationship[];
  events: RelationshipEvent[];
  maintenanceStreak?: number;
  longestMaintenanceStreak?: number;
  lastMaintenanceDay?: number | null;
}

interface BreedingCompatibility {
  canBreed: boolean;
  bonus: number;
  message: string;
}

interface SocializeResult {
  success: boolean;
  message: string;
}
```

**Key Functions:**

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `getRelationship` | `catId1: string, catId2: string` | `CatRelationship \| null` | Get relationship between two cats |
| `updateRelationship` | `catId1, catId2, change, day` | `void` | Update/create relationship |
| `addEvent` | `cat1, cat2, type, message, scoreChange, day` | `void` | Add relationship event |
| `socializeCats` | `cat1: Cat, cat2: Cat, day: number` | `SocializeResult` | Manually socialize two cats |
| `processDailyRelationships` | `cats: Cat[], day: number` | `void` | Process daily random interactions |
| `detectGroups` | `cats: Cat[]` | `void` | Detect social groups/cliques |
| `getBreedingCompatibility` | `catId1: string, catId2: string` | `BreedingCompatibility` | Check breeding compatibility |

**Usage Example:**

```tsx
const {
  relationships,
  events,
  groups,
  socializeCats,
  getBreedingCompatibility,
  maintenanceStreak
} = useRelationships();

// Socialize two cats
const result = socializeCats(cat1, cat2, gameState.day);
toast({ title: result.message });

// Check if cats can breed
const compat = getBreedingCompatibility(cat1.id, cat2.id);
if (!compat.canBreed) {
  toast({ title: 'Cannot breed', description: compat.message });
}
```

---

### useFriends

**File:** `src/hooks/useFriends.ts`  
**Module:** `hooks/useFriends`

**Purpose:** Friend relationship management between players.

Provides functionality for managing friend connections including sending/receiving friend requests, accepting/declining requests, and removing friends.

**Interfaces:**

```typescript
interface Friend {
  id: string;
  friend_id: string;
  display_name: string | null;
  username: string | null;
  avatar_emoji: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  stats?: {
    total_show_wins: number;
    total_cats_owned: number;
    total_kittens_bred: number;
  };
}

interface FriendRequest {
  id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_emoji: string;
  created_at: string;
}

interface FriendRequestResult {
  success: boolean;
  error?: string;
}
```

**Return Type:**

```typescript
{
  friends: Friend[];
  pendingRequests: FriendRequest[];
  loading: boolean;
  fetchFriends: () => Promise<void>;
  sendFriendRequest: (friendUsername: string) => Promise<FriendRequestResult>;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendshipId: string) => Promise<void>;
}
```

**Usage Example:**

```tsx
const {
  friends,
  pendingRequests,
  sendFriendRequest,
  acceptRequest
} = useFriends(user?.id);

// Send a friend request by username
const result = await sendFriendRequest('CoolCatPlayer');
if (!result.success) {
  console.error(result.error);
}

// Accept an incoming request
await acceptRequest(requestId);
```

---

### useCatGifts

**File:** `src/hooks/useCatGifts.ts`  
**Module:** `hooks/useCatGifts`

**Purpose:** Cat gifting system with real-time notifications.

Provides functionality for sending cats as gifts between players, including real-time notifications for incoming gifts via Supabase subscriptions.

**Interfaces:**

```typescript
export type CatGiftStatus = 'pending' | 'accepted' | 'declined' | 'revoked_by_admin';

interface CatGift {
  id: string;
  sender_id: string;
  recipient_id: string;
  cat_data: Cat;
  message: string | null;
  status: CatGiftStatus;
  created_at: string;
  sender_name?: string;
  recipient_name?: string;
}

interface GiftResult {
  success: boolean;
  error?: string;
}
```

**Return Type:**

```typescript
{
  receivedGifts: CatGift[];
  sentGifts: CatGift[];
  loading: boolean;
  sendGift: (recipientId: string, cat: Cat, message?: string) => Promise<GiftResult>;
  acceptGift: (giftId: string) => Promise<Cat | null>;
  declineGift: (giftId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
  newGiftAlert: CatGift | null;
  clearNewGift: () => void;
}
```

**Usage Example:**

```tsx
const {
  receivedGifts,
  sendGift,
  acceptGift,
  newGiftAlert
} = useCatGifts(user?.id);

// Send a cat to a friend
const result = await sendGift(friendId, myCat, 'Enjoy your new cat!');
if (result.success) {
  removeCatFromState(myCat.id);
}

// Accept a received gift
const cat = await acceptGift(giftId);
if (cat) {
  addCatToState(cat);
}
```

---

### useTrading

**File:** `src/hooks/useTrading.ts`  
**Module:** `hooks/useTrading`

**Purpose:** Player-to-player trading system with cats, money, and resources.

Provides functionality for creating, accepting, declining, and cancelling trade offers between players. Includes real-time updates via Supabase subscriptions.

**Interfaces:**

```typescript
interface TradeOffer {
  id: string;
  sender_id: string;
  recipient_id: string;
  offered_cats: Cat[];
  offered_money: number;
  offered_resources: Partial<Resources>;
  requested_cats: Cat[];
  requested_money: number;
  requested_resources: Partial<Resources>;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  created_at: string;
  expires_at: string;
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

interface TradeResult {
  success: boolean;
  error?: string;
}
```

**Return Type:**

```typescript
{
  incomingTrades: TradeOffer[];
  outgoingTrades: TradeOffer[];
  loading: boolean;
  createTrade: (tradeData: TradeData) => Promise<TradeResult>;
  acceptTrade: (tradeId: string) => Promise<TradeOffer | null>;
  declineTrade: (tradeId: string) => Promise<boolean>;
  cancelTrade: (tradeId: string) => Promise<boolean>;
  newTradeAlert: TradeOffer | null;
  clearNewTrade: () => void;
  refetch: () => Promise<void>;
}
```

**Usage Example:**

```tsx
const {
  incomingTrades,
  createTrade,
  acceptTrade
} = useTrading(user?.id);

// Create a trade offering a cat for 500 coins
const result = await createTrade({
  recipientId: friendId,
  offeredCats: [cat],
  offeredMoney: 0,
  offeredResources: {},
  requestedMoney: 500,
  requestedResources: {},
  message: 'Want to trade?'
});

// Accept an incoming trade
const trade = await acceptTrade(tradeId);
if (trade) {
  trade.offered_cats.forEach(addCatToState);
  addMoney(trade.offered_money - trade.requested_money);
}
```

---

### useNotifications

**File:** `src/hooks/useNotifications.ts`

**Purpose:** Real-time in-app notifications for friend requests, cat gifts, and trade offers.

**Interfaces:**

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

**Return Type:**

```typescript
{
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  clearAll: () => void;
  refetch: () => Promise<void>;
}
```

**Usage Example:**

```tsx
const { notifications, unreadCount, markAsRead } = useNotifications(userId);

// Display notification count in header
<Badge>{unreadCount}</Badge>

// Mark notification as read when viewed
markAsRead(notificationId);
```

---

## Hooks - Progress & Rewards

### useDailyLoginRewards

**File:** `src/hooks/useDailyLoginRewards.ts`  
**Module:** `hooks/useDailyLoginRewards`

**Purpose:** Daily login reward system with VIP tier progression.

Manages player daily login tracking, streak maintenance, VIP tier progression, and reward claiming.

**Features:**
- Automatic streak tracking (continues if logged in on consecutive days)
- Streak milestone bonuses (7-day, 30-day milestones)
- VIP tier system with multipliers for longer streaks
- Exclusive costume unlocks for VIP tiers
- Sound effects, haptics, and confetti for celebrations

**Interfaces:**

```typescript
interface ClaimRewardResult {
  coins: number;
  resources: Partial<Resources>;
  unlockedCostumes?: string[];
}

interface DailyLoginRewardsReturn {
  loginData: LoginData | null;
  todayReward: DailyReward | null;
  canClaim: boolean;
  loading: boolean;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  claimDailyReward: () => Promise<ClaimRewardResult | null>;
  currentStreak: number;
  longestStreak: number;
  totalLogins: number;
  vipTier: VIPTier | null;
  isVIP: boolean;
}
```

**Usage Example:**

```tsx
const {
  currentStreak,
  canClaim,
  todayReward,
  claimDailyReward,
  vipTier
} = useDailyLoginRewards(userId, playSound, vibrate, fireConfetti);

// Display streak info
console.log(`${currentStreak} day streak! ${vipTier?.name || 'Keep going!'}`);

// Claim reward when user clicks button
const handleClaim = async () => {
  const result = await claimDailyReward();
  if (result) {
    addMoney(result.coins);
    addResources(result.resources);
  }
};
```

---

### useWeeklyChallenges

**File:** `src/hooks/useWeeklyChallenges.ts`  
**Module:** `hooks/useWeeklyChallenges`

**Purpose:** Weekly challenge tracking system with progress and rewards.

Manages weekly challenges including progress tracking, reward claiming, and real-time updates. Integrates with the challenge achievements system for meta-progression.

**Interfaces:**

```typescript
interface HapticFunctions {
  vibrateProgress: () => void;
  vibrateComplete: () => void;
  vibrateAchievement: () => void;
}

interface ClaimResult {
  coins: number;
  badge: string | null;
}

interface WeeklyChallengesReturn {
  challenges: ChallengeWithProgress[];
  loading: boolean;
  updateProgress: (type: ChallengeType, increment?: number) => Promise<void>;
  claimReward: (challengeId: string) => Promise<ClaimResult | false>;
  getTimeRemaining: () => string | null;
  refetch: () => Promise<void>;
  lastProgressUpdate: { type: ChallengeType; value: number } | null;
  clearProgressUpdate: () => void;
  totalChallengesCompleted: number;
  currentStreak: number;
  longestStreak: number;
}
```

**Usage Example:**

```tsx
const {
  challenges,
  updateProgress,
  claimReward,
  getTimeRemaining
} = useWeeklyChallenges(userId, playSound, fireConfetti, haptics);

// Update progress when player wins a show
await updateProgress('show_wins', 1);

// Display challenges with progress
challenges.map(c => (
  <ChallengeCard
    key={c.id}
    challenge={c}
    onClaim={() => claimReward(c.id)}
  />
));
```

---

## Hooks - Utilities

### useBroadcastSync

**File:** `src/hooks/useBroadcastSync.ts`  
**Module:** `hooks/useBroadcastSync`

**Purpose:** Cross-tab state synchronization using BroadcastChannel API.

Essential for preventing data conflicts when users have multiple game tabs open.

**Pre-defined Message Types:**

```typescript
export const SYNC_MESSAGES = {
  GAME_SAVED: 'GAME_SAVED',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  DAILY_REWARD_CLAIMED: 'DAILY_REWARD_CLAIMED',
  WHEEL_SPUN: 'WHEEL_SPUN',
  SETTINGS_CHANGED: 'SETTINGS_CHANGED',
  REQUEST_REFRESH: 'REQUEST_REFRESH',
} as const;
```

**Return Type:**

```typescript
{
  broadcast: (message: { type: string; payload?: T }) => void;
  broadcastAndLocal: (message: { type: string; payload?: T }) => void;
  tabId: string;
  isSupported: boolean;
}
```

**Usage Example:**

```tsx
// In tab 1: Send a message when game saves
const { broadcast } = useBroadcastSync('game-sync', (msg) => {
  if (msg.type === 'GAME_SAVED') {
    refreshGameState();
  }
});

const handleSave = async () => {
  await saveGame();
  broadcast({ type: 'GAME_SAVED', payload: { day: gameState.day } });
};

// Tab 2 will receive the message and refresh
```

---

### usePortraitOutdatedToast

**File:** `src/hooks/usePortraitOutdatedToast.tsx`

**Purpose:** Shows toast notification when a cat's portrait becomes outdated after appearance or costume changes.

**Return Type:**

```typescript
{
  showOutdatedToast: (cat: Cat) => void;
}
```

**Usage Example:**

```tsx
const { showOutdatedToast } = usePortraitOutdatedToast();

// After appearance change
showOutdatedToast(cat);
// Toast: "Portrait Outdated - Luna's appearance has changed. [Update Portrait]"
```

---

## Libraries & Utilities

### saveMigration

**File:** `src/lib/saveMigration.ts`  
**Module:** `lib/saveMigration`

**Purpose:** Save data migration utility for upgrading old save formats.

Each migration function transforms data from version N to N+1.

**Constants:**

```typescript
export const CURRENT_SAVE_VERSION = 3;
```

**Interfaces:**

```typescript
interface RawSaveData {
  version?: number;
  state?: unknown;
  game_state?: unknown;
  kittensBreed?: number;
  kittens_bred?: number;
  relationships?: unknown;
  savedAt?: string;
  last_played_at?: string;
}

interface MigratedSaveData {
  version: number;
  state: GameState;
  kittensBreed: number;
  relationships: {
    relationships: unknown[];
    events: unknown[];
    maintenanceStreak?: number;
    longestMaintenanceStreak?: number;
    lastMaintenanceDay?: number | null;
  };
  savedAt: string;
}

interface MigrationResult {
  success: true;
  data: MigratedSaveData;
  migratedFrom: number;
  warnings: string[];
}

interface MigrationError {
  success: false;
  error: string;
  details?: string;
}
```

**Functions:**

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `migrateSaveData` | `rawData: unknown` | `MigrationOutcome` | Migrate save data to current version |
| `needsMigration` | `data: RawSaveData` | `boolean` | Check if migration is needed |
| `getSaveVersionInfo` | `data: RawSaveData` | `{ currentVersion, targetVersion }` | Get version info |

**Usage Example:**

```typescript
const saved = localStorage.getItem('catFarmSave');
if (saved) {
  const result = migrateSaveData(JSON.parse(saved));
  if (result.success) {
    loadGame(result.data);
    if (result.warnings.length) console.warn('Migration warnings:', result.warnings);
  } else {
    console.error('Migration failed:', result.error);
  }
}
```

---

### avatarCache

**File:** `src/lib/avatarCache.ts`

**Purpose:** Caches generated Paper.js avatars to avoid regenerating them. Uses localStorage with LRU eviction policy.

**Interfaces:**

```typescript
interface CacheEntry {
  svgData: string;
  timestamp: number;
  version: number;
}

interface CacheIndex {
  entries: Array<{ hash: string; timestamp: number }>;
  version: number;
}
```

**Functions:**

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `generateAppearanceHash` | `cat: Cat` | `string` | Generate hash from cat appearance |
| `generateFullAvatarHash` | `cat: Cat, costumeId?: string, size?: string` | `string` | Generate hash including costume |
| `getCachedAvatar` | `hash: string` | `string \| null` | Get cached SVG by hash |
| `setCachedAvatar` | `hash: string, svgData: string` | `void` | Store avatar in cache |
| `clearAvatarCache` | - | `void` | Clear all cached avatars |
| `pruneAvatarCache` | `maxEntries?: number` | `number` | Prune cache to max entries |
| `getAvatarCacheStats` | - | `{ entries, maxEntries }` | Get cache statistics |
| `isAvatarCached` | `hash: string` | `boolean` | Check if avatar is cached |

---

## Type Definitions

### gallery.ts

**File:** `src/types/gallery.ts`

```typescript
export interface GalleryPhoto {
  id: string;
  catId: string;
  catName: string;
  imageDataUrl: string;
  imageUrl?: string;
  imagePath?: string;
  backgroundId: string;
  poseId: string;
  frameId: string;
  stickerCount: number;
  createdAt: string;
  isFavorite: boolean;
  syncStatus: 'local' | 'syncing' | 'synced' | 'error';
  cloudId?: string;
}

export interface CloudGalleryPhoto {
  id: string;
  user_id: string;
  cat_id: string;
  cat_name: string;
  image_path: string;
  background_id: string;
  pose_id: string;
  frame_id: string;
  sticker_count: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export const GALLERY_STORAGE_KEY = 'cat-photo-gallery';
export const MAX_GALLERY_PHOTOS = 50;
```

---

### collections.ts

**File:** `src/types/collections.ts`

```typescript
export type CollectionCategory = 'breeds' | 'personalities' | 'costumes' | 'tricks';

export interface CollectionItem {
  id: string;
  name: string;
  emoji: string;
  collected: boolean;
}

export interface CollectionSet {
  id: CollectionCategory;
  name: string;
  description: string;
  emoji: string;
  items: CollectionItem[];
  reward: {
    coins?: number;
    title?: string;
    bonus?: string;
  };
}

export interface CollectionProgress {
  breeds: string[];
  personalities: string[];
  costumes: string[];
  tricks: string[];
  completedSets: CollectionCategory[];
}
```

---

### admin.ts

**File:** `src/types/admin.ts`

```typescript
export interface AdminUserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_emoji: string | null;
  username: string | null;
  created_at: string | null;
  updated_at: string | null;
  suspended_at: string | null;
  suspension_reason: string | null;
  role?: 'admin' | 'moderator' | 'user';
  cats_count?: number;
  show_wins?: number;
}

export interface LinterIssue {
  id: string;
  level: 'error' | 'warn' | 'info';
  category: 'RLS' | 'AUTH' | 'POLICY' | 'PERMISSIONS';
  title: string;
  description: string;
  tables?: string[];
  recommendation: string;
  docLink?: string;
}

export interface LinterResults {
  scannedAt: string;
  scanDurationMs: number;
  totalIssues: number;
  errors: number;
  warnings: number;
  infos: number;
  issues: LinterIssue[];
}

export interface SecurityScanHistory {
  id: string;
  scanned_at: string;
  scan_duration_ms: number;
  total_issues: number;
  errors: number;
  warnings: number;
  infos: number;
  security_score: number;
  security_grade: string;
  issues: LinterIssue[];
  scanned_by: string | null;
  created_at: string | null;
}
```

---

## Admin Hooks

### useAdminAuth

**File:** `src/hooks/admin/useAdminAuth.ts`

**Purpose:** Admin role verification for protected routes.

---

### useAdminActivityLog

**File:** `src/hooks/admin/useAdminActivityLog.ts`

**Purpose:** Logging admin actions for audit trail.

---

### useAdminData

**File:** `src/hooks/admin/useAdminData.ts`

**Purpose:** Data fetching hooks for admin dashboard.

**Sub-hooks:**
- `useAdminStats()` - Aggregate statistics
- `useAdminUsers()` - Paginated user list
- `useAdminErrors()` - Filtered error logs
- `useAdminAuthLogs()` - Authentication attempt history
- `useAdminActivityLogs()` - Admin activity history

---

### useSyncHealth

**File:** `src/hooks/admin/useSyncHealth.ts`

**Purpose:** Sync health logs for admin dashboard monitoring.

---

### useSecurityHistory

**File:** `src/hooks/admin/useSecurityHistory.ts`

**Purpose:** Security scan history and trend analysis for admin dashboard.

---

## Quick Reference

### Hook Categories

| Category | Hooks |
|----------|-------|
| **Core Game** | useErrorLogger, useAutoSave, useCloudSave, useConfetti, useHaptics |
| **Social** | useRelationships, useFriends, useCatGifts, useTrading, useNotifications |
| **Progress** | useDailyLoginRewards, useWeeklyChallenges |
| **Utilities** | useBroadcastSync, usePortraitOutdatedToast |
| **Admin** | useAdminAuth, useAdminActivityLog, useAdminData, useSyncHealth, useSecurityHistory |

### Libraries

| Library | Purpose |
|---------|---------|
| `saveMigration.ts` | Save data version migration |
| `avatarCache.ts` | Paper.js avatar caching with LRU eviction |

### Type Files

| File | Key Types |
|------|-----------|
| `gallery.ts` | GalleryPhoto, CloudGalleryPhoto |
| `collections.ts` | CollectionCategory, CollectionItem, CollectionSet |
| `admin.ts` | AdminUserProfile, LinterIssue, SecurityScanHistory |
