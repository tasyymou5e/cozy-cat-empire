

# Gamification Features Implementation Plan

## Overview

This plan adds five new gamification features to Cat Farm:
1. **Weekly Event Calendar** - Rotating daily bonuses
2. **Cat Prestige System** - Reset max-grade cats for permanent bonuses
3. **Seasonal Themes with Limited Items** - Time-limited exclusive content
4. **Guild/Club System** - Social clubs with shared goals
5. **Achievement Badges & Profile Showcase** - Display earned badges on profile

---

## Phase 1: Weekly Event Calendar

### A1.1 - New Types (src/types/weeklyEvents.ts)

Create type definitions for the weekly bonus system:

```typescript
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface WeeklyEvent {
  id: string;
  name: string;
  emoji: string;
  description: string;
  dayOfWeek: DayOfWeek;
  bonusType: 'show_prize' | 'wheel_rate' | 'relationship' | 'challenge_xp' | 'breeding';
  multiplier: number;
}

export const WEEKLY_EVENTS: WeeklyEvent[] = [
  { id: 'manic_monday', name: 'Manic Monday', emoji: '🏆', description: '2x show prizes!', dayOfWeek: 1, bonusType: 'show_prize', multiplier: 2.0 },
  { id: 'training_tuesday', name: 'Training Tuesday', emoji: '💪', description: '50% more training progress', dayOfWeek: 2, bonusType: 'challenge_xp', multiplier: 1.5 },
  { id: 'wild_wednesday', name: 'Wild Wednesday', emoji: '🎰', description: 'Better wheel prizes', dayOfWeek: 3, bonusType: 'wheel_rate', multiplier: 2.0 },
  { id: 'breeding_thursday', name: 'Breeding Thursday', emoji: '💕', description: '+25% breeding success', dayOfWeek: 4, bonusType: 'breeding', multiplier: 1.25 },
  { id: 'friendship_friday', name: 'Friendship Friday', emoji: '❤️', description: '2x relationship gains', dayOfWeek: 5, bonusType: 'relationship', multiplier: 2.0 },
  { id: 'weekend_warrior', name: 'Weekend Warrior', emoji: '⚡', description: '+50% challenge XP', dayOfWeek: 6, bonusType: 'challenge_xp', multiplier: 1.5 },
];
```

### A1.2 - Hook (src/hooks/useWeeklyEvents.ts)

```typescript
export function useWeeklyEvents() {
  const getTodayEvent = useCallback(() => {
    const dayOfWeek = new Date().getDay() as DayOfWeek;
    return WEEKLY_EVENTS.find(e => e.dayOfWeek === dayOfWeek) || WEEKLY_EVENTS[6]; // Sunday uses Weekend Warrior
  }, []);

  const getEventMultiplier = useCallback((bonusType: WeeklyEvent['bonusType']) => {
    const todayEvent = getTodayEvent();
    return todayEvent?.bonusType === bonusType ? todayEvent.multiplier : 1.0;
  }, [getTodayEvent]);

  return { getTodayEvent, getEventMultiplier, allEvents: WEEKLY_EVENTS };
}
```

### A1.3 - UI Component (src/components/game/WeeklyEventBanner.tsx)

A banner component showing today's active event, displayed in CatFarm header.

---

## Phase 2: Cat Prestige System

### A2.1 - Types (src/types/prestige.ts)

```typescript
export interface PrestigeLevel {
  stars: number;
  name: string;
  showEarningsBonus: number;
  breedingSuccessBonus: number;
  costumeReward?: string;
  requiredGrade: 20;
}

export const PRESTIGE_LEVELS: PrestigeLevel[] = [
  { stars: 1, name: 'Star 1', showEarningsBonus: 0.05, breedingSuccessBonus: 0 },
  { stars: 2, name: 'Star 2', showEarningsBonus: 0.10, breedingSuccessBonus: 0.02 },
  { stars: 3, name: 'Star 3', showEarningsBonus: 0.15, breedingSuccessBonus: 0.05, costumeReward: 'prestige_crown' },
];

export interface CatPrestigeData {
  catId: string;
  prestigeLevel: number; // 0-3
  totalPrestiges: number;
}
```

### A2.2 - Cat Interface Extension

Add to `Cat` interface in `src/types/game.ts`:
```typescript
prestigeLevel?: number; // 0-3 stars
totalPrestiges?: number;
```

### A2.3 - Prestige Hook (src/hooks/usePrestige.ts)

