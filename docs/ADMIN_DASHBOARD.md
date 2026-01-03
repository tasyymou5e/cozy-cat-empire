# Admin Dashboard Documentation

## Overview

The Cat King Admin Dashboard is a comprehensive administrative interface for managing the Cat Farm game. It provides tools for user management, game statistics monitoring, error tracking, and moderation.

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

Quick action buttons for navigation to other admin sections.

### 2. User Management (`/catking/users`)

- Searchable/filterable user table
- View user details: avatar, display name, username, join date, cats owned, show wins
- **User Detail Modal**: Click eye icon to view comprehensive user data:
  - Overview: Money, cats, wins, kittens bred, account info
  - Cats: Full cat list with grades
  - Trades: Recent trade history
  - Gifts: Recent gift history
  - Errors: Error logs for that user
- Role management: assign admin, moderator, or user roles
- **User Suspension**: Suspend/unsuspend users with reason tracking
- **User Deletion**: Permanently delete users via edge function
- **CSV Export**: Export user list to CSV
- Pagination support
- All role changes logged to `admin_activity_log`

### 3. Statistics (`/catking/stats`)

Game analytics including:
- Aggregate statistics cards
- Game metrics distribution pie chart
- Top players by show wins bar chart
- Top players by cats owned bar chart
- Summary statistics

### 4. Error Logs (`/catking/errors`)

Error monitoring features:
- Filterable error table by type
- Expandable rows for full error details
- Stack trace viewing
- User agent and metadata display
- Refresh functionality
- Pagination

### 5. Moderation (`/catking/moderation`)

Tabs for monitoring:
- **Trades**: View recent trade_offers with status, participants, and values
- **Gifts**: View recent cat_gifts between players
- **Challenges**: View weekly_challenges with active status
- **Friends**: View player_friends requests and statuses

### 6. Announcements (`/catking/announcements`)

Create and manage announcements visible to all players:
- Create/edit/delete announcements
- Announcement types: Info, Warning, Success, Event
- Set expiration dates
- Toggle active status
- Announcements appear as banners in the main game

### 7. Settings (`/catking/settings`)

Administrative settings:
- **Activity Log**: All admin actions recorded
- **Auth Attempts**: Login attempt history (success/failed/denied)
- **Database**: Row counts for all tables

## Database Tables

### admin_activity_log
Tracks all admin actions:
```sql
- id: UUID (primary key)
- admin_user_id: UUID (who performed the action)
- action_type: TEXT (e.g., 'role_change')
- action_description: TEXT
- target_user_id: UUID (optional)
- target_table: TEXT (optional)
- target_record_id: UUID (optional)
- ip_address: TEXT (optional)
- user_agent: TEXT (optional)
- metadata: JSONB
- created_at: TIMESTAMPTZ
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

## Security

### Row Level Security (RLS)

- `admin_activity_log`: Only admins can SELECT/INSERT
- `auth_attempts_log`: Anyone can INSERT (for failed attempts), only admins can SELECT

### Role Verification

Uses `has_role()` security definer function:
```sql
public.has_role(auth.uid(), 'admin')
```

### Route Protection

All admin routes wrapped with `AdminRoute` component that:
1. Checks user authentication
2. Verifies admin role via `useAdminAuth` hook
3. Logs unauthorized access attempts
4. Redirects non-admins to login

## Components

### AdminLayout
Responsive navigation wrapper with:
- Crown branding
- Navigation menu (Dashboard, Users, Statistics, Errors, Moderation, Settings)
- Mobile hamburger menu
- User email display
- Logout button

### AdminRoute
Protected route wrapper that:
- Shows loading state during verification
- Redirects unauthorized users
- Logs access denied events

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
- `useAdminAuthLogs()` - Authentication attempt history
- `useAdminActivityLogs()` - Admin activity history

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
│   ├── AdminLayout.tsx      # Navigation wrapper
│   ├── AdminRoute.tsx       # Route protection
│   ├── UserDetailModal.tsx  # User detail view modal
│   └── ExportButton.tsx     # CSV export utility
├── components/game/
│   └── AnnouncementBanner.tsx # Player-facing announcement display
├── hooks/
│   ├── useAdminAuth.ts      # Admin role check
│   ├── useAdminActivityLog.ts # Activity logging
│   └── useAdminData.ts      # Data fetching hooks
├── pages/admin/
│   ├── AdminDashboard.tsx   # Main dashboard
│   ├── AdminUsers.tsx       # User management
│   ├── AdminStatistics.tsx  # Game statistics
│   ├── AdminErrorLogs.tsx   # Error monitoring
│   ├── AdminModeration.tsx  # Moderation tools
│   ├── AdminAnnouncements.tsx # Announcements management
│   └── AdminSettings.tsx    # Admin settings
└── pages/
    └── AdminAuth.tsx        # Admin login page
```

## Granting Admin Access

To grant admin access to a user:

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('user-uuid-here', 'admin');
```

Or via the Admin Users page after initial admin is set up.
