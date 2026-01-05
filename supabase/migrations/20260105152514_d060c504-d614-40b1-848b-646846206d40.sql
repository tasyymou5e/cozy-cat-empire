-- Daily objectives progress table
CREATE TABLE public.daily_objectives_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  objectives JSONB NOT NULL DEFAULT '[]',
  last_refreshed DATE NOT NULL DEFAULT CURRENT_DATE,
  bonus_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_daily_objectives UNIQUE(user_id)
);

ALTER TABLE public.daily_objectives_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own objectives"
ON public.daily_objectives_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own objectives"
ON public.daily_objectives_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own objectives"
ON public.daily_objectives_progress FOR UPDATE
USING (auth.uid() = user_id);

-- Retired cats (Hall of Fame) table
CREATE TABLE public.retired_cats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cat_data JSONB NOT NULL,
  retired_at_day INTEGER NOT NULL,
  retired_date TIMESTAMPTZ DEFAULT now(),
  achievements TEXT[] NOT NULL DEFAULT '{}',
  legacy_bonus NUMERIC(5,4) DEFAULT 0.01,
  legacy_trait TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.retired_cats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own retired cats"
ON public.retired_cats FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own retired cats"
ON public.retired_cats FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own retired cats"
ON public.retired_cats FOR DELETE
USING (auth.uid() = user_id);

-- Battle pass progress table
CREATE TABLE public.battle_pass_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id TEXT NOT NULL,
  current_xp INTEGER DEFAULT 0,
  current_tier INTEGER DEFAULT 1,
  is_premium BOOLEAN DEFAULT false,
  claimed_rewards TEXT[] DEFAULT '{}',
  purchased_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_season UNIQUE(user_id, season_id)
);

ALTER TABLE public.battle_pass_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own battle pass"
ON public.battle_pass_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own battle pass"
ON public.battle_pass_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own battle pass"
ON public.battle_pass_progress FOR UPDATE
USING (auth.uid() = user_id);

-- Coop challenges table
CREATE TABLE public.coop_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_template_id TEXT NOT NULL,
  challenge_data JSONB NOT NULL,
  initiator_id UUID NOT NULL REFERENCES auth.users(id),
  partner_id UUID NOT NULL REFERENCES auth.users(id),
  initiator_progress INTEGER DEFAULT 0,
  partner_progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'cancelled')),
  initiator_reward_claimed BOOLEAN DEFAULT false,
  partner_reward_claimed BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.coop_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own coop challenges"
ON public.coop_challenges FOR SELECT
USING (auth.uid() = initiator_id OR auth.uid() = partner_id);

CREATE POLICY "Users can create coop challenges"
ON public.coop_challenges FOR INSERT
WITH CHECK (auth.uid() = initiator_id);

CREATE POLICY "Participants can update coop challenges"
ON public.coop_challenges FOR UPDATE
USING (auth.uid() = initiator_id OR auth.uid() = partner_id);

-- Coop challenge invites table
CREATE TABLE public.coop_challenge_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_template_id TEXT NOT NULL,
  challenge_data JSONB NOT NULL,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  recipient_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  sent_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  responded_at TIMESTAMPTZ
);

ALTER TABLE public.coop_challenge_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invites they sent or received"
ON public.coop_challenge_invites FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send invites"
ON public.coop_challenge_invites FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can update invite status"
ON public.coop_challenge_invites FOR UPDATE
USING (auth.uid() = recipient_id OR auth.uid() = sender_id);

CREATE POLICY "Senders can delete their invites"
ON public.coop_challenge_invites FOR DELETE
USING (auth.uid() = sender_id);

-- Enable realtime for coop tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.coop_challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.coop_challenge_invites;

-- Add updated_at triggers
CREATE TRIGGER update_daily_objectives_updated_at
BEFORE UPDATE ON public.daily_objectives_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_battle_pass_updated_at
BEFORE UPDATE ON public.battle_pass_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coop_challenges_updated_at
BEFORE UPDATE ON public.coop_challenges
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();