```typescript
export function usePrestige(cats: Cat[], updateCat: (id: string, updates: Partial<Cat>) => void) {
  const canPrestige = useCallback((cat: Cat) => {
    return cat.grade >= 20 && (cat.prestigeLevel || 0) < 3;
  }, []);

  const prestigeCat = useCallback((catId: string) => {
    const cat = cats.find(c => c.id === catId);
    if (!cat || !canPrestige(cat)) return false;

    const newPrestigeLevel = (cat.prestigeLevel || 0) + 1;
    updateCat(catId, {
      grade: 10, // Reset to grade 10
      prestigeLevel: newPrestigeLevel,
      totalPrestiges: (cat.totalPrestiges || 0) + 1,
    });
    return true;
  }, [cats, canPrestige, updateCat]);

  const getPrestigeBonuses = useCallback((cat: Cat) => {
    const level = cat.prestigeLevel || 0;
    return PRESTIGE_LEVELS.slice(0, level).reduce(
      (acc, l) => ({
        showEarningsBonus: acc.showEarningsBonus + l.showEarningsBonus,
        breedingSuccessBonus: acc.breedingSuccessBonus + l.breedingSuccessBonus,
      }),
      { showEarningsBonus: 0, breedingSuccessBonus: 0 }
    );
  }, []);

  return { canPrestige, prestigeCat, getPrestigeBonuses };
}
```

### A2.4 - UI Component (src/components/game/PrestigePanel.tsx)

Panel showing prestige-eligible cats with confirmation dialog.

---

## Phase 3: Seasonal Limited Items

### A3.1 - Types (src/types/seasonalContent.ts)

```typescript
export interface SeasonalItem extends Costume {
  seasonId: string;
  availableUntil: string; // ISO date
  isLimited: true;
}

export interface Season {
  id: string;
  name: string;
  emoji: string;
  theme: RealSeason;
  startsAt: string;
  endsAt: string;
  costumes: SeasonalItem[];
  badge: { id: string; name: string; emoji: string };
}

export const SEASONS: Season[] = [
  {
    id: 'winter_2026',
    name: 'Winter Wonderland',
    emoji: '❄️',
    theme: 'winter',
    startsAt: '2026-01-01',
    endsAt: '2026-02-28',
    costumes: [
      { id: 'snowflake_collar', name: 'Snowflake Collar', ... },
      { id: 'ice_queen_crown', name: 'Ice Queen Crown', ... },
      { id: 'aurora_wings', name: 'Aurora Wings', ... },
    ],
    badge: { id: 'winter_2026_badge', name: 'Winter Champion', emoji: '❄️' },
  },
  // Spring, Summer, Autumn seasons...
];
```

### A3.2 - Hook (src/hooks/useSeasonalContent.ts)

Manages current season detection, limited item availability, and seasonal leaderboard.

### A3.3 - UI Updates

- Add "Limited" badge to CostumeShopPanel for seasonal items
- Add countdown timer for season end
- Show "Season Ending" warnings

---

## Phase 4: Guild/Club System

### A4.1 - Database Tables

```sql
-- Clubs table
CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  emoji TEXT DEFAULT '🐱',
  description TEXT,
  owner_id UUID NOT NULL REFERENCES profiles(id),
  max_members INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Club members
CREATE TABLE club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  role TEXT DEFAULT 'member', -- owner, officer, member
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(club_id, user_id)
);

-- Club challenges
CREATE TABLE club_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  challenge_type TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  current_progress INTEGER DEFAULT 0,
  reward_coins INTEGER NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### A4.2 - Types (src/types/clubs.ts)

```typescript
export interface Club {
  id: string;
  name: string;
  emoji: string;
  description?: string;
  ownerId: string;
  maxMembers: number;
  memberCount?: number;
}

export interface ClubMember {
  id: string;
  clubId: string;
  userId: string;
  role: 'owner' | 'officer' | 'member';
  displayName?: string;
  avatarEmoji?: string;
}

export interface ClubChallenge {
  id: string;
  clubId: string;
  challengeType: string;
  targetValue: number;
  currentProgress: number;
  rewardCoins: number;
  startsAt: string;
  endsAt: string;
  completed: boolean;
}
```

### A4.3 - Hook (src/hooks/useClub.ts)

```typescript
export function useClub(userId?: string) {
  const [myClub, setMyClub] = useState<Club | null>(null);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [challenges, setChallenges] = useState<ClubChallenge[]>([]);

  // Club management functions
  const createClub = async (name: string, emoji: string, description?: string) => {...};
  const joinClub = async (clubId: string) => {...};
  const leaveClub = async () => {...};
  const inviteMember = async (userId: string) => {...};
  const contributeToChallenge = async (challengeId: string, amount: number) => {...};

  return { myClub, members, challenges, createClub, joinClub, leaveClub, ... };
}
```

### A4.4 - UI Components

- `src/components/game/ClubPanel.tsx` - Main club interface
- `src/components/game/ClubSearchDialog.tsx` - Find and join clubs
- `src/components/game/ClubChallengesCard.tsx` - Active club challenges
- `src/components/game/ClubLeaderboardCard.tsx` - Club rankings

### A4.5 - Add Tab

Update `src/constants/tabs.ts`:
```typescript
clubs: { label: 'Club', icon: '🏰' },
```

---

## Phase 5: Achievement Badges & Profile Showcase

### A5.1 - Types (src/types/badges.ts)

```typescript
export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  rarity: BadgeRarity;
  category: 'achievement' | 'challenge' | 'seasonal' | 'social' | 'premium';
  unlockedAt?: string;
}

