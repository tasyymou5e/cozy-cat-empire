
# Admin Credit Adjustment Audit Trail Enhancement

## Problem Identified

There are two places where credits can be adjusted:

1. **PlayerInventoryEditor** (User Detail Modal) - Logs correctly with action type `portrait_credits_modify` and detailed metadata
2. **AdminAIMetrics Credit Management tab** - Uses action type `credit_adjustment` with incomplete metadata and non-awaited call

The Credit Management tab's logging is inconsistent and less informative than the Player Inventory Editor.

## Solution

Enhance the AdminAIMetrics credit adjustment to match the PlayerInventoryEditor's comprehensive logging approach.

## Implementation Details

### File: `src/pages/admin/AdminAIMetrics.tsx`

**Current Implementation (lines 150-158):**
```typescript
logActivity({
  actionType: 'credit_adjustment',
  actionDescription: `Adjusted credits by ${result.amount} for user. New balance: ${result.newRemaining}`,
  targetUserId: result.userId,
  targetTable: 'player_portrait_credits',
});
```

**Enhanced Implementation:**
```typescript
await logActivity({
  actionType: 'portrait_credits_modify',  // Match PlayerInventoryEditor
  actionDescription: `${result.amount > 0 ? 'Granted' : 'Removed'} ${Math.abs(result.amount)} portrait credits via Credit Management`,
  targetUserId: result.userId,
  targetTable: 'player_portrait_credits',
  metadata: {
    change: result.amount,
    previousCredits: result.previousBalance,
    newCredits: result.newRemaining,
    adjustmentMethod: 'credit_management_tab',
    userEmail: selectedUser?.email || 'unknown',
    userDisplayName: selectedUser?.display_name || 'unknown',
  },
});
```

### Changes Required

1. **Add `await` to the logActivity call** - Ensures the log is written before showing success toast
2. **Change action type to `portrait_credits_modify`** - Consistent with PlayerInventoryEditor for unified audit queries
3. **Add comprehensive metadata:**
   - `change` - The adjustment amount (positive or negative)
   - `previousCredits` - Balance before adjustment
   - `newCredits` - Balance after adjustment
   - `adjustmentMethod` - Source of the adjustment
   - `userEmail` - Target user's email for easy identification
   - `userDisplayName` - Target user's display name
4. **Update mutation return value** - Include `previousBalance` from the fetched data

### Mutation Update

```typescript
const adjustCreditsMutation = useMutation({
  mutationFn: async ({ userId, amount }: { userId: string; amount: number }) => {
    const { data: current, error: fetchError } = await supabase
      .from('player_portrait_credits')
      .select('credits_remaining, total_purchased')
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    const previousBalance = current?.credits_remaining || 0;  // Capture before
    const newRemaining = Math.max(0, previousBalance + amount);
    // ... rest of update logic ...
    
    return { userId, amount, newRemaining, previousBalance };  // Return previousBalance
  },
  onSuccess: async (result) => {
    // ... invalidate queries ...
    
    await logActivity({
      actionType: 'portrait_credits_modify',
      actionDescription: `${result.amount > 0 ? 'Granted' : 'Removed'} ${Math.abs(result.amount)} portrait credits via Credit Management`,
      targetUserId: result.userId,
      targetTable: 'player_portrait_credits',
      metadata: {
        change: result.amount,
        previousCredits: result.previousBalance,
        newCredits: result.newRemaining,
        adjustmentMethod: 'credit_management_tab',
        userEmail: selectedUser?.email || 'unknown',
        userDisplayName: selectedUser?.display_name || 'unknown',
      },
    });
    
    // ... toast notification ...
  },
});
```

## Benefits

1. **Unified action type** - All credit adjustments logged as `portrait_credits_modify` for easy querying
2. **Complete audit trail** - Before/after balances, method of adjustment, user identification
3. **Reliable logging** - `await` ensures log is written before UI feedback
4. **Admin accountability** - `admin_user_id` already captured by the hook
5. **Easy filtering** - Can query by `adjustmentMethod` to distinguish sources

## Verification Query

After implementation, admins can verify with:
```sql
SELECT 
  created_at,
  action_description,
  metadata->>'change' as change,
  metadata->>'previousCredits' as before,
  metadata->>'newCredits' as after,
  metadata->>'adjustmentMethod' as source,
  metadata->>'userEmail' as user_email
FROM admin_activity_log 
WHERE action_type = 'portrait_credits_modify'
ORDER BY created_at DESC;
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/admin/AdminAIMetrics.tsx` | Update mutation return value, await logActivity, use consistent action type, add comprehensive metadata |
