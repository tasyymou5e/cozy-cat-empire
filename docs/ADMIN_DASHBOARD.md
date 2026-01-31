# Admin Dashboard Documentation

## Overview

The Cat King Admin Dashboard is a comprehensive administrative interface for managing the Cat Farm game. It provides tools for user management, game statistics monitoring, error tracking, moderation, content management, and security features.

## Access

- **URL**: `/catking` (login) → `/catking/dashboard` (after authentication)
- **Requirements**: User must have `admin` role in `user_roles` table

## Features

### 1. Dashboard (`/catking/dashboard`)

Overview metrics displaying:
- Total Users
- Game Saves
- Errors (last 24 hours)
- Active Players
- Total Show Wins
- Total Cats
- Kittens Bred
- Total Economy
- **Live Activity Monitor** (auto-refreshing widget showing recent saves, errors, trades, gifts)
- **Live Activity Feed** (real-time player activity with user details)

Quick action buttons for navigation to other admin sections.

#### Live Activity Feed Component

The Live Activity Feed displays real-time player activity with enhanced user visibility:

**Features:**
- **User Display**: Shows display name AND email (not just truncated ID)
- **Clickable Entries**: Click any activity to open full UserDetailModal with user profile, cats, trades, gifts, errors
- **Responsive Design**: Font and layout dynamically scale to screen size using Tailwind responsive classes
- **Real-time Updates**: Supabase Realtime subscription for instant activity updates
- **Error Handling**: Graceful error states with retry option

**Activity Types Displayed:**
| Type | Icon | Color |
|------|------|-------|
| `login` | LogIn | Green |
| `logout` | LogIn | Gray |
| `trade_created/completed` | ArrowLeftRight | Blue |
| `gift_sent/received` | Gift | Pink |
| `cat_bred` | Heart | Purple |
| `show_win` | Trophy | Yellow |
| `challenge_completed` | Target | Orange |
| `friend_request_sent/accepted` | UserPlus | Cyan |
| `friend_removed` | UserMinus | Red |
| `purchase` | ShoppingCart | Default |

**Race Condition Safeguards:**
- `isMounted` ref guard prevents state updates after unmount
- Async profile fetch checks mount status before updating state
- Channel cleanup on component unmount

### 2. User Management (`/catking/users`)

- Searchable/filterable user table
- View user details: avatar, display name, username, join date, cats owned, show wins
- **Warning badge** for users with missing display names
- **User Detail Modal**: Click eye icon to view comprehensive user data:
  - Overview: Money, cats, wins, kittens bred, account info
  - **Inventory**: Edit player money, resources, and reset game state (with audit logging)
  - **Profile**: Edit display name, avatar, and username with validation and availability check
  - Cats: Full cat list with grades
  - Trades: Recent trade history
  - Gifts: Recent gift history
  - Errors: Error logs for that user
  - **Gift Cat Button**: Send system-generated cats to users (see Admin Gifting below)
- Role management: assign admin, moderator, or user roles
- **User Suspension**: Suspend/unsuspend users with reason tracking
- **User Deletion**: Permanently delete users via edge function
- **CSV Export**: Export user list to CSV
- Pagination support
- All role changes logged to `admin_activity_log`

#### Admin Gifting System

Admins can gift cats to users directly from the UserDetailModal:

**AdminGiftCatDialog Component:**
- Select breed from dropdown (8 breeds available)
- Set cat grade (1-20 slider)
- Enter custom cat name
- Optional gift message
- Preview calculated cat value before sending

**Gift Generation (`src/lib/adminGiftUtils.ts`):**
```typescript
// generateAdminGiftCat creates a complete Cat object with:
- Unique UUID
- Breed-specific value calculation
- Random personality (Lazy, Playful, Affectionate, Independent, Curious, Shy)
- Full stats: health=100, happiness=100, hunger=100, restLevel=100
- Empty trick progress initialized for all tricks
- Age set to 1 (young cat)
```

**Database Flow:**
1. Admin clicks "Gift Cat" in UserDetailModal
2. AdminGiftCatDialog opens with breed/grade/name form
3. On submit, cat object generated via `generateAdminGiftCat()`
4. INSERT into `cat_gifts` with admin's user_id as sender_id
5. Action logged to `admin_activity_log` with metadata
6. User receives gift in CatGiftingPanel or GiftReceivedDialog
7. User accepts → cat added to their game state