export interface ProfileFrame {
  id: string;
  name: string;
  cssClass: string;
  requiredBadgeCount: number;
}

export const BADGE_RARITY_COLORS: Record<BadgeRarity, string> = {
  common: 'border-gray-400 bg-gray-100',
  uncommon: 'border-green-500 bg-green-100',
  rare: 'border-blue-500 bg-blue-100',
  epic: 'border-purple-500 bg-purple-100',
  legendary: 'border-yellow-500 bg-gradient-to-r from-yellow-100 to-orange-100',
};
```

### A5.2 - Database Table

```sql
CREATE TABLE player_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  badge_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  is_displayed BOOLEAN DEFAULT false, -- Featured on profile
  UNIQUE(user_id, badge_id)
);

-- Add to profiles
ALTER TABLE profiles ADD COLUMN display_badges TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN profile_frame TEXT;
```

### A5.3 - Hook (src/hooks/useBadges.ts)

```typescript
export function useBadges(userId?: string) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [displayedBadges, setDisplayedBadges] = useState<string[]>([]);

  const unlockBadge = async (badgeId: string) => {...};
  const setDisplayBadges = async (badgeIds: string[]) => {...}; // Max 3 displayed

  return { badges, displayedBadges, unlockBadge, setDisplayBadges };
}
```

### A5.4 - UI Components

- `src/components/game/BadgeShowcase.tsx` - Grid of all badges with unlock status
- `src/components/game/ProfileBadgeEditor.tsx` - Select which 3 badges to display
- `src/components/game/BadgeDisplay.tsx` - Show badges on profile/leaderboard

### A5.5 - Profile Panel Update

Update `PlayerProfilePanel.tsx` to include:
- Badge showcase section
- "Featured Badges" selector (pick 3 to display)
- Profile frame selector (unlocked by badge count)

---

## Files Summary

### New Files (17 files)

| File | Purpose |
|------|---------|
| `src/types/weeklyEvents.ts` | Weekly event type definitions |
| `src/types/prestige.ts` | Cat prestige system types |
| `src/types/seasonalContent.ts` | Seasonal limited items types |
| `src/types/clubs.ts` | Guild/club system types |
| `src/types/badges.ts` | Badge and profile showcase types |
| `src/hooks/useWeeklyEvents.ts` | Weekly event multipliers |
| `src/hooks/usePrestige.ts` | Cat prestige management |
| `src/hooks/useSeasonalContent.ts` | Seasonal content tracking |
| `src/hooks/useClub.ts` | Club membership and challenges |
| `src/hooks/useBadges.ts` | Badge unlocking and display |
| `src/components/game/WeeklyEventBanner.tsx` | Today's event display |
| `src/components/game/PrestigePanel.tsx` | Cat prestige interface |
| `src/components/game/ClubPanel.tsx` | Main club interface |
| `src/components/game/ClubSearchDialog.tsx` | Join clubs |
| `src/components/game/BadgeShowcase.tsx` | Badge collection view |
| `src/components/game/ProfileBadgeEditor.tsx` | Featured badge selector |
| `src/components/game/BadgeDisplay.tsx` | Badge rendering component |

### Modified Files (8 files)

| File | Changes |
|------|---------|
| `src/types/game.ts` | Add `prestigeLevel` and `totalPrestiges` to Cat |
| `src/types/costumes.ts` | Add seasonal costume support |
| `src/constants/tabs.ts` | Add `clubs` and `badges` tabs |
| `src/components/game/PlayerProfilePanel.tsx` | Add badge showcase section |
| `src/components/game/CatFarm.tsx` | Integrate weekly event banner |
| `src/components/game/CostumeShopPanel.tsx` | Show seasonal limited items |
| `src/components/game/GlobalLeaderboardPanel.tsx` | Show player badges |
| `src/hooks/game/useCatShows.ts` | Apply prestige and event multipliers |

### Database Changes

3 new tables:
- `clubs`
- `club_members`
- `club_challenges`

1 new table for badges:
- `player_badges`

Profile table additions:
- `display_badges TEXT[]`
- `profile_frame TEXT`

---

## Implementation Order

1. **Phase 1**: Weekly Events (simplest, no database changes)
2. **Phase 2**: Cat Prestige (modifies existing Cat type)
3. **Phase 5**: Badge System (extends profile functionality)
4. **Phase 3**: Seasonal Content (extends costume system)
5. **Phase 4**: Club System (most complex, requires full database setup)

---

## Technical Notes

- All new hooks follow the existing pattern of local state + Supabase sync
- Badge unlocks are triggered automatically when achievements unlock (integration with existing achievement system)
- Club challenges contribute to individual challenge progress (double-counting benefit)
- Weekly events are client-side only (no database) - just apply multipliers based on day of week
- Prestige data is stored in the Cat object within `game_saves.game_state` JSONB

