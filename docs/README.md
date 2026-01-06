# Cat Farm - Documentation Index

> **Main Knowledge Base:** See [GAME_KNOWLEDGE.md](../GAME_KNOWLEDGE.md) for comprehensive game documentation.

## Documentation Files

| File | Description |
|------|-------------|
| [COMPONENTS.md](COMPONENTS.md) | Component architecture (82+ game components, 42 hooks) |
| [GAME_LOGIC.md](GAME_LOGIC.md) | Core game mechanics, breeding, training, relationships |
| [DATABASE_DESIGN.md](DATABASE_DESIGN.md) | Database schema (30+ tables), JSONB structures |
| [GRAPHICS_SETTINGS.md](GRAPHICS_SETTINGS.md) | Graphics settings panel (14 configurable options) |
| [SECURITY.md](SECURITY.md) | RLS policies, authentication, admin roles |
| [TECH_STACK.md](TECH_STACK.md) | Technology stack, dependencies, file structure |
| [ERROR_LOGGING.md](ERROR_LOGGING.md) | Error tracking, logging system |
| [ADMIN_DASHBOARD.md](ADMIN_DASHBOARD.md) | Admin panel features, 8 admin pages |
| [SOCIAL_FEATURES.md](SOCIAL_FEATURES.md) | Friends, trading, gifting, relationships, decay system |
| [CAT_RELATIONSHIPS_PAGE.md](CAT_RELATIONSHIPS_PAGE.md) | Dedicated relationships page implementation |
| [BREEDING_COMPATIBILITY.md](BREEDING_COMPATIBILITY.md) | Breeding panel compatibility indicators |
| [CAT_VISUALS_AND_GALLERY.md](CAT_VISUALS_AND_GALLERY.md) | Cat display, portraits, photo booth, gallery |
| [CAT_VISUAL_SYSTEM.md](CAT_VISUAL_SYSTEM.md) | Unified cat visual architecture |
| [UNIFIED_CAT_VISUALS.md](UNIFIED_CAT_VISUALS.md) | UnifiedCatCard component system |
| [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md) | Visual architecture diagrams |
| [GAMIFICATION_IMPROVEMENTS_PLAN.md](GAMIFICATION_IMPROVEMENTS_PLAN.md) | 8 gamification systems (all implemented) |
| [NAVIGATION_IMPROVEMENTS.md](NAVIGATION_IMPROVEMENTS.md) | 8-phase UI navigation improvement plan |
| [PAGES_AND_COMPONENTS.md](PAGES_AND_COMPONENTS.md) | Page and component reference |
| [PANEL_DATA_FETCHING.md](PANEL_DATA_FETCHING.md) | Panel data fetching patterns (props vs hooks) |
| [ARCHITECTURE_AUDIT.md](ARCHITECTURE_AUDIT.md) | Architecture audit findings and resolutions |

---

## Quick Reference

### Key Files by Feature

| Feature | Key Files |
|---------|-----------|
| **Core Game** | `CatFarm.tsx`, `useGameState.ts`, `types/game.ts` |
| **Cat Display** | `CatVisual.tsx`, `CatAvatar.tsx`, `UnifiedCatCard.tsx`, `CatPortrait.tsx` |
| **Relationships** | `useRelationships.ts`, `RelationshipPanel.tsx`, `SocialCalendarPanel.tsx`, `useRelationshipReminders.ts` |
| **Social** | `useFriends.ts`, `useTrading.ts`, `useCatGifts.ts`, `useNotifications.ts` |
| **Rewards** | `useDailyLoginRewards.ts`, `useWeeklyChallenges.ts`, `useBattlePass.ts`, `useLuckyWheel.ts` |
| **Photo Booth** | `PhotoBooth.tsx`, `usePhotoGallery.ts`, `useCloudGallery.ts` |
| **Admin** | `AdminLayout.tsx`, `useAdminAuth.ts`, `useAdminData.ts` |

### Database Tables (30+)

| Category | Tables |
|----------|--------|
| **Core** | `profiles`, `game_saves`, `player_stats` |
| **Social** | `player_friends`, `cat_gifts`, `trade_offers` |
| **Challenges** | `weekly_challenges`, `player_challenge_progress`, `player_challenge_stats` |
| **Rewards** | `daily_login_rewards`, `leaderboard_rewards`, `leaderboard_snapshots`, `rank_history` |
| **Battle Pass** | `battle_pass_progress` |
| **Co-op** | `coop_challenges`, `coop_challenge_invites` |
| **Daily** | `daily_objectives_progress` |
| **Legacy** | `retired_cats` |
| **Gallery** | `gallery_photos` |
| **Notifications** | `push_subscriptions`, `announcements` |
| **Logging** | `error_logs`, `player_activity_log`, `ai_usage_log` |
| **Admin** | `user_roles`, `admin_activity_log`, `auth_attempts_log`, `rewards_processing_log` |

### Storage Buckets

| Bucket | Purpose |
|--------|---------|
| `photo-gallery` | Photo booth images |
| `cat-portraits` | AI-generated cat portraits |

### Edge Functions (7)

| Function | Purpose |
|----------|---------|
| `generate-cat-portrait` | AI portrait generation |
| `generate-weekly-challenges` | Auto-generate weekly challenges |
| `process-leaderboard-rewards` | Process periodic rewards |
| `send-push-notification` | Push notification delivery |
| `send-password-reset` | Password reset emails |
| `admin-delete-user` | Admin user deletion |
| `cleanup-error-logs` | Daily cleanup of error logs (30-day retention) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
├─────────────────────────────────────────────────────────────┤
│  Pages (12+8 admin) → Components (82+) → Hooks (42)         │
│  Contexts (3) → Types (15+) → Utils                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Backend (Lovable Cloud)                      │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL (30+ tables) │ Auth │ Storage │ Edge Functions  │
│  Row Level Security      │ JWT  │ Buckets │ Deno Runtime    │
└─────────────────────────────────────────────────────────────┘
```

---

## Game Flow

### New User
```
Visit → Auth Page → Sign Up → Profile Setup → Tutorial (16 steps) → Game
```

### Returning User  
```
Visit → Auto-login → Cloud Sync → What's New Popup → Game
                                         ↓
                   Decay Reminders → Daily Rewards → Challenges
```

### Game Loop
```
Manage Cats → Do Chores → Buy/Sell → Train → Socialize → Shows → Breed → Repeat
                                        ↓
                          Social Calendar → Maintenance Streak
```

---

## Relationship Maintenance System (NEW)

### Warning Badges
- ⚠️ Yellow: 2 days since interaction (warning zone)
- ⚠️ Orange: 5+ days (moderate decay, -2/day)
- ⚠️ Red: 7+ days (severe decay, -3/day)

### Maintenance Streak
- Track consecutive days all friendships are maintained
- 🔥 Streak badge displayed in RelationshipPanel
- Persisted in cloud save data

### Social Calendar
- Dedicated tab showing relationships by urgency
- Groups: Urgent (7+d), Warning (5-6d), Attention (3-4d), Healthy (0-2d)
- Quick access to neglected cat pairs

### Decay Reminders
- Toast notification on game load if relationships need attention
- "⚠️ Cat Bonds Fading!" for actively decaying relationships
- "💭 Time to Socialize!" for relationships in warning zone

---

## Security Highlights

- ✅ Row Level Security on all 30+ tables
- ✅ `has_role()` function for admin verification
- ✅ AdminRoute protection with logging
- ✅ Edge function authentication
- ✅ Input validation with Zod
- ✅ Error sanitization
- ✅ Audit logging (admin actions, auth attempts, player activity, AI usage)
