
# Admin Gifting System - Investigation & Fix Plan

## Executive Summary

The admin gifting feature has two core issues that need to be addressed:
1. **No admin INSERT policy** - Admins cannot create gifts directly in the database
2. **No admin gifting UI** - There's no interface for admins to gift cats to users

Additionally, there are orphaned gifts in the database sent to a non-existent user ID `33a264c2-5a5c-4675-8c39-29ac783bacd9`.

---

## Issue Analysis

### Root Cause 1: RLS Policy Gap
The `cat_gifts` table has these RLS policies:
```
| Operation | Policy Name                     | Condition                          |
|-----------|--------------------------------|-------------------------------------|
| SELECT    | Users can view their gifts     | auth.uid() = sender_id OR recipient_id |
| SELECT    | Admins can view all gifts      | has_role('admin')                   |
| INSERT    | Users can send gifts           | auth.uid() = sender_id ❌           |
| UPDATE    | Recipients can update          | auth.uid() = recipient_id           |
| UPDATE    | Admins can update gifts        | has_role('admin')                   |
| DELETE    | Admins can delete gifts        | has_role('admin')                   |
```

**Problem:** No admin INSERT policy exists. When an admin tries to gift a cat, the INSERT fails silently because `auth.uid()` must equal `sender_id`.

### Root Cause 2: No Admin Gifting Feature
The admin panel can:
- ✅ View all gifts
- ✅ Revoke pending gifts
- ❌ Create new gifts to users

### Root Cause 3: Orphaned Gifts
4 pending gifts exist with recipient `33a264c2-5a5c-4675-8c39-29ac783bacd9` which doesn't exist in the `profiles` table. These show as "Unknown" recipient in the admin panel.

---

## Implementation Plan

### Phase 1: Database Changes

#### 1.1 Add Admin INSERT Policy for cat_gifts
```sql
-- Allow admins to insert gifts on behalf of the system
CREATE POLICY "Admins can send gifts"
  ON public.cat_gifts
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

This allows admins to insert gifts with any `sender_id` (e.g., a system sender ID or their own ID).

#### 1.2 Create System Sender ID (Optional)
For admin gifts, we can use a dedicated "System" sender ID or the admin's own ID. Using a constant system ID like `00000000-0000-0000-0000-000000000000` would clearly identify admin gifts.

---

### Phase 2: Admin Gift Sending UI

#### 2.1 Add to UserDetailModal.tsx
Add a "Gift Cat" button in the user detail modal that allows admins to gift a system-generated cat to the user.

**New Component: AdminGiftCatDialog**
```typescript
interface AdminGiftCatDialog {
  recipientId: string;
  recipientName: string;
  onGiftSent: () => void;
}
```

**Features:**
- Select breed from dropdown
- Set cat grade (1-20)
- Optional message
- Preview cat stats
- Logs action to admin_activity_log

#### 2.2 Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/UserDetailModal.tsx` | Add "Gift Cat" button and dialog |
| `src/components/admin/AdminGiftCatDialog.tsx` | **NEW** - Dialog for gifting cats |

---

### Phase 3: Fix Orphaned Gifts

The following gifts have an invalid recipient:
```
| Gift ID                              | Cat Name | Sender      | Status  |
|--------------------------------------|----------|-------------|---------|
| 76fbee1b-4166-4f7e-b6d2-401aa2d65aba | Tigger   | jess        | pending |
| 95dc2032-1bd5-4c29-9592-239b53221409 | Oscar    | not bob     | pending |
| 574a4a4f-62e3-4a1d-8a32-dc4a97b2e7fb | Cleo     | not bob     | pending |
| 73cd19fc-9190-4841-ba01-54b284d90cfc | Pepper   | not bob     | pending |
```

**Options:**
1. **Revoke these gifts** - Mark as `revoked_by_admin` with reason "Recipient not found"
2. **Delete the orphaned gifts** - Remove from database entirely

**Recommended:** Revoke (preserve audit trail)

---

### Phase 4: Admin Gift Logic Implementation

#### 4.1 Cat Generation Helper
Create a helper function to generate a valid cat object:

