# AI Portrait Credits System

> **Status:** ✅ Implementation Complete (Phases 1-6)
> **Last Updated:** 2026-01-05

## Overview

This document describes the AI portrait generation system that allows players to pay **5,000 in-game currency** to generate **3 AI portraits** for their cats. This creates a meaningful incentive to play the game, earn money, and upgrade default cat visuals.

---

## Feature Summary

| Aspect | Details |
|--------|---------|
| Package Cost | 5,000 coins |
| Portraits per Package | 3 |
| Credit Expiration | Never |
| Storage | Cloud-synced |
| Admin Override | Yes |

---

## Implementation Phases

### Phase 1: Database Configuration

#### 1.1 Game Config Entry

Add portrait package pricing to `game_config`:

```sql
INSERT INTO game_config (key, value, description, category) VALUES
('portrait_package', '{"cost": 5000, "portraits": 3}', 
 'Cost in game currency and number of portraits per purchase', 'economy');
```

#### 1.2 Player Portrait Credits Table

```sql
CREATE TABLE IF NOT EXISTS player_portrait_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credits_remaining INTEGER NOT NULL DEFAULT 0,
  total_purchased INTEGER NOT NULL DEFAULT 0,
  total_used INTEGER NOT NULL DEFAULT 0,
  last_purchase_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_credits UNIQUE(user_id)
);

-- RLS Policies
ALTER TABLE player_portrait_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own portrait credits"
  ON player_portrait_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own portrait credits"
  ON player_portrait_credits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portrait credits"
  ON player_portrait_credits FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

### Phase 2: Backend Edge Functions

#### 2.1 manage-portrait-credits Edge Function

**Location:** `supabase/functions/manage-portrait-credits/index.ts`

**Endpoints:**
| Method | Action | Description |
|--------|--------|-------------|
| GET | - | Check current credits balance |
| POST | purchase | Purchase portrait package (5000 coins → 3 portraits) |
| POST | consume | Consume 1 credit when generating |

**Features:**
- Validates user has enough in-game money before purchase
- Updates both credits table and game_saves money atomically
- Logs all transactions for audit
- Returns updated credit balance

#### 2.2 Update generate-cat-portrait Edge Function

**Location:** `supabase/functions/generate-cat-portrait/index.ts`

**Changes:**
```typescript
// Add credit check before generation
const { data: credits } = await supabase
  .from('player_portrait_credits')
  .select('credits_remaining')
  .eq('user_id', userId)
  .single();

if (!credits || credits.credits_remaining < 1) {
  return new Response(JSON.stringify({ 
    error: 'insufficient_credits',
    message: 'You need portrait credits to generate. Purchase a portrait package first.',
    creditsRemaining: credits?.credits_remaining || 0
  }), { status: 402, headers: corsHeaders });
}

// After successful generation, deduct credit
await supabase
  .from('player_portrait_credits')
  .update({ 
    credits_remaining: credits.credits_remaining - 1,
    total_used: credits.total_used + 1,
    updated_at: new Date().toISOString()
  })
  .eq('user_id', userId);
```

---

### Phase 3: Frontend Hook

#### 3.1 usePortraitCredits Hook

**Location:** `src/hooks/usePortraitCredits.ts`

```typescript
interface PortraitCredits {
  creditsRemaining: number;
  totalPurchased: number;
  totalUsed: number;
  lastPurchaseAt: string | null;
}