**RLS Policy (cat_gifts):**
```sql
CREATE POLICY "Admins can send gifts"
ON public.cat_gifts FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

#### Bulk Actions
- Select multiple users via checkboxes
- **Change Role**: Bulk role assignment
- **Suspend/Unsuspend**: Bulk suspension with reason
- **Delete**: Bulk deletion with confirmation
- **Send Notification**: Bulk push notification to selected users

### 3. Profile Repair Tool (`/catking/profiles`)

Repair user profiles with missing or invalid data:
- **Statistics Dashboard**: Count of NULL display names, missing usernames, default avatars
- **Users Needing Repair Table**: List all users with missing display names
- **Auto-Generate Names**: Generate display names from email prefixes with random suffixes
- **Bulk Apply**: Apply generated names to multiple users at once
- **Individual Edit**: Edit any user's profile with validation
- **Audit Logging**: All profile repairs logged with reason

#### ProfileEditor Component
Reusable component for profile editing:
- Avatar emoji picker (10 options)
- Display name input with real-time validation (3-30 chars, alphanumeric + `_- `)
- Case-insensitive availability checking
- Name suggestions if taken
- Username field (optional)
- Reason field (required for audit trail)
- **Automatic player_stats sync** - Updates are synced to `player_stats` table for leaderboard consistency
- **Orphaned profile handling** - Creates `player_stats` entry if missing when saving

### 4. Game Save Repair Tool (`/catking/game-repair`)

Detect and repair corrupted game saves automatically:
- **Corruption Detection Dashboard**: Statistics showing saves with issues by category
- **Issue Types Detected**:
  - Negative `totalMoneyEarned` values
  - Invalid/NaN money values
  - Negative money balances
  - Invalid cat ages or stats
  - Corrupted resources (negative counts)
  - Invalid house sizes
- **Affected Users Table**: List users with corrupted saves with issue details
- **Individual Repair**: Preview changes before applying with confirmation
- **Bulk Repair**: Select multiple saves and repair all at once
- **Audit Logging**: All repairs logged to `admin_activity_log`

#### Detection Logic
| Issue Type | Detection Logic | Severity |
|------------|-----------------|----------|
| Negative totalMoneyEarned | `totalMoneyEarned < 0` | High |
| NaN/Undefined money | `!isFinite(money)` | Critical |
| Negative money | `money < 0` | High |
| **Earnings Mismatch** | `money > totalMoneyEarned` | Medium |
| Invalid cat ages | `age < 0` or `!isFinite(age)` | Medium |
| Corrupted resources | Negative resource counts | Medium |
| Invalid house sizes | Not in valid enum | Low |

**Note:** The "Earnings Mismatch" detection catches logical impossibilities where a player has more current funds than they've ever earned total.

### 4. Statistics (`/catking/stats`)

Game analytics with three tabs:

#### Overview Tab
- Aggregate statistics cards
- Game metrics distribution pie chart
- Top players by show wins bar chart
- Top players by cats owned bar chart
- Summary statistics

#### Economy Tab
- Total/Average/Median wealth metrics
- Top 10% wealth share indicator
- Wealth distribution chart
- Top earners leaderboard
- Potential exploit detection (3+ standard deviations)

#### Retention Tab
- DAU/WAU/MAU metrics with percentages
- Average login streak
- Login streak distribution chart
- Activity summary panel
- DAU/MAU ratio indicator

### 4. Error Logs (`/catking/errors`)

Error monitoring features:
- Filterable error table by type and status
- Expandable rows for full error details
- Stack trace viewing
- User agent and metadata display
- **Error resolution tracking** (status, resolved_by, notes)
- **Error trends chart** (7-day visualization)
- Refresh functionality
- Pagination

### 5. Moderation (`/catking/moderation`)

Tabs for monitoring:
- **Trades**: View recent trade_offers with status, participants, and values
- **Gifts**: View recent cat_gifts between players
- **Challenges**: View weekly_challenges with active status
- **Friends**: View player_friends requests and statuses
- **Analytics**: Challenge completion rates, participation by difficulty, trends

### 6. Announcements (`/catking/announcements`)

Create and manage announcements visible to all players:
- Create/edit/delete announcements
- Announcement types: Info, Warning, Success, Event
- Set expiration dates
- Toggle active status
- Announcements appear as banners in the main game

### 7. Game Configuration (`/catking/config`)

Manage game settings and feature flags:
- Maintenance mode toggle with custom message
- Feature flags (photo booth, co-op challenges, battle pass, etc.)
- Game constants (daily reward multiplier, max cats, breeding cooldown)
- All changes logged to activity log
- JSON value validation

### 8. Battle Pass Management (`/catking/battle-pass`)

Create and manage seasonal battle passes:
- Create/edit/delete seasons
- Set start/end dates
- Configure tiers with rewards
- Activate/deactivate seasons
- Premium pricing configuration

### 9. Push Notifications (`/catking/notifications`)

Send and manage push notifications:
- Compose notifications with title/body
- Target options: All users, specific users
- View notification history
- Delivery status tracking

### 10. AI Metrics (`/catking/ai-metrics`)

Monitor AI usage across the platform:
- Total AI requests and success rate
- Token usage and costs
- Function-specific breakdown
- Error tracking for AI operations
- Usage trends over time

### 11. Settings (`/catking/settings`)

Administrative settings:
- **Activity Log**: All admin actions recorded
- **Auth Attempts**: Login attempt history (success/failed/denied)
- **Database**: Row counts for all 30+ tables grouped by category

## Database Tables

### admin_activity_log
Tracks all admin actions:
```sql
- id: UUID (primary key)
- admin_user_id: UUID (who performed the action)
- action_type: TEXT (e.g., 'role_change', 'inventory_modify', 'game_reset')
- action_description: TEXT
- target_user_id: UUID (optional)
- target_table: TEXT (optional)
- target_record_id: UUID (optional)
- ip_address: TEXT (optional)
- user_agent: TEXT (optional)
- metadata: JSONB
- created_at: TIMESTAMPTZ
```

### admin_notifications
Tracks sent notifications:
```sql
- id: UUID (primary key)
- title: TEXT
- body: TEXT
- target: TEXT ('all', 'specific')
- target_user_ids: UUID[] (for specific targeting)
- sent_at: TIMESTAMPTZ
- sent_by: UUID
- delivery_count: INTEGER
- status: TEXT ('pending', 'sending', 'sent', 'failed')
```

### admin_rate_limits
Rate limiting for admin actions:
```sql
- id: UUID (primary key)
- admin_user_id: UUID
- action_type: TEXT
- action_count: INTEGER
- window_start: TIMESTAMPTZ
```

### auth_attempts_log
Tracks authentication attempts:
```sql
- id: UUID (primary key)
- email: TEXT
- attempt_type: TEXT ('admin_login', 'admin_login_failed', 'access_denied')
- success: BOOLEAN
- ip_address: TEXT (optional)
- user_agent: TEXT (optional)
- error_message: TEXT (optional)
- user_id: UUID (optional)
- metadata: JSONB
- created_at: TIMESTAMPTZ
```

### game_config
Game configuration values:
```sql
- key: TEXT (primary key)
- value: JSONB
- description: TEXT
- category: TEXT
- updated_at: TIMESTAMPTZ
- updated_by: UUID
```

### battle_pass_seasons
Battle pass configuration:
```sql
- id: UUID (primary key)
- season_id: TEXT (unique)
- name: TEXT
- description: TEXT
- starts_at: TIMESTAMPTZ
- ends_at: TIMESTAMPTZ
- tiers: JSONB
- is_active: BOOLEAN
- premium_price: INTEGER
- created_by: UUID
- created_at: TIMESTAMPTZ
```

## Security

### Row Level Security (RLS)

- `admin_activity_log`: Only admins can SELECT/INSERT
- `auth_attempts_log`: Anyone can INSERT (for failed attempts), only admins can SELECT
- `admin_notifications`: Only admins can manage
- `admin_rate_limits`: Admins can only manage their own records
- `game_config`: Anyone can read, only admins can modify
- `battle_pass_seasons`: Anyone can read active, only admins can modify

### Role Verification

Uses `has_role()` security definer function:
```sql
public.has_role(auth.uid(), 'admin'::app_role)
```

### Route Protection

All admin routes wrapped with `AdminRoute` component that:
1. Checks user authentication
2. Verifies admin role via `useAdminAuth` hook
3. Logs unauthorized access attempts
4. Redirects non-admins to login

### Rate Limiting

High-risk actions are rate-limited:
| Action | Limit | Window |
|--------|-------|--------|
| User deletion | 5 | per hour |
| Bulk role change | 3 | per hour |
| Inventory modification | 10 | per hour |
| Mass notifications | 2 | per hour |

## Components

### AdminLayout
Responsive navigation wrapper with:
- Crown branding
- Navigation menu (Dashboard, Users, Statistics, Errors, Moderation, AI Metrics, Announcements, Game Config, Battle Pass, Notifications, Settings)
- Mobile hamburger menu
- User email display
- Logout button

### AdminRoute
Protected route wrapper that:
- Shows loading state during verification
- Redirects unauthorized users
- Logs access denied events

### PlayerInventoryEditor
Inventory modification component:
- Edit player money
- Edit resources (food, medicine, toys, treats)
- Reset game state option
- Required reason field for all changes
- Full audit logging

### BulkActionsBar
Floating action bar for bulk operations:
- Role change
- Suspend/Unsuspend
- Delete
- Send Notification

## Hooks

### useAdminAuth
Checks if current user has admin role.

### useAdminActivityLog
Provides `logActivity()` function for recording admin actions.

### useAdminData
Collection of data fetching hooks:
- `useAdminStats()` - Aggregate statistics
- `useAdminUsers()` - Paginated user list
- `useAdminErrors()` - Filtered error logs
- `useAdminErrorTrends()` - 7-day error trends
- `useAdminAuthLogs()` - Authentication attempt history
- `useAdminActivityLogs()` - Admin activity history
- `useAdminPlayerActivityLogs()` - Player activity logs
- `useAdminStorageStats()` - Storage bucket statistics
- `useAdminAllTableStats()` - All database table row counts
- `useAdminLiveActivity()` - Real-time activity monitor (auto-refresh)
- `useAdminChallengeAnalytics()` - Challenge completion analytics
- `useAdminRetentionAnalytics()` - DAU/WAU/MAU and streak analytics

### useAdminCorruptedSaves
Game save corruption detection and repair:
- `useAdminCorruptedSaves()` - Fetch corrupted saves with issue details
- `useRepairGameSave()` - Repair individual game saves
- `useBulkRepairGameSaves()` - Bulk repair multiple saves

### useAdminRateLimit
Rate limiting for destructive actions:
- `checkLimit()` - Verify action is within limits
- `recordAction()` - Increment action count

### useAdminAIData
AI usage monitoring:
- `useAIUsageStats()` - Aggregate AI metrics
- `useAIUsageLogs()` - Individual AI request logs

## Scalability

### Adding Navigation Items
Add to `ADMIN_NAV_ITEMS` array in `AdminLayout.tsx`:
```typescript
{ id: 'new-section', label: 'New Section', icon: SomeIcon, path: '/catking/new-section' }
```

### Adding Admin Roles
Extend `app_role` enum:
```sql
ALTER TYPE app_role ADD VALUE 'new_role';
```

## Files

```
src/
├── components/admin/
│   ├── AdminLayout.tsx           # Navigation wrapper
│   ├── AdminRoute.tsx            # Route protection
│   ├── AdminGiftCatDialog.tsx    # Cat gifting dialog for admins
│   ├── PlayerInventoryEditor.tsx # Inventory modification
│   ├── ProfileEditor.tsx         # Profile editing component
│   ├── ActivityFeed.tsx          # Activity feed display
│   ├── BulkActionsBar.tsx        # Bulk user actions (with notification)
│   ├── ChallengeForm.tsx         # Challenge creation form
│   ├── SecurityScoreCard.tsx     # Security score display
│   ├── SecurityTrendChart.tsx    # Security trend visualization
│   ├── UserDetailModal.tsx       # User detail modal (includes Gift Cat button)
│   └── ExportButton.tsx          # CSV export utility
├── lib/
│   └── adminGiftUtils.ts         # Admin gift cat generation utilities
├── components/game/
│   └── AnnouncementBanner.tsx    # Player-facing announcement display
├── hooks/admin/
│   ├── useAdminAuth.ts           # Admin role check
│   ├── useAdminActivityLog.ts    # Activity logging
│   ├── useAdminData.ts           # Data fetching hooks
│   ├── useAdminAIData.ts         # AI usage metrics
│   ├── useAdminCorruptedSaves.ts # Game save repair hooks
│   ├── useAdminRateLimit.ts      # Rate limiting
│   ├── useSecurityLinter.ts      # Security scanning
│   ├── useSecurityHistory.ts     # Security scan history
│   └── useTutorialAnalytics.ts   # Tutorial analytics
├── pages/admin/
│   ├── AdminDashboard.tsx        # Main dashboard with live activity
│   ├── AdminUsers.tsx            # User management
│   ├── AdminProfileRepair.tsx    # Profile repair tool
│   ├── AdminGameSaveRepair.tsx   # Game save repair tool
│   ├── AdminStatistics.tsx       # Game statistics (overview, economy, retention)
│   ├── AdminErrorLogs.tsx        # Error monitoring
│   ├── AdminModeration.tsx       # Moderation tools with analytics
│   ├── AdminAnnouncements.tsx    # Announcements management
│   ├── AdminGameConfig.tsx       # Game configuration
│   ├── AdminBattlePass.tsx       # Battle pass management
│   ├── AdminNotifications.tsx    # Push notification center
│   ├── AdminAIMetrics.tsx        # AI usage monitoring
│   ├── AdminSecurity.tsx         # Security scanning dashboard
│   ├── AdminScheduledJobs.tsx    # Cron job management
│   ├── AdminSaveRecovery.tsx     # Save recovery and sync health
│   ├── AdminTutorialAnalytics.tsx # Tutorial analytics
│   └── AdminSettings.tsx         # Admin settings
└── pages/
    └── AdminAuth.tsx             # Admin login page
