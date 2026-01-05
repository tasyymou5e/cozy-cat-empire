# Cat Farm Gamification Improvements Plan

This plan adds 8 new gamification systems to increase engagement, provide long-term goals, and create more "moments of delight."

---

## 1. Milestone Celebration System

**New File:** `src/types/milestones.ts`

Create a comprehensive milestone system with visual celebrations:

```typescript
interface Milestone {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: 'cats' | 'money' | 'shows' | 'days' | 'breeding' | 'collection';
  threshold: number;
  reward: { coins?: number; costume?: string; title?: string };
  celebrationType: 'confetti' | 'fireworks' | 'rainbow' | 'goldRain';
}
```

### Milestones to Add:
- First $1,000 earned → Confetti + "Rising Star" title
- 10 show wins → Fireworks + Special badge
- Day 100 → Rainbow celebration + 500 coins
- All breeds collected → "Breed Master" costume unlock
- 50 kittens bred → Gold rain + "Dynasty Builder" title

### Implementation:
- New `useMilestones` hook tracking thresholds
- Milestone popup modal with animations
- Titles display next to player name

---

## 2. Cat Legacy & Hall of Fame

**New Feature:** Cat Retirement System

Cats that reach certain achievements can be "retired" to a Hall of Fame:

### Retirement Criteria:
- 20+ show wins
- Grade 18+
- Age 100+ days
- All 5 tricks learned

### Benefits:
- Retired cats grant passive bonuses (1% extra show money per retired cat)
- Legacy traits: Kittens from retired cat lineage get +1 starting grade
- Hall of Fame gallery showing all retired legends
- Special "Legend" badge on cat cards

### Files:
- `src/types/legacy.ts` - Legacy interfaces
- `src/hooks/useLegacy.ts` - Retirement logic
- `src/components/game/HallOfFamePanel.tsx` - Display gallery

---

## 3. Collection Progress System

### Track Completion Across Categories:

| Collection | Goal | Reward |
|------------|------|--------|
| All 8 Breeds | Own 1 of each | "Breed Collector" badge |
| All 6 Personalities | Own 1 of each | +5% happiness passive |
| All 5 Tricks (on 1 cat) | Already tracked | "Trick Master" achievement |
| All Costumes | Buy all 16 standard | "Fashion Icon" title |
| Grade 20 Cat | Reach max grade | "Perfection" celebration |

### New UI: `src/components/game/CollectionProgress.tsx`
- Progress bars for each collection
- Check marks for completed items
- Estimated time to complete based on current pace

---

## 4. Cat Specialization Paths

### Replace Linear Training with Branching Paths:

```
            ┌── Performance Path ──┐
            │   (Shows + Tricks)   │
   Basic    │                      │
  Training ─┼── Social Path ───────┼── Master
            │   (Relationships)    │
            │                      │
            └── Breeding Path ─────┘
                (Kitten bonuses)
```

### Specializations:
- **Show Star:** +25% show score, learns tricks faster
- **Social Butterfly:** +50% relationship gains, group leader priority
- **Dynasty Builder:** +2 grade bonus to kittens, shorter breeding cooldown

### Implementation:
- Add `specialization?: 'show' | 'social' | 'breeding'` to Cat interface
- Specialization unlocks at Grade 12
- New "Choose Path" modal when eligible

---

## 5. Lucky Wheel / Gacha System

### Daily Spin the Wheel:

Free daily spin with potential prizes:
- **Common:** 25-100 coins (60%)
- **Uncommon:** 5-10 resources (25%)
- **Rare:** Random costume piece (10%)
- **Ultra Rare:** Rare cat voucher (4%)
- **Legendary:** Legendary costume (1%)

### Premium Spins:
- 3 spins for 200 coins
- VIP players get 2 free spins daily
- Challenge completion grants extra spins

### New Files:
- `src/components/game/LuckyWheelPanel.tsx`
- `src/hooks/useLuckyWheel.ts`

---

## 6. Cooperative Friend Challenges

### Weekly Co-op Goals with Friends:

Two friends work together toward shared goals:

| Challenge | Goal | Reward (Split) |
|-----------|------|----------------|
| Show Rivals | Combined 20 show wins | 1,000 coins each |
| Breeding Partners | Exchange 3 cats that breed successfully | 500 coins + breeding boost |
| Trading Tycoons | Complete 5 trades | Exclusive "Partner" badge |

### Implementation:
- New database table: `coop_challenges`
- Match friends automatically or allow challenge invites
- Progress tracked across both players

---

## 7. Seasonal Battle Pass

### 30-Day Seasonal Battle Pass System:

**Free Track (10 tiers):**
- Tier 1: 50 coins
- Tier 5: Random common costume
- Tier 10: Exclusive seasonal cat variant

**Premium Track (VIP only, 20 tiers):**
- Bonus coins at each tier
- Exclusive animated costume at Tier 15
- Legendary seasonal item at Tier 20

### Progress:
- 100 XP per tier
- Earn XP from: Shows (+20), Breeding (+15), Challenges (+25), Daily login (+10)

### Files:
- `src/types/battlePass.ts`
- `src/hooks/useBattlePass.ts`
- `src/components/game/BattlePassPanel.tsx`