```typescript
interface AdminGiftCatParams {
  breed: CatBreed;
  grade: number;
  name: string;
}

function generateAdminGiftCat(params: AdminGiftCatParams): Cat {
  return {
    id: crypto.randomUUID(),
    type: params.breed === 'stray' ? 'stray' : 'pure',
    breed: params.breed,
    name: params.name,
    health: 100,
    happiness: 100,
    hunger: 100,
    value: calculateCatValue(params.breed, params.grade),
    age: 1,
    personality: randomPersonality(),
    showWins: 0,
    isForSale: false,
    grade: params.grade,
    tricksLearned: [],
    trickProgress: defaultTrickProgress,
    restLevel: 100,
    feedingScore: 0,
    lastTrainingDay: 0,
  };
}
```

#### 4.2 Gift Sending Function
```typescript
async function adminSendGift(
  adminUserId: string,
  recipientId: string,
  cat: Cat,
  message?: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('cat_gifts').insert({
    sender_id: adminUserId, // Use admin's ID as sender
    recipient_id: recipientId,
    cat_data: cat,
    message: message || 'Gift from Admin',
    status: 'pending',
  });
  
  if (error) return { success: false, error: error.message };
  
  // Log admin activity
  await logActivity({
    actionType: 'admin_gift_sent',
    actionDescription: `Gifted ${cat.name} to user`,
    targetUserId: recipientId,
    metadata: { cat_name: cat.name, cat_breed: cat.breed, cat_grade: cat.grade },
  });
  
  return { success: true };
}
```

---

### Phase 5: User-Side Gift Reception

The existing user flow for receiving gifts is correct:
1. User opens CatGiftingPanel or sees GiftReceivedDialog
2. User clicks "Accept"
3. `useCatGifts.acceptGift()` marks gift as accepted
4. Cat is added to user's game state via `onGiftReceived` callback

**No changes needed** to user-side gift reception.

---

## Test Plan

### Pre-Implementation Validation
| Test | Expected Result |
|------|-----------------|
| Admin can SELECT from cat_gifts | ✅ Works (policy exists) |
| Admin can UPDATE cat_gifts | ✅ Works (policy exists) |
| Admin can DELETE cat_gifts | ✅ Works (policy exists) |
| Admin can INSERT into cat_gifts | ❌ Fails (no policy) |

### Post-Implementation Tests

#### RLS Policy Tests
1. **Admin INSERT Test**: Admin creates gift → Should succeed
2. **Regular User INSERT Test**: User tries to insert gift with different sender_id → Should fail
3. **Self-Gift Test**: User creates gift with own sender_id → Should succeed

#### UI Tests
1. **Gift Dialog Opens**: Admin clicks "Gift Cat" in UserDetailModal
2. **Cat Preview**: Cat stats display correctly before sending
3. **Gift Creation**: Gift appears in cat_gifts table after sending
4. **Activity Logging**: Action logged to admin_activity_log
5. **Recipient Notification**: User receives real-time gift notification
6. **Gift Acceptance**: User can accept gift and cat appears in inventory

#### Edge Cases
1. **Duplicate Cat ID**: Generated cat ID should be unique
2. **Invalid Recipient**: Show error if recipient user doesn't exist
3. **Suspended User**: Prevent gifting to suspended users

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/XXXXX_admin_gift_policy.sql` | CREATE | Add admin INSERT policy |
| `src/components/admin/AdminGiftCatDialog.tsx` | CREATE | Gift sending dialog |
| `src/components/admin/UserDetailModal.tsx` | MODIFY | Add "Gift Cat" button |
| `src/lib/adminGiftUtils.ts` | CREATE | Cat generation helpers |
| `src/types/game.ts` | VERIFY | Ensure Cat type is complete |

---

## Security Considerations

1. **Rate Limiting**: Consider adding rate limits for admin gifting
2. **Audit Trail**: All admin gifts are logged to `admin_activity_log`
3. **Cat Validation**: Ensure generated cats have valid properties
4. **No Inventory Deletion**: This feature only ADDS to user inventory

---

## Rollback Plan

If issues arise:
1. Remove admin INSERT policy
2. Revert UserDetailModal changes
3. Delete AdminGiftCatDialog component

No user data is at risk since we're only adding new records.

---

## Implementation Order

1. ✅ Add RLS policy for admin INSERT (database migration)
2. ✅ Create AdminGiftCatDialog component
3. ✅ Add button to UserDetailModal
4. ✅ Create cat generation utilities
5. ✅ Test end-to-end flow
6. ✅ Clean up orphaned gifts (optional, can be done via admin panel)
