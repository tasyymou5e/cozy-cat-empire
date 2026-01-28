
# Create JSDoc Knowledge Base

## Overview

This plan creates a comprehensive knowledge file documenting all JSDoc comments across the Cat Farm codebase, organized by category and file location.

## Files to Create

### `docs/JSDOC_REFERENCE.md`

A single comprehensive documentation file cataloging all JSDoc-documented modules, interfaces, types, functions, and hooks in the project.

---

## Document Structure

### 1. Hooks - Core Game Systems
| File | Module | Description |
|------|--------|-------------|
| `src/hooks/useCatGifts.ts` | `hooks/useCatGifts` | Cat gifting system with real-time notifications |
| `src/hooks/useRelationships.ts` | `hooks/useRelationships` | Cat relationship management (-100 to +100 scores) |
| `src/hooks/useFriends.ts` | `hooks/useFriends` | Player friend connections and requests |
| `src/hooks/useTrading.ts` | `hooks/useTrading` | Player-to-player trading with cats/money/resources |
| `src/hooks/useCloudSave.ts` | - | Cloud save/load with external update detection |
| `src/hooks/useAutoSave.ts` | `hooks/useAutoSave` | Automatic periodic cloud saves with change detection |
| `src/hooks/useErrorLogger.ts` | - | Comprehensive error logging and tracking |
| `src/hooks/useConfetti.ts` | - | Confetti animations for celebrations |
| `src/hooks/useHaptics.ts` | - | Mobile haptic feedback patterns |
| `src/hooks/useDailyLoginRewards.ts` | `hooks/useDailyLoginRewards` | Daily login tracking and VIP tier system |
| `src/hooks/useWeeklyChallenges.ts` | `hooks/useWeeklyChallenges` | Weekly challenge progress and rewards |
| `src/hooks/useBroadcastSync.ts` | `hooks/useBroadcastSync` | Cross-tab state synchronization |
| `src/hooks/useNotifications.ts` | - | Real-time in-app notifications |
| `src/hooks/usePlayerProfile.ts` | - | Player profile data management |
| `src/hooks/usePlayerActivityLog.ts` | - | Player activity logging |
| `src/hooks/useInfiniteScroll.ts` | - | Infinite scroll utility |
| `src/hooks/usePrefetch.ts` | - | Route prefetching utilities |
| `src/hooks/usePortraitOutdatedToast.ts` | - | Portrait outdated notifications |

### 2. Libraries and Utilities
| File | Module | Description |
|------|--------|-------------|
| `src/lib/saveMigration.ts` | `lib/saveMigration` | Save data migration between versions |
| `src/lib/avatarCache.ts` | - | Paper.js avatar caching with LRU eviction |

### 3. Components with JSDoc Props
| File | Interface | Description |
|------|-----------|-------------|
| `src/components/game/MobileNavFAB.tsx` | `MobileNavFABProps` | Mobile floating action button |
| `src/components/game/AutoSaveIndicator.tsx` | `AutoSaveStatus`, `AutoSaveIndicatorProps` | Cloud save status display |
| `src/components/game/MarketPanel.tsx` | `MarketPanelProps` | Market listings panel |
| `src/components/game/BreedingPanel.tsx` | `BreedingPanelProps` | Cat breeding interface |
| `src/components/game/CatGiftingPanel.tsx` | `CatGiftingPanelProps` | Gift sending panel |
| `src/components/game/PhotoLightbox.tsx` | `PhotoLightboxProps` | Photo gallery lightbox |
| `src/components/game/TutorialHotspot.tsx` | `TutorialHotspotProps` | Tutorial highlight wrapper |

### 4. Type Definitions
| File | Key Types |
|------|-----------|
| `src/types/gallery.ts` | `GalleryPhoto`, `CloudGalleryPhoto` |
| `src/types/collections.ts` | `CollectionCategory`, `CollectionItem`, `CollectionSet` |
| `src/types/admin.ts` | `AdminUserProfile`, `LinterIssue`, `SecurityScanHistory` |

### 5. Admin Hooks
| File | Description |
|------|-------------|
| `src/hooks/admin/useSyncHealth.ts` | Sync health logs for admin dashboard |
| `src/hooks/admin/useSecurityHistory.ts` | Security scan history and trend analysis |

---

## Content for Each Documented Item

For each hook/module, the document will include:
- **File path**
- **Module declaration** (if present)
- **Description/purpose**
- **All documented interfaces with properties**
- **All documented functions with parameters and return types**
- **Usage examples** (where provided)

---

## Key Documented Interfaces

### Cat Gifting (`useCatGifts.ts`)
```typescript
/** Valid gift status values */
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

### Relationships (`useRelationships.ts`)
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

### Trading (`useTrading.ts`)
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

### Daily Login Rewards (`useDailyLoginRewards.ts`)
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

### Weekly Challenges (`useWeeklyChallenges.ts`)
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

### Auto Save (`useAutoSave.ts`)
```typescript
interface AutoSaveStats {
  lastSaveTime: string | null;
  saveCount: number;
  errorCount: number;
  lastError: string | null;
  isRetrying: boolean;
}

interface UseAutoSaveOptions {
  intervalMs?: number;
  enabled?: boolean;
  onSaveStart?: () => void;
  onSaveComplete?: () => void;
  onSaveError?: (error: Error, retryCount: number) => void;
}
```

### Save Migration (`saveMigration.ts`)
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
  relationships: { ... };
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

---

## Document Organization

The knowledge file will be organized into these sections:

1. **Overview** - Purpose and scope of JSDoc documentation
2. **Hooks Reference** - All documented hooks with full details
3. **Component Props Reference** - Documented component interfaces
4. **Type Definitions Reference** - Shared types and interfaces
5. **Utility Functions Reference** - Library functions with JSDoc
6. **Admin Hooks Reference** - Admin-specific hooks

Each section will include:
- File path
- Module declaration (if `@module` tag present)
- Description
- All interfaces with property-level documentation
- All functions with parameter and return documentation
- Code examples from `@example` tags

---

## Estimated Length

The final document will be approximately 1,500-2,000 lines covering:
- 18+ hooks with full documentation
- 7+ component prop interfaces
- 4+ type definition files
- 2+ utility libraries
- All associated interfaces, functions, and examples