```

### 12. Scheduled Jobs (`/catking/scheduled-jobs`)

Manage and monitor cron jobs:
- **Active Jobs List**: View all scheduled cron jobs with status
- **Job Details**: Schedule, description, last run time, success rate
- **Manual Trigger**: Execute any job on-demand with confirmation
- **Job Trends Chart**: Visualize job run history over 14 days
- **Run History Table**: Detailed view of recent job executions
- **Alert Configuration**: Enable/disable job failure notifications

**Available Jobs:**
| Job | Schedule | Purpose |
|-----|----------|---------|
| `sync-health-check-10min` | Every 10 min | Validates game save data integrity |
| `generate-weekly-challenges` | Sundays midnight | Creates weekly player challenges |
| `process-leaderboard-rewards` | Daily 1 AM | Awards leaderboard prizes |
| `cleanup-error-logs-daily` | Daily 3 AM | Prunes old error logs |

### 13. Save Recovery (`/catking/save-recovery`)

Data integrity monitoring and recovery:
- **Sync Health Summary**: Overview of recent integrity checks
- **Issues Table**: List of saves with detected problems
- **Recovery Actions**: Tools to restore lost data
- **Snapshot History**: View save history for comparison

## Granting Admin Access

To grant admin access to a user:

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('user-uuid-here', 'admin');
```

