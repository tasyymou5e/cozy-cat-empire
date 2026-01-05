# Cat Farm - Database Design

## Overview
Cat Farm uses Supabase (PostgreSQL) for persistent storage. This document covers all tables, relationships, and data structures.

---

## Entity Relationship Diagram

```
┌─────────────┐     ┌──────────────────┐
│  auth.users │────<│     profiles     │
└─────────────┘     └──────────────────┘
       │                    │
       │                    │
       ├──────<─────────────┼──────<──────┐
       │                    │             │
       ▼                    ▼             ▼
┌─────────────┐     ┌──────────────┐  ┌──────────────────┐
│ game_saves  │     │ player_stats │  │ player_friends   │
└─────────────┘     └──────────────┘  └──────────────────┘
       │                                     │
       │                                     │
       ▼                                     ▼
┌─────────────────────────────────────────────────────────┐
│                    Social Features                       │
├──────────────┬───────────────┬──────────────────────────┤
│  cat_gifts   │ trade_offers  │ leaderboard_rewards      │
└──────────────┴───────────────┴──────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│                    Photo Gallery                         │
├─────────────────────────────────────────────────────────┤
│                   gallery_photos                         │
└─────────────────────────────────────────────────────────┘
```

---

## Core Tables

### profiles
User profile information.

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_emoji TEXT DEFAULT '😺',
  username TEXT UNIQUE,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Purpose:** Store user display preferences and social identity.

**Key Fields:**
- `id`: Links to Supabase auth.users
- `email`: User's email address
- `display_name`: Public name shown in leaderboards
- `avatar_emoji`: Single emoji for avatar
- `username`: Unique searchable identifier
- `suspended_at`: Suspension timestamp (if suspended)
- `suspension_reason`: Reason for suspension

---

### game_saves
Persistent game state storage.

```sql
CREATE TABLE public.game_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_state JSONB NOT NULL,
  kittens_bred INTEGER DEFAULT 0,
  relationships JSONB DEFAULT '[]',
  last_played_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_save UNIQUE(user_id)
);
```

**Purpose:** Cloud save functionality for game progress.

**JSONB Structure - game_state:**
```typescript
{
  cats: Cat[],
  money: number,
  space: number,
  houseSize: 'apartment' | 'house' | 'mansion' | 'farm',
  acres: number,
  day: number,
  resources: { food, medicine, toys, treats },
  reputation: number,
  totalShowWins: number,
  catsAdopted: number,
  totalMoneyEarned: number,
  marketListings: MarketListing[],
  achievements: Achievement[],
  breedingCooldown: number,
  showCooldown: number,
  ownedCostumes: string[],
  catCostumes: Record<string, string>
}
```

**JSONB Structure - relationships:**
```typescript
{
  relationships: CatRelationship[],
  events: RelationshipEvent[],
  maintenanceStreak: number,          // Current consecutive days maintained
  longestMaintenanceStreak: number,   // All-time best streak
  lastMaintenanceDay: number | null   // Last day streak was updated
}
```

---

### player_stats
Global leaderboard statistics.

```sql
CREATE TABLE public.player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id),
  display_name TEXT,
  avatar_emoji TEXT DEFAULT '😺',
  total_show_wins INTEGER DEFAULT 0,
  total_cats_owned INTEGER DEFAULT 0,
  total_kittens_bred INTEGER DEFAULT 0,
  highest_cat_grade INTEGER DEFAULT 0,
  total_money_earned INTEGER DEFAULT 0,
  achievements_unlocked INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now()
);
```

**Purpose:** Aggregated stats for global leaderboard display.

**Note:** Denormalized from game_state for faster leaderboard queries.

---

## Social Tables

### player_friends
Friendship connections between players.

```sql
CREATE TABLE public.player_friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  friend_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT DEFAULT 'pending', -- pending, accepted, blocked
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_friendship UNIQUE(user_id, friend_id),
  CONSTRAINT no_self_friend CHECK(user_id != friend_id)
);
```