interface UsePortraitCreditsReturn {
  credits: PortraitCredits | null;
  isLoading: boolean;
  purchaseCredits: (money: number, onSuccess: (cost: number) => void) => Promise<boolean>;
  refetch: () => Promise<void>;
}
```

**Features:**
- Fetches credit balance on mount
- `purchaseCredits()` validates money, calls edge function, triggers callback
- Auto-refetch after generation

---

### Phase 4: UI Component Updates

#### 4.1 CatPortrait.tsx Updates

**Location:** `src/components/game/CatPortrait.tsx`

**Changes:**
- Add portrait credits display badge
- Show "Purchase Credits" button when credits = 0
- Update generate button to show credits remaining
- Handle `insufficient_credits` error
- Add purchase confirmation dialog

**UI Mockup:**
```
┌─────────────────────────────────────┐
│       [Portrait Image]              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🎨 2 Credits Remaining      │   │
│  └─────────────────────────────┘   │
│                                     │
│  [✨ Generate Portrait]             │
│                                     │
│  -- OR if no credits --             │
│                                     │
│  [💰 Buy 3 Portraits - $5,000]     │
└─────────────────────────────────────┘
```

#### 4.2 BatchPortraitGenerator.tsx Updates

**Location:** `src/components/game/BatchPortraitGenerator.tsx`

**Changes:**
- Check credits before allowing batch generation
- Limit batch size to available credits
- Show purchase prompt if insufficient credits
- Update progress tracking to show credits used

#### 4.3 PortraitPurchaseDialog Component

**Location:** `src/components/game/PortraitPurchaseDialog.tsx`

**Features:**
- Shows package details (5000 coins for 3 portraits)
- Displays player's current money
- Disabled if insufficient funds
- Confirmation with purchase breakdown
- Success animation with confetti

#### 4.4 portraitUtils.ts Updates

**Location:** `src/lib/portraitUtils.ts`

**New Constants:**
```typescript
export const PORTRAIT_CREDIT_COST = 1;      // Per portrait
export const PORTRAIT_PACKAGE_COST = 5000;  // In-game currency
export const PORTRAIT_PACKAGE_SIZE = 3;     // Portraits per package
```

---

### Phase 5: Game State Integration

#### 5.1 deductMoney Action

**Location:** `src/hooks/useGameState.ts`

```typescript
const deductMoney = useCallback((amount: number, reason: string) => {
  setState(prev => {
    if (prev.money < amount) {
      showMessage('Not enough money!', 'warning');
      playSound?.('error');
      return prev;
    }
    showMessage(`Spent $${amount.toLocaleString()} on ${reason}`, 'info');
    return {
      ...prev,
      money: prev.money - amount,
    };
  });
}, [playSound]);
```

#### 5.2 Component Prop Updates

| Component | New Props |
|-----------|-----------|
| CatCollection.tsx | `money`, `deductMoney` passed to portrait components |
| CatDetailModal.tsx | `money`, `deductMoney` for modal portrait generation |

---

### Phase 6: Admin Panel Integration

#### 6.1 AdminGameConfig

The `portrait_package` config appears automatically, allowing admins to adjust:
- `cost`: In-game currency cost (default: 5000)
- `portraits`: Number of portraits per package (default: 3)

#### 6.2 AdminStatistics Updates

**New Metrics:**
- Total portrait packages purchased
- Total portraits generated
- Revenue generated (in-game currency)
- Top portrait purchasers

#### 6.3 PlayerInventoryEditor Updates

**Location:** `src/components/admin/PlayerInventoryEditor.tsx`

**New Feature:** Admin ability to grant/revoke portrait credits for players.

---

## Security Considerations

### Server-Side Validation
All credit operations happen server-side in edge functions:
- Credit purchase validation
- Credit consumption on generation
- Money deduction via secure game_saves update

### RLS Policies
Users can only access their own credits (defined in Phase 1).

### Rate Limiting
Existing rate limiting in generate-cat-portrait (10/hour) remains active.

### Audit Logging
| Event | Log Location |
|-------|--------------|
| Portrait generation | `ai_usage_log` |
| Admin credit grants | `admin_activity_log` |

---

## Testing Plan

### Unit Tests

**Purchase Flow:**
- [ ] User with 5000+ money can purchase
- [ ] User with less than 5000 cannot purchase
- [ ] Credits correctly increment after purchase
- [ ] Money correctly decrements after purchase

**Generation Flow:**
- [ ] User with credits can generate portrait
- [ ] User without credits sees purchase prompt
- [ ] Credits decrement after successful generation
- [ ] Failed generation doesn't consume credit

**Edge Cases:**
- [ ] New user has 0 credits
- [ ] Multiple rapid purchase attempts
- [ ] Concurrent generation attempts
- [ ] Network failures during purchase

### Manual Testing Checklist

| Test Case | Expected Result |
|-----------|-----------------|
| New user clicks Generate Portrait | Shows "Buy Credits" prompt |
| User with $4000 clicks Buy Credits | Button disabled, shows insufficient funds |
| User with $5000 clicks Buy Credits | Confirmation dialog, then purchase succeeds |
| After purchase, credits show 3 | Credits badge shows "3 Credits" |
| Generate portrait with credits | Portrait generates, credits show 2 |
| Use all 3 credits | Returns to "Buy Credits" state |
| Batch generate with 2 credits, 5 cats | Limits to 2 cats, shows warning |

---

## Implementation Order

| Phase | Description | Dependencies | Est. Time |
|-------|-------------|--------------|-----------|
| 1 | Database Setup | None | 5 min |
| 2 | Edge Functions | Phase 1 | 15 min |
| 3 | Frontend Hook | Phase 2 | 10 min |
| 4 | UI Components | Phases 2, 3 | 25 min |
| 5 | Game State | Phase 4 | 10 min |
| 6 | Admin Panel | Phases 1-5 | 10 min |
| 7 | Security Review | All phases | 5 min |
| 8 | Testing | All phases | 15 min |
| 9 | Documentation | All phases | 10 min |

**Total Estimated Time:** ~105 minutes

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking existing portraits | New system is additive, existing portraits remain |
| Users losing credits | Server-side atomic transactions |
| Exploitation | All validation server-side |
| UI confusion | Clear credit display and purchase flow |

---

## Rollback Plan

If issues arise:
1. Set `features.cat_portraits` to `false` in game_config (disables feature)
2. Keep `player_portrait_credits` data intact
3. Revert edge function changes
4. Revert frontend changes

---

## Files Affected

### New Files
| File | Purpose |
|------|---------|
| `supabase/functions/manage-portrait-credits/index.ts` | Credit management edge function |
| `src/hooks/usePortraitCredits.ts` | Frontend credit management hook |
| `src/components/game/PortraitPurchaseDialog.tsx` | Purchase confirmation dialog |

### Modified Files
| File | Changes |
|------|---------|
| `supabase/functions/generate-cat-portrait/index.ts` | Add credit check/consumption |
| `src/components/game/CatPortrait.tsx` | Add credits UI |
| `src/components/game/BatchPortraitGenerator.tsx` | Add credits check |
| `src/lib/portraitUtils.ts` | Add package constants |
| `src/hooks/useGameState.ts` | Add deductMoney action |
| `src/pages/CatCollection.tsx` | Pass money/deductMoney props |
| `src/components/game/CatDetailModal.tsx` | Add credits display |
| `src/components/admin/PlayerInventoryEditor.tsx` | Add credit management |
| `src/pages/admin/AdminStatistics.tsx` | Add portrait stats |

### Documentation Updates
| File | Changes |
|------|---------|
| `docs/GAME_LOGIC.md` | Add Portrait Credits System section |
| `docs/CAT_VISUALS_AND_GALLERY.md` | Update generate-cat-portrait docs |
| `docs/DATABASE_DESIGN.md` | Add player_portrait_credits table |
| `docs/SECURITY.md` | Add RLS policies for new table |

---

## Related Documentation

- [Cat Visuals and Gallery](./CAT_VISUALS_AND_GALLERY.md)
- [Game Logic](./GAME_LOGIC.md)
- [Database Design](./DATABASE_DESIGN.md)
- [Security](./SECURITY.md)
