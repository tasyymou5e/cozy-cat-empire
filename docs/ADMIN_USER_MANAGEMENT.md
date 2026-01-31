# Admin User Management System

> **Documentation for the Admin Portal's User Management features**

## Overview

The Admin User Management system allows administrators to view, edit, and manage player accounts, game saves, inventories, and social features through the Admin Portal.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN USER MANAGEMENT                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  AdminUsers.tsx                                                  │
│  └── User list with search, pagination, bulk actions             │
│      └── UserDetailModal.tsx                                     │
│          ├── Overview Tab (read-only stats)                      │
│          ├── Inventory Tab                                       │
│          │   └── PlayerInventoryEditor.tsx                       │
│          │       ├── Money editing                               │
│          │       ├── Resources editing                           │
│          │       ├── Portrait Credits                            │
│          │       └── Game Reset                                  │
│          ├── Profile Tab                                         │
│          │   └── ProfileEditor.tsx                               │
│          ├── Cats Tab (read-only)                                │
│          ├── Trades Tab (read-only)                              │
│          ├── Gifts Tab                                           │
│          │   └── AdminGiftCatDialog.tsx                          │
│          └── Errors Tab (read-only)                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Structure

### Pages

| Component | Path | Description |
|-----------|------|-------------|
| `AdminUsers.tsx` | `/catking/users` | Main user management page with search, filters, and user list |

### Modals & Editors

| Component | Location | Description |
|-----------|----------|-------------|
| `UserDetailModal.tsx` | `src/components/admin/` | 7-tab modal for viewing/editing user details |
| `PlayerInventoryEditor.tsx` | `src/components/admin/` | Edit money, resources, credits, reset game |
| `ProfileEditor.tsx` | `src/components/admin/` | Edit display name, avatar, username |
| `AdminGiftCatDialog.tsx` | `src/components/admin/` | Gift cats to users as admin |

### Hooks

| Hook | Location | Description |
|------|----------|-------------|
| `useAdminUsers` | `src/hooks/admin/useAdminData.ts` | Paginated user list with search |
| `useAdminActivityLog` | `src/hooks/admin/useAdminActivityLog.ts` | Log admin actions |
| `useAdminCorruptedSaves` | `src/hooks/admin/useAdminCorruptedSaves.ts` | Detect and repair corrupted saves |

---

## Features Reference

### User List (`AdminUsers.tsx`)

| Feature | Description |
|---------|-------------|
| Search | Search by email, display name, or username |
| Pagination | Navigate through user pages |
| Bulk Actions | Select multiple users for batch operations |
| Quick Actions | View details, suspend, delete from list |
| Export | Export user data to CSV |

### User Detail Modal Tabs

#### 1. Overview Tab
Read-only display of:
- Money, cat count, show wins, kittens bred
- Account info (email, username, created date, last played)
- Current resources
- Suspension status if applicable

#### 2. Inventory Tab (`PlayerInventoryEditor.tsx`)

| Action | Description | Table |
|--------|-------------|-------|
| Edit Money | Modify player's coin balance | `game_saves` |
| Edit Resources | Modify food, medicine, toys, treats | `game_saves` |
| Edit Portrait Credits | Add/remove AI portrait credits | `player_portrait_credits` |
| Reset Game | Reset player to fresh start | `game_saves` |

#### 3. Profile Tab (`ProfileEditor.tsx`)

| Action | Description | Table |
|--------|-------------|-------|
| Edit Display Name | Change public display name | `profiles` |
| Edit Avatar Emoji | Change avatar emoji | `profiles` |
| Edit Username | Change unique username | `profiles` |

#### 4. Cats Tab
Read-only grid showing all cats with:
- Name, grade, age
- Breed information

#### 5. Trades Tab
Read-only list of recent trades:
- Sent/received status
- Trade status (pending/accepted/declined)
- Timestamp

#### 6. Gifts Tab
- Read-only list of recent gifts
- **Gift Cat** button opens `AdminGiftCatDialog`

#### 7. Errors Tab
Read-only list of error logs for this user:
- Error type and message
- Timestamp
- Stack traces (expandable)

---

## Database Tables & RLS Policies

### Core Tables Used

| Table | Admin SELECT | Admin UPDATE | Admin INSERT | Admin DELETE |
|-------|--------------|--------------|--------------|--------------|
| `profiles` | ✅ | ✅ | ❌ | ❌ |
| `game_saves` | ✅ | ✅ | ❌ | ❌ |
| `player_stats` | ✅ (public) | ❌ | ❌ | ❌ |
| `player_portrait_credits` | ✅ | ✅ | ❌ | ❌ |
| `cat_gifts` | ✅ | ✅ | ✅ | ✅ |
| `trade_offers` | ✅ | ✅ | ❌ | ✅ |
| `player_friends` | ✅ | ❌ | ❌ | ✅ |
| `error_logs` | ✅ | ✅ | ❌ | ✅ |
| `user_roles` | ✅ | ❌ | ✅ | ✅ |

### Key RLS Policies

```sql
-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update profiles (suspension, etc.)
CREATE POLICY "Admins can update profiles"
  ON public.profiles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can view all game saves
CREATE POLICY "Admins can view all game saves"
  ON public.game_saves FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update game saves (inventory editing)
CREATE POLICY "Admins can update game saves"
  ON public.game_saves FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));
```

---

## Activity Logging

