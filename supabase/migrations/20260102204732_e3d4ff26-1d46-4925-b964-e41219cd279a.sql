-- Create leaderboard_rewards table
CREATE TABLE public.leaderboard_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  period_type TEXT NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  category TEXT NOT NULL,
  rank INTEGER NOT NULL,
  reward_coins INTEGER NOT NULL,
  reward_badge TEXT,
  claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leaderboard_rewards ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own rewards"
  ON public.leaderboard_rewards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can claim their own rewards"
  ON public.leaderboard_rewards FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard_rewards;