

# Cat Farm - Gamification & Monetization Enhancement Plan

## Current State Analysis

### Existing Gamification Features (Already Implemented)

| Feature | Status | Description |
|---------|--------|-------------|
| Daily Login Rewards | ✅ Complete | 7-day reward cycle with VIP tiers (Bronze/Silver/Gold at 30/60/90 day streaks) |
| Weekly Challenges | ✅ Complete | Rotating challenges with difficulty tiers and coin rewards |
| Battle Pass | ✅ Complete | 30-tier seasonal system with free/premium tracks |
| Lucky Wheel | ✅ Complete | Daily spin with rarity-based prizes |
| Achievements | ✅ Complete | 25+ achievements across multiple categories |
| Milestones | ✅ Complete | Celebration popups with coin/title rewards |
| Collection Progress | ✅ Complete | Track breeds, personalities, costumes, tricks collected |
| Cat Specializations | ✅ Complete | Show Star, Social Butterfly, Dynasty Builder paths |
| Hall of Fame | ✅ Complete | Cat retirement system with legacy bonuses |
| Daily Objectives | ✅ Complete | 3 rotating daily tasks with bonus completion reward |
| Co-op Challenges | ✅ Complete | Friend-based cooperative challenges |
| Leaderboard Rewards | ✅ Complete | Daily/weekly/monthly rank-based coin payouts |

### Current In-Game Economy

| Currency/Resource | Earn Methods | Spend Methods |
|-------------------|--------------|---------------|
| Coins | Chores, shows, challenges, rewards, selling cats | Resources, costumes, upgrades, market cats |
| Portrait Credits | Purchase with 5,000 coins | AI portrait generation (3 per package) |
| Resources (food, medicine, toys, treats) | Coins, rewards, wheel | Cat care, training |

### Monetization Gap

**Current State**: The game uses entirely in-game currency. There is **no real-money payment integration** (Stripe/payments not implemented). The Battle Pass "premium" track is currently VIP-only (login streak gated), not purchasable.

---

## Enhancement Recommendations

### Category A: Additional Gamification Features

#### A1. Social Calendar / Event System
Create recurring special events that drive engagement:

```
Weekly Rhythm:
- Monday: "Manic Monday" - 2x show prizes
- Wednesday: "Wild Wednesday" - Lucky Wheel double drop rates
- Friday: "Friendship Friday" - 2x relationship gains
- Weekend: "Weekend Warrior" - Bonus challenge XP
```

**Implementation**: Add `src/types/events.ts` and `src/hooks/useGameEvents.ts` to track active bonuses.

#### A2. Cat Prestige System
Allow max-level cats (Grade 20) to "prestige" for permanent bonuses:

| Prestige Level | Cost | Bonus |
|----------------|------|-------|
| Star 1 | Reset to Grade 10 | +5% show earnings permanently |
| Star 2 | Reset to Grade 10 | +10% total, +2% breeding success |
| Star 3 | Reset to Grade 10 | +15% total, unique prestige costume |