All admin actions are logged to `admin_activity_log`:

| Action Type | Description |
|-------------|-------------|
| `inventory_modify` | Money or resource changes |
| `credits_modify` | Portrait credit changes |
| `game_reset` | Full game reset |
| `profile_update` | Display name, avatar, username changes |
| `role_change` | Admin/moderator role assignments |
| `user_suspend` | User suspension |
| `user_unsuspend` | Suspension removal |
| `user_delete` | Account deletion |
| `cat_gift` | Admin gifted a cat to user |

### Log Entry Structure

```typescript
interface AdminActivityLog {
  id: string;
  admin_user_id: string;
  action_type: string;
  action_description: string;
  target_user_id?: string;
  target_table?: string;
  target_record_id?: string;
  metadata?: {
    reason?: string;
    old_value?: unknown;
    new_value?: unknown;
  };
  created_at: string;
}
```

---

## Error Handling

### Silent Update Detection

Supabase RLS can silently reject updates without throwing errors. The code now explicitly checks for successful updates:

```typescript
// Correct pattern - verify data was returned
const { data, error } = await supabase
  .from('game_saves')
  .update({ game_state: updatedGameState })
  .eq('user_id', userId)
  .select()
  .single();

if (error) throw error;
if (!data) {
  throw new Error('Update failed - no rows affected. Check admin permissions.');
}
```

### Common Error Scenarios

| Error | Cause | Solution |
|-------|-------|----------|
| "Update failed - no rows affected" | Missing RLS UPDATE policy | Add admin UPDATE policy to table |
| "User not found" | Invalid user ID | Verify user exists in profiles table |
| "Permission denied" | Not authenticated as admin | Verify admin role in user_roles |

---

## User Suspension

### Suspension Flow

1. Admin clicks "Suspend" on user row or in modal
2. Suspension reason dialog appears
3. On confirm:
   - `profiles.suspended_at` set to current timestamp
   - `profiles.suspension_reason` set to provided reason
   - Activity logged

### Unsuspension Flow

1. Admin clicks "Unsuspend" on suspended user
2. On confirm:
   - `profiles.suspended_at` set to null
   - `profiles.suspension_reason` set to null
   - Activity logged

### Suspension Effects

- Suspended users cannot log in
- Suspended badge shown in user list and modal
- Suspension info displayed in Overview tab

---

## User Deletion

User deletion is handled via Edge Function (`admin-delete-user`):

1. Admin clicks "Delete" on user
2. Confirmation dialog with user email
3. Edge function called with service role
4. Cascade deletes:
   - `profiles` record
   - `game_saves` record
   - `player_stats` record
   - All related records (gifts, trades, etc.)
   - Auth user record

---

## Corrupted Save Detection & Repair

Located in `useAdminCorruptedSaves.ts`:

### Corruption Types Detected

| Type | Description |
|------|-------------|
| `missing_field` | Required field missing from game_state |
| `invalid_type` | Field has wrong data type |
| `out_of_range` | Numeric value outside valid bounds |
| `invalid_structure` | Array or object malformed |
| `orphaned_reference` | Reference to non-existent entity |

### Auto-Repair Actions

| Issue | Repair Action |
|-------|---------------|
| Missing `cats` array | Initialize empty array |
| Missing `money` | Set to 0 |
| Missing `resources` | Initialize with defaults |
| Negative money | Set to 0 |
| Invalid cat data | Remove invalid cats |

---

## Security Considerations

### Role Verification

All admin routes use `AdminRoute` wrapper:

```typescript
// AdminRoute.tsx
const { isAdmin, isLoading } = useAdminAuth();

if (!isAdmin) {
  logAuthAttempt({ type: 'access_denied', ... });
  return <Navigate to="/catking" />;
}
```

### Rate Limiting

Admin actions are rate-limited via `useAdminRateLimit`:

| Action | Limit | Window |
|--------|-------|--------|
| User suspension | 10 | 1 hour |
| User deletion | 5 | 1 hour |
| Inventory modify | 50 | 1 hour |
| Role changes | 10 | 1 hour |

---

## File Reference

```
src/
├── components/admin/
│   ├── UserDetailModal.tsx      # Main user detail modal
│   ├── PlayerInventoryEditor.tsx # Inventory editing
│   ├── ProfileEditor.tsx        # Profile editing
│   ├── AdminGiftCatDialog.tsx   # Cat gifting dialog
│   ├── BulkActionsBar.tsx       # Bulk user actions
│   └── ExportButton.tsx         # CSV export
├── hooks/admin/
│   ├── useAdminData.ts          # Data fetching hooks
│   ├── useAdminActivityLog.ts   # Activity logging
│   ├── useAdminAuth.ts          # Admin authentication
│   ├── useAdminRateLimit.ts     # Rate limiting
│   └── useAdminCorruptedSaves.ts # Save repair
├── pages/admin/
│   └── AdminUsers.tsx           # User management page
└── types/
    └── admin.ts                 # Admin type definitions
```

---

## Changelog

### 2026-01-31
- **Fixed**: Added missing RLS UPDATE policy for `game_saves` table
- **Improved**: Added explicit row count verification for all admin updates
- **Fixed**: Inventory modifications now properly persist to database

### Previous
- Initial implementation of user management system
- Added suspension/unsuspension functionality
- Added corrupted save detection and repair
- Added admin cat gifting feature