**Purpose:** Track friend relationships and requests.

**Status Values:**
- `pending`: Request sent, awaiting acceptance
- `accepted`: Mutual friendship confirmed
- `blocked`: User blocked

---

### cat_gifts
Cat gifting between players.

```sql
CREATE TABLE public.cat_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id),
  recipient_id UUID NOT NULL REFERENCES profiles(id),
  cat_data JSONB NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending', -- pending, accepted, declined
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Purpose:** Enable cat gifting between friends.

**JSONB Structure - cat_data:**
```typescript
{
  id: string,
  type: string,
  breed: string,
  name: string,
  health: number,
  happiness: number,
  hunger: number,
  value: number,
  age: number,
  personality: string,
  showWins: number,
  grade: number,
  tricksLearned: string[],
  appearance?: CatAppearance,
  portraitUrl?: string,
  // ... full Cat interface
}
```

---

### trade_offers
Player-to-player trading.

```sql
CREATE TABLE public.trade_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id),
  recipient_id UUID NOT NULL REFERENCES profiles(id),
  offered_cats JSONB DEFAULT '[]',
  offered_money INTEGER DEFAULT 0,
  offered_resources JSONB DEFAULT '{}',
  requested_cats JSONB DEFAULT '[]',
  requested_money INTEGER DEFAULT 0,
  requested_resources JSONB DEFAULT '{}',
  message TEXT,
  status TEXT DEFAULT 'pending', -- pending, accepted, declined, cancelled
  expires_at TIMESTAMPTZ DEFAULT now() + interval '7 days',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Purpose:** Complex trading system with cats, money, and resources.

---

## Photo Gallery Tables

### gallery_photos
Photo booth creations stored in cloud.

```sql
CREATE TABLE public.gallery_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cat_id TEXT NOT NULL,
  cat_name TEXT NOT NULL,
  image_path TEXT NOT NULL,
  background_id TEXT NOT NULL,
  pose_id TEXT NOT NULL,
  frame_id TEXT NOT NULL,
  sticker_count INTEGER DEFAULT 0,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Purpose:** Store photo metadata for cloud gallery sync.

**Key Fields:**
- `image_path`: Path to image in storage bucket
- `background_id`, `pose_id`, `frame_id`: Photo customization options
- `sticker_count`: Number of stickers applied
- `is_favorite`: User-marked favorite photos

---

## Reward & Progress Tables

### daily_login_rewards
Daily login tracking and rewards.

```sql
CREATE TABLE public.daily_login_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  last_login_date DATE NOT NULL,
  current_streak INTEGER DEFAULT 1,
  longest_streak INTEGER DEFAULT 1,
  total_logins INTEGER DEFAULT 1,
  last_claimed_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Purpose:** Track login streaks for daily rewards and VIP status.

---

### weekly_challenges
Weekly challenge definitions.

```sql
CREATE TABLE public.weekly_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  emoji TEXT NOT NULL,
  challenge_type TEXT NOT NULL, -- show_wins, breed_kittens, etc.
  difficulty TEXT DEFAULT 'medium', -- easy, medium, hard
  target_value INTEGER NOT NULL,
  reward_coins INTEGER NOT NULL,
  reward_badge TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Purpose:** Define weekly challenges that players can complete.

---

### player_challenge_progress
Individual challenge progress tracking.

```sql
CREATE TABLE public.player_challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  challenge_id UUID REFERENCES weekly_challenges(id),
  current_progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  reward_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### player_challenge_stats
Aggregate challenge statistics.

```sql
CREATE TABLE public.player_challenge_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  total_challenges_completed INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_week_completed TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

### leaderboard_rewards
Periodic leaderboard rewards.

```sql
CREATE TABLE public.leaderboard_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  period_type TEXT NOT NULL, -- daily, weekly, monthly
  period_end TIMESTAMPTZ NOT NULL,
  category TEXT NOT NULL, -- wins, cats, breeding, wealth, achievements
  rank INTEGER NOT NULL,
  reward_coins INTEGER NOT NULL,
  reward_badge TEXT,
  claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### leaderboard_snapshots