#### A3. Seasonal Themes with Limited Items
Each 30-day season introduces:
- 3 season-exclusive costumes (can't be bought after season ends)
- 1 legendary seasonal badge
- Seasonal leaderboard with unique rewards

Current season: "Winter Wonderland" already defined - expand with spring/summer/fall.

#### A4. Guild/Club System
Players form clubs (5-20 members) for:
- Club leaderboards
- Shared club challenges
- Club chat
- Club treasury and upgrades

#### A5. Achievement Badges & Profile Showcase
Allow players to display earned badges on their profile. Add:
- Badge rarity tiers (Common → Legendary)
- Badge sets with completion bonuses
- Profile customization with badge frames

---

### Category B: Monetization Options

#### B1. Premium Battle Pass (Real Money)

Convert the existing Battle Pass premium track to a purchasable option:

| Package | Price | Contents |
|---------|-------|----------|
| Season Pass | $4.99 | Unlock all 30 premium rewards for current season |
| Season Pass + | $9.99 | Season Pass + 10 bonus tiers + exclusive cosmetic |

**Technical**: Integrate Stripe via the built-in Lovable Stripe connector. Create `premium_purchases` table and webhook handler.

#### B2. Coin Packs (Real Money)

Direct coin purchases for players who want to progress faster:

| Pack | Price | Coins | Bonus |
|------|-------|-------|-------|
| Starter | $0.99 | 1,000 | - |
| Popular | $4.99 | 6,000 | +20% |
| Best Value | $9.99 | 15,000 | +50% |
| Tycoon | $19.99 | 35,000 | +75% |

#### B3. Premium Costumes (Real Money)

Exclusive legendary costumes not available with coins:

| Costume | Price | Show Bonus |
|---------|-------|------------|
| Celestial Wings | $2.99 | +30% |
| Royal Regalia Set | $4.99 | +40% |
| Mythical Dragon Armor | $6.99 | +50% |

#### B4. Portrait Credit Bundles (Real Money)

Premium portrait packages (in addition to coin-purchasable ones):

| Bundle | Price | Credits | Bonus |
|--------|-------|---------|-------|
| Artist Pack | $1.99 | 5 portraits | - |
| Studio Pack | $4.99 | 15 portraits | +50% |
| Gallery Pack | $9.99 | 40 portraits | +100% |

#### B5. VIP Subscription

Monthly subscription for dedicated players:

| Tier | Price/Month | Benefits |
|------|-------------|----------|
| VIP | $2.99 | 2x daily login rewards, 2 free wheel spins, +10% all earnings |
| VIP+ | $5.99 | All VIP + Premium Battle Pass included, exclusive monthly costume |

---

### Category C: Engagement Boosters

#### C1. Referral System
Players invite friends for mutual rewards:
- Referrer: 500 coins per friend who reaches Day 7
- Referee: 200 bonus coins on signup + 100 on Day 7

#### C2. Comeback Rewards
Players who haven't played in 7+ days get:
- "Welcome Back" bonus chest
- Catch-up XP boost (2x for 24 hours)
- One-time discount on coin pack

#### C3. Ad-Supported Rewards (Optional)
Optional rewarded video ads for:
- +1 extra Lucky Wheel spin
- Double challenge reward (one-time)
- Skip breeding cooldown

---

## Implementation Priority Matrix

| Priority | Feature | Effort | Revenue Impact | Engagement Impact |
|----------|---------|--------|----------------|-------------------|
| 1 | Premium Battle Pass (Stripe) | High | High | Medium |
| 2 | Coin Packs | Medium | High | Low |
| 3 | VIP Subscription | High | Very High | High |
| 4 | Social Calendar/Events | Medium | Low | Very High |
| 5 | Premium Costumes | Low | Medium | Low |
| 6 | Portrait Credit Bundles | Low | Medium | Low |
| 7 | Referral System | Medium | Medium | High |
| 8 | Guild/Club System | Very High | Low | Very High |
| 9 | Cat Prestige System | Medium | Low | High |
| 10 | Comeback Rewards | Low | Low | Medium |

---

## Technical Implementation for Stripe Monetization

### Database Schema

```sql
-- Premium purchases tracking
CREATE TABLE premium_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  product_id TEXT NOT NULL,  -- 'battle_pass_s1', 'coin_pack_5k', etc.
  stripe_payment_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'completed',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- VIP subscriptions
CREATE TABLE vip_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id),
  tier TEXT NOT NULL,  -- 'vip', 'vip_plus'
  stripe_subscription_id TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Edge Functions Needed

| Function | Purpose |
|----------|---------|
| `create-checkout-session` | Initiate Stripe checkout for one-time purchases |
| `create-subscription` | Create VIP subscription |
| `stripe-webhook` | Handle payment confirmations, subscription updates |
| `grant-purchase-rewards` | Deliver coins/items after successful payment |

### Frontend Components

| Component | Purpose |
|-----------|---------|
| `PremiumShopPanel.tsx` | Browse and purchase premium items |
| `VIPSubscriptionDialog.tsx` | VIP tier comparison and signup |
| `CoinPacksDialog.tsx` | Coin pack purchase flow |
| `PurchaseSuccessAnimation.tsx` | Celebration after purchase |

---

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `src/types/premium.ts` | Premium products, subscriptions, purchases |
| `src/hooks/usePremiumPurchases.ts` | Purchase history and status |
| `src/hooks/useVIPStatus.ts` | VIP subscription status and perks |
| `src/components/game/PremiumShopPanel.tsx` | In-game store UI |
| `src/components/game/VIPBadge.tsx` | VIP status indicator |
| `supabase/functions/create-checkout-session/index.ts` | Stripe checkout |
| `supabase/functions/stripe-webhook/index.ts` | Payment webhooks |

### Modified Files
| File | Changes |
|------|---------|
| `src/components/game/BattlePassPanel.tsx` | Add "Upgrade to Premium" button |
| `src/components/game/GameSidebar.tsx` | Add Shop tab |
| `src/components/game/StatusBar.tsx` | Show VIP badge |
| `src/hooks/useBattlePass.ts` | Check real premium status |
| `src/hooks/useDailyLoginRewards.ts` | Apply VIP multipliers |

---

## Summary

### Quick Wins (Low Effort, High Value)
1. **Social Calendar/Events** - Rotate bonuses to create urgency
2. **Premium Costumes** - Simple items with direct purchase
3. **Portrait Credit Bundles** - Extension of existing system

### Medium-Term (Moderate Effort, High Value)
1. **Stripe Integration** - Enable all real-money features
2. **Premium Battle Pass** - Convert existing system to purchasable
3. **Coin Packs** - Standard F2P monetization

### Long-Term (High Effort, Strategic Value)
1. **VIP Subscription** - Recurring revenue stream
2. **Guild/Club System** - Social lock-in and retention
3. **Referral System** - Organic growth driver