---

## 8. Dynamic Daily Objectives

### 3 Random Daily Objectives (Rotating):

**Examples:**
- "Feed your cats 3 times today" → 50 coins
- "Win a cat show with a Persian" → 100 coins
- "Socialize 2 pairs of cats" → 75 coins
- "Complete any training session" → 40 coins
- "Sell a cat for 100+ coins" → 60 coins

### Features:
- Objectives refresh daily at midnight
- Completing all 3 gives bonus reward (+100 coins)
- Objectives become harder as you progress (scaling)

### New Files:
- `src/types/dailyObjectives.ts`
- `src/hooks/useDailyObjectives.ts`
- `src/components/game/DailyObjectivesPanel.tsx`

---

## Implementation Priority

| Phase | Features | Effort |
|-------|----------|--------|
| Phase 1 | Daily Objectives + Milestone Celebrations | 2-3 days |
| Phase 2 | Collection Progress + Lucky Wheel | 2 days |
| Phase 3 | Cat Legacy/Hall of Fame | 2 days |
| Phase 4 | Specialization Paths | 2-3 days |
| Phase 5 | Battle Pass + Co-op Challenges | 3-4 days |

---

## Files Summary

| File | Type | Description |
|------|------|-------------|
| `src/types/milestones.ts` | Create | Milestone definitions |
| `src/types/legacy.ts` | Create | Hall of Fame types |
| `src/types/dailyObjectives.ts` | Create | Objective definitions |
| `src/types/battlePass.ts` | Create | Battle pass types |
| `src/hooks/useMilestones.ts` | Create | Milestone tracking |
| `src/hooks/useLegacy.ts` | Create | Retirement system |
| `src/hooks/useDailyObjectives.ts` | Create | Daily objectives |
| `src/hooks/useBattlePass.ts` | Create | Battle pass progress |
| `src/hooks/useLuckyWheel.ts` | Create | Wheel spin logic |
| `src/components/game/MilestonePopup.tsx` | Create | Celebration modal |
| `src/components/game/HallOfFamePanel.tsx` | Create | Retired cats gallery |
| `src/components/game/CollectionProgress.tsx` | Create | Progress tracking |
| `src/components/game/DailyObjectivesPanel.tsx` | Create | Objectives UI |
| `src/components/game/LuckyWheelPanel.tsx` | Create | Wheel spinner |
| `src/components/game/BattlePassPanel.tsx` | Create | Pass track display |
| `src/types/game.ts` | Modify | Add specialization to Cat |
| `src/components/game/CatFarm.tsx` | Modify | Add new panels to tabs |

---

## Database Changes (if persisting to cloud)

```sql
-- Daily objectives progress
CREATE TABLE daily_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  objective_id TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Hall of Fame / Retired cats
CREATE TABLE retired_cats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  cat_data JSONB NOT NULL,
  retired_at TIMESTAMPTZ DEFAULT now(),
  legacy_bonus NUMERIC DEFAULT 0.01
);

-- Battle pass progress
CREATE TABLE battle_pass_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) UNIQUE,
  season_id TEXT NOT NULL,
  current_xp INTEGER DEFAULT 0,
  tier INTEGER DEFAULT 0,
  claimed_tiers INTEGER[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Expected Engagement Impact

| Metric | Before | After (Est.) |
|--------|--------|--------------|
| Daily Return Rate | ~40% | ~65% (+daily objectives) |
| Session Length | 10 min | 15-20 min (+more to do) |
| Long-term Retention | Low | High (legacy + collection) |
| Social Engagement | Moderate | High (co-op challenges) |
| Monetization Ready | No | Yes (battle pass framework) |

---

## Implementation Status

| Feature | Status | Files Created |
|---------|--------|---------------|
| ✅ Milestone Celebrations | Complete | `src/types/milestones.ts`, `src/hooks/useMilestones.ts`, `src/components/game/MilestonePopup.tsx` |
| ✅ Daily Objectives | Complete | `src/types/dailyObjectives.ts`, `src/hooks/useDailyObjectives.ts`, `src/components/game/DailyObjectivesPanel.tsx` |
| ✅ Collection Progress | Complete | `src/types/collections.ts`, `src/hooks/useCollectionProgress.ts`, `src/components/game/CollectionProgressPanel.tsx` |
| ✅ Lucky Wheel | Complete | `src/types/luckyWheel.ts`, `src/hooks/useLuckyWheel.ts`, `src/components/game/LuckyWheelPanel.tsx` |
| ✅ Cat Legacy/Hall of Fame | Complete | `src/types/legacy.ts`, `src/hooks/useLegacy.ts`, `src/components/game/HallOfFamePanel.tsx` |
| ✅ Specialization Paths | Complete | `src/types/specializations.ts`, `src/hooks/useSpecializations.ts`, `src/components/game/SpecializationPanel.tsx` |
| ✅ Battle Pass | Complete | `src/types/battlePass.ts`, `src/hooks/useBattlePass.ts`, `src/components/game/BattlePassPanel.tsx` |
| ✅ Cooperative Challenges | Complete | `src/types/coopChallenges.ts`, `src/hooks/useCoopChallenges.ts`, `src/components/game/CoopChallengesPanel.tsx` |