Historical leaderboard data.

```sql
CREATE TABLE public.leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  period_type TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  total_show_wins INTEGER DEFAULT 0,
  total_cats_owned INTEGER DEFAULT 0,
  total_kittens_bred INTEGER DEFAULT 0,
  total_money_earned INTEGER DEFAULT 0,
  achievements_unlocked INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### rank_history
Historical rank tracking.

```sql
CREATE TABLE public.rank_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  rank INTEGER NOT NULL,
  score INTEGER NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT now()
);
```

---

### rewards_processing_log
Track processed reward periods.

```sql
CREATE TABLE public.rewards_processing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_type TEXT NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  rewards_created INTEGER DEFAULT 0,
  processed_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Notification Tables

### push_subscriptions
Web push notification subscriptions.

```sql
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  notification_preferences JSONB DEFAULT '{
    "gifts": true,
    "trades": true,
    "rewards": true,
    "challenges": true,
    "friend_requests": true
  }',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Logging Tables

### error_logs
Application error tracking.

```sql
CREATE TABLE public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  component_name TEXT,
  route TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'new', -- new, investigating, resolved
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Error Types:**
- `uncaught_error`: Global JavaScript exceptions
- `unhandled_promise_rejection`: Unhandled promise rejects
- `component_error`: React component errors
- `network_error`: Failed HTTP requests
- `interaction_error`: User interaction errors

---

### player_activity_log
Player activity tracking.

```sql
CREATE TABLE public.player_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  activity_description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Activity Types:**
- `login`, `logout`
- `trade_created`, `trade_completed`
- `gift_sent`, `gift_received`
- `cat_bred`, `show_win`
- `challenge_completed`, `purchase`

---

## Admin Tables

### admin_activity_log
Admin action tracking.

```sql
CREATE TABLE public.admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  target_user_id UUID,
  target_table TEXT,
  target_record_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### auth_attempts_log
Authentication attempt tracking.

```sql
CREATE TABLE public.auth_attempts_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  attempt_type TEXT NOT NULL,
  success BOOLEAN DEFAULT false,
  user_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### user_roles
User role assignments.

```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL, -- 'admin' | 'moderator' | 'user'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');
```

---

### announcements
System-wide announcements.

```sql
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- info, warning, success, event
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### ai_usage_log
AI feature usage tracking.

```sql
CREATE TABLE public.ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  function_name TEXT NOT NULL,
  model TEXT NOT NULL,
  status TEXT NOT NULL,
  tokens_used INTEGER,
  execution_time_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Views

### public_profiles
Public profile information view.

```sql
CREATE VIEW public_profiles AS
SELECT id, display_name, avatar_emoji, created_at
FROM profiles;
```

### public_leaderboard
Public leaderboard view.

```sql
CREATE VIEW public_leaderboard AS
SELECT 
  display_name, avatar_emoji,
  total_show_wins, total_cats_owned,
  total_kittens_bred, total_money_earned,
  achievements_unlocked, highest_cat_grade
FROM player_stats;
```

---

## Storage Buckets

### photo-gallery
Public bucket for photo booth images.

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('photo-gallery', 'photo-gallery', true);
```

**Policies:**
- Users can upload their own photos
- Users can view/delete their own photos
- Photos are publicly accessible via URL

