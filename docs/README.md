# Cat Farm - Documentation Index

## Overview
Comprehensive documentation for the Cat Farm game application.

---

## Documentation Files

| File | Description |
|------|-------------|
| [COMPONENTS.md](./COMPONENTS.md) | Component architecture, 50+ game components, 29 hooks, UI primitives |
| [GAME_LOGIC.md](./GAME_LOGIC.md) | Game mechanics, cat system, breeding, shows, economy, bulk actions, photo booth, tutorial |
| [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) | Supabase tables, schemas, relationships, JSONB structures, storage buckets |
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
- `src/components/game/CatCard.tsx` - Cat display + inline rename

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

#### Photo Booth & Gallery
- `src/pages/CatPhotoBooth.tsx` - Photo booth page
- `src/pages/CatGallery.tsx` - Photo gallery page
- `src/components/game/PhotoBooth.tsx` - Photo booth component
- `src/components/game/GalleryPhotoCard.tsx` - Photo card display
- `src/components/game/PhotoLightbox.tsx` - Full-screen viewer
- `src/components/game/DraggableSticker.tsx` - Sticker placement
- `src/hooks/usePhotoGallery.ts` - Gallery management
- `src/hooks/useCloudGallery.ts` - Cloud sync
- `src/types/photoBooth.ts` - Photo assets

#### Onboarding & Changelog
- `src/components/game/TutorialSystem.tsx` - 16-step tutorial with categories
- `src/components/game/WhatsNewPopup.tsx` - Changelog for returning players
- `src/types/changelog.ts` - Version tracking
- `src/types/gallery.ts` - Gallery types

#### Cat Customization
- `src/pages/CatCustomization.tsx` - Appearance editor page
- `src/types/catAppearance.ts` - Appearance options
- `src/components/game/CatPortrait.tsx` - Portrait display
- `src/components/game/CatAvatar.tsx` - Avatar with costume

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
| gallery_photos | Photo booth photos |
| error_logs | Error tracking |

---

## Storage Buckets

| Bucket | Purpose | Public |
|--------|---------|--------|
| photo-gallery | Photo booth images | Yes |
| cat-portraits | AI-generated portraits | Yes |

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
├──────────────┴──────────────┴────────────┴─────────────────┤
│                      Storage Buckets                         │
└──────────────────────────────────────────────────────────────┘
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
                                        │
                                        ▼
                              ┌─────────────────┐
                              │  Photo Booth    │
                              │  Cat Gallery    │
                              │  Customization  │
                              └─────────────────┘
```

---

## Cat Naming System

### Breed-Specific Names
| Breed | Theme | Examples |
|-------|-------|----------|
| Siamese | Japanese/Thai | Sakura, Miko, Yuki, Mochi |
| Persian | Royal/Fancy | Duchess, Prince, Anastasia |
| Maine Coon | Nature/Rugged | Bear, Moose, Timber, Everest |
| British Shorthair | British | Winston, Churchill, Sherlock |
| Ragdoll | Soft/Cuddly | Marshmallow, Velvet, Snuggles |
| Bengal | Wild/Exotic | Rajah, Sheba, Safari, Tigris |
| Tabby | Classic | Stripes, Marble, Caramel |
| Stray | Street Smart | Scrappy, Lucky, Rascal |

### Personality-Based Names
| Personality | Theme | Examples |
|-------------|-------|----------|
| Lazy | Sleepy | Snoozer, Dreamer, Cozy |
| Playful | Active | Zoom, Bounce, Sparky |
| Affectionate | Loving | Cuddles, Sweetie, Lovebug |
| Independent | Aloof | Maverick, Solo, Enigma |
| Curious | Inquisitive | Scout, Explorer, Sherlock |
| Shy | Gentle | Whisper, Shadow, Bashful |

---

## Security Highlights

- ✅ All tables have RLS enabled
- ✅ Email/password authentication
- ✅ No client-side admin checks
- ✅ Server-side validation for leaderboards
- ✅ JSONB for complex data
- ✅ Error logging without sensitive data
- ✅ Storage bucket policies for user data isolation