Or via the Admin Users page after initial admin is set up.

## Changelog

### Phase 1: Enhanced Data Visibility
- All 30+ database tables visible in settings
- Storage bucket statistics
- Player activity log viewing
- CSV export functionality
- Error trends visualization

### Phase 2: Content Management
- Game Configuration Panel
- Battle Pass Management
- Push Notification Center

### Phase 3: Player Management
- Player Inventory Editor (money, resources, reset)
- Bulk User Communication (notifications)

### Phase 4: Analytics Enhancements
- Challenge Analytics Dashboard
- Real-time Activity Monitor
- Retention Analytics (DAU/WAU/MAU, streaks)

### Phase 5: Security Hardening
- Rate Limiting for Admin Actions
- Enhanced Audit Logging

### Phase 6: Data Integrity
- Game Save Repair Tool (`/catking/game-repair`)
- Corrupted save detection (negative earnings, invalid money, bad cat data)
- Individual and bulk repair functionality
- `totalMoneyEarned` safeguards in `addReward()` and `cloudSave()`
- Pre-save validation to auto-correct corruption before persisting

### Phase 7: Data Consistency & Quality
- **ProfileEditor player_stats sync** - Admin profile edits now sync to leaderboard table
- **Orphaned profile detection** - Auto-creates player_stats for profiles missing entries
- **User table "No Stats" indicator** - Shows dash (—) instead of 0 for missing stats
- **Game Save Repair improvements**:
  - Refresh button now shows spinner during refetch (uses `isFetching`)
  - New "Earnings Mismatch" corruption type (`money > totalMoneyEarned`)
  - Auto-repair sets `totalMoneyEarned = money` when mismatched
