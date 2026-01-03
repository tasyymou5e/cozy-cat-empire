# Cat Farm - Documentation Index

## Overview
Comprehensive documentation for the Cat Farm game application.

---

## Documentation Files

| File | Description |
|------|-------------|
| [COMPONENTS.md](./COMPONENTS.md) | Component architecture, 42 game components, 26 hooks, UI primitives |
| [GAME_LOGIC.md](./GAME_LOGIC.md) | Game mechanics, cat system, breeding, shows, economy, bulk actions |
| [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) | Supabase tables, schemas, relationships, JSONB structures |
| [SECURITY.md](./SECURITY.md) | RLS policies, authentication, authorization, security practices |
| [TECH_STACK.md](./TECH_STACK.md) | React, Supabase, audio system, dependencies |
| [ERROR_LOGGING.md](./ERROR_LOGGING.md) | Error types, logging system, monitoring |
| [ADMIN_DASHBOARD.md](./ADMIN_DASHBOARD.md) | Admin panel, user management, moderation |

---

## Quick Reference

### Key Files by Feature

#### Core Game
- `src/hooks/useGameState.ts` - Main game logic
- `src/types/game.ts` - Cat, GameState interfaces
- `src/components/game/CatFarm.tsx` - Master component

#### Authentication
- `src/contexts/AuthContext.tsx` - Auth provider
- `src/pages/Auth.tsx` - Login/signup page

#### Social Features
- `src/hooks/useFriends.ts` - Friend system
- `src/hooks/useCatGifts.ts` - Cat gifting
- `src/hooks/useTrading.ts` - Player trading
- `src/hooks/useNotifications.ts` - Real-time notifications

#### Rewards & Progress
- `src/hooks/useDailyLoginRewards.ts` - Daily rewards + VIP
- `src/hooks/useWeeklyChallenges.ts` - Weekly challenges
- `src/hooks/useLeaderboardRewards.ts` - Leaderboard rewards
- `src/hooks/useLeaderboardHistory.ts` - Historical rankings
- `src/hooks/usePlayerStats.ts` - Player statistics
- `src/types/dailyRewards.ts` - VIP tier definitions

#### Bulk Actions
- `src/components/game/BulkActionsPanel.tsx` - Mass cat management UI
- `src/hooks/useGameState.ts` - Bulk action functions

#### Mobile & Notifications
- `src/hooks/useHaptics.ts` - Haptic feedback
- `src/hooks/usePushNotifications.ts` - Web push
- `src/components/game/NotificationSettings.tsx` - Preferences UI

#### Audio & Effects
- `src/hooks/useSoundEffects.ts` - Procedural audio
- `src/hooks/useConfetti.ts` - Celebration effects

#### Database
- `src/integrations/supabase/client.ts` - Supabase client
- `supabase/functions/` - Edge functions

---

## Database Tables Quick Reference

| Table | Purpose |
|-------|---------|
| profiles | User display info |
| game_saves | Cloud game state |
| player_stats | Leaderboard stats |
| player_friends | Friendships |
| cat_gifts | Cat gifting |
| trade_offers | Player trading |
| daily_login_rewards | Login streaks |
| weekly_challenges | Challenge definitions |
| player_challenge_progress | Challenge tracking |
| leaderboard_rewards | Periodic rewards |
| error_logs | Error tracking |

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                        Frontend                               │
├────────────┬────────────┬────────────┬──────────────────────┤
│  React 18  │ TypeScript │ Tailwind   │ shadcn/ui            │
└────────────┴────────────┴────────────┴──────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                   State Management                            │
├────────────────┬────────────────┬───────────────────────────┤
│ useGameState   │ React Query    │ Context (Auth, Sound)     │
└────────────────┴────────────────┴───────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                   Backend (Lovable Cloud)                     │
├──────────────┬──────────────┬────────────┬─────────────────┤
│ PostgreSQL   │ Supabase Auth│ Realtime   │ Edge Functions   │
└──────────────┴──────────────┴────────────┴─────────────────┘
```

---

## Game Flow Summary

```
New User → Auth → Create Profile → Start Game (150 coins)
                                        ↓
           ┌────────────────────────────┼────────────────────────────┐
           ▼                            ▼                            ▼
      Add Cats                    Do Chores                   Buy Resources
           ↓                            ↓                            ↓
      Feed/Care                   Earn Money                  Feed/Train
           ↓                            ↓                            ↓
      Cat Shows ──────────────────> Win Prizes <──────────────── Breed
           ↓                            ↓                            ↓
      Upgrade Home <───────────── Save Progress ──────────> Compete Globally
```

---

## Security Highlights

- ✅ All tables have RLS enabled
- ✅ Email/password authentication
- ✅ No client-side admin checks
- ✅ Server-side validation for leaderboards
- ✅ JSONB for complex data
- ✅ Error logging without sensitive data
