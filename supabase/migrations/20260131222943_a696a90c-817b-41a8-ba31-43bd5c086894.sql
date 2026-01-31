-- =====================================================
-- GAMIFICATION ENHANCEMENT MIGRATION
-- Adds: Clubs, Badges, Profile enhancements
-- =====================================================

-- Add prestige and badge columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_badges TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS profile_frame TEXT DEFAULT 'default';

-- =====================================================
-- PLAYER BADGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.player_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  is_displayed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.player_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own badges" ON public.player_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges" ON public.player_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own badges" ON public.player_badges
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all badges" ON public.player_badges
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- CLUBS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  emoji TEXT DEFAULT '🐱',
  description TEXT,
  owner_id UUID NOT NULL REFERENCES profiles(id),
  total_xp INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view clubs" ON public.clubs
  FOR SELECT USING (true);

CREATE POLICY "Users can create clubs" ON public.clubs
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update clubs" ON public.clubs
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete clubs" ON public.clubs
  FOR DELETE USING (auth.uid() = owner_id);

-- =====================================================
-- CLUB MEMBERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'officer', 'member')),
  weekly_contribution INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(club_id, user_id)
);

ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view club members" ON public.club_members
  FOR SELECT USING (true);

CREATE POLICY "Users can join clubs" ON public.club_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can leave clubs" ON public.club_members
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage members" ON public.club_members
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- CLUB INVITES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.club_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES profiles(id),
  invitee_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE public.club_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invites" ON public.club_invites
  FOR SELECT USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE POLICY "Users can send invites" ON public.club_invites
  FOR INSERT WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Invitees can update invite status" ON public.club_invites
  FOR UPDATE USING (auth.uid() = invitee_id);

-- =====================================================
-- CLUB CHALLENGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.club_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  challenge_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT DEFAULT '🎯',
  target_value INTEGER NOT NULL,
  current_progress INTEGER DEFAULT 0,
  reward_coins INTEGER NOT NULL,
  reward_badge TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.club_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club members can view challenges" ON public.club_challenges
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM club_members WHERE club_id = club_challenges.club_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can manage challenges" ON public.club_challenges
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_player_badges_user ON public.player_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_club_members_club ON public.club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_user ON public.club_members(user_id);
CREATE INDEX IF NOT EXISTS idx_club_invites_invitee ON public.club_invites(invitee_id, status);
CREATE INDEX IF NOT EXISTS idx_club_challenges_club ON public.club_challenges(club_id, ends_at);