### cat-portraits
Public bucket for AI-generated cat portraits.

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('cat-portraits', 'cat-portraits', true);
```

**Policies:**
- System can upload portraits
- Users can view their own cat portraits
- Portraits are publicly accessible via URL

---

## Database Functions

### handle_new_user()
Automatically creates profile for new auth users. Captures display name and avatar from signup metadata.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_emoji, username)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data ->> 'display_name',
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_emoji', '😺'),
    NEW.raw_user_meta_data ->> 'username'
  );
  RETURN NEW;
END;
$$;

-- Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

**Signup Metadata:**
During signup, the frontend passes `display_name` and `avatar_emoji` in `options.data`, which Supabase stores in `raw_user_meta_data`. The trigger reads these values and populates the profiles table.


### update_updated_at_column()
Auto-update timestamp on row changes.

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

### has_role()
Check if user has specific role.

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;
```

### admin_delete_user()
Admin function to delete users.

```sql
CREATE OR REPLACE FUNCTION public.admin_delete_user(_user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- Delete user profile (will cascade to related data via foreign keys)
  DELETE FROM public.profiles WHERE id = _user_id;
  
  RETURN TRUE;
END;
$$;
```

---

## Indexes

### Recommended Indexes
```sql
-- Leaderboard queries
CREATE INDEX idx_player_stats_wins ON player_stats(total_show_wins DESC);
CREATE INDEX idx_player_stats_cats ON player_stats(total_cats_owned DESC);
CREATE INDEX idx_player_stats_money ON player_stats(total_money_earned DESC);

-- Friend lookups
CREATE INDEX idx_friends_user ON player_friends(user_id);
CREATE INDEX idx_friends_friend ON player_friends(friend_id);

-- Notification queries
CREATE INDEX idx_gifts_recipient ON cat_gifts(recipient_id, status);
CREATE INDEX idx_trades_recipient ON trade_offers(recipient_id, status);

-- Challenge queries
CREATE INDEX idx_challenges_active ON weekly_challenges(is_active, ends_at);
CREATE INDEX idx_challenge_progress_user ON player_challenge_progress(user_id);

-- Gallery queries
CREATE INDEX idx_gallery_user ON gallery_photos(user_id, created_at DESC);
CREATE INDEX idx_gallery_favorite ON gallery_photos(user_id, is_favorite);

-- Error logs
CREATE INDEX idx_error_logs_created ON error_logs(created_at DESC);
CREATE INDEX idx_error_logs_type ON error_logs(error_type);

-- Username uniqueness (case-insensitive)
CREATE UNIQUE INDEX profiles_username_unique_idx 
ON public.profiles (LOWER(username)) 
WHERE username IS NOT NULL AND username != '';
```

---

## Scheduled Jobs (pg_cron)

### Extensions Required
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### Active Scheduled Jobs

| Job Name | Schedule | Function | Purpose |
|----------|----------|----------|---------|
| `cleanup-error-logs-daily` | `0 3 * * *` (3 AM UTC daily) | cleanup-error-logs | Delete error logs older than 30 days |

### Job Configuration
```sql
SELECT cron.schedule(
  'cleanup-error-logs-daily',
  '0 3 * * *',
  $$ SELECT net.http_post(
    url := 'https://<project>.supabase.co/functions/v1/cleanup-error-logs',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <anon_key>"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id; $$
);
```

---

## Row-Level Security (RLS)

All tables have RLS enabled. See [SECURITY.md](./SECURITY.md) for detailed policy definitions.

**Quick Reference:**
| Table | Public Read | Owner Write | Notes |
|-------|-------------|-------------|-------|
| profiles | ✅ | ✅ | Display info is public |
| game_saves | ❌ | ✅ | Private game state |
| player_stats | ✅ | ✅ | Leaderboard is public |
| player_friends | ❌ | ✅ | Both parties can view |
| cat_gifts | ❌ | ✅ | Sender/recipient access |
| trade_offers | ❌ | ✅ | Sender/recipient access |
| gallery_photos | ❌ | ✅ | Owner access only |
| error_logs | ❌ | ✅ | Owner access only, auto-cleanup after 30 days |
| player_activity_log | ❌ | ✅ | Owner access only |
| admin_* tables | ❌ | Admin only | Admin access only |
