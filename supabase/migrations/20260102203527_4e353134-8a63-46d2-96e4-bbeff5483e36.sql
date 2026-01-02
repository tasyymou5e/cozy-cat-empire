-- Create leaderboard_snapshots table for time period tracking
CREATE TABLE public.leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  period_start TIMESTAMPTZ NOT NULL,
  total_show_wins INTEGER DEFAULT 0,
  total_cats_owned INTEGER DEFAULT 0,
  total_kittens_bred INTEGER DEFAULT 0,
  total_money_earned INTEGER DEFAULT 0,
  achievements_unlocked INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, period_type, period_start)
);

-- Create rank_history table for tracking rank progression
CREATE TABLE public.rank_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  rank INTEGER NOT NULL,
  score INTEGER NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for efficient history queries
CREATE INDEX idx_rank_history_user_category ON public.rank_history (user_id, category, recorded_at DESC);
CREATE INDEX idx_leaderboard_snapshots_lookup ON public.leaderboard_snapshots (user_id, period_type, period_start);

-- Enable RLS on both tables
ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for leaderboard_snapshots
CREATE POLICY "Anyone can view snapshots" ON public.leaderboard_snapshots
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own snapshots" ON public.leaderboard_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own snapshots" ON public.leaderboard_snapshots
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for rank_history
CREATE POLICY "Anyone can view rank history" ON public.rank_history
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own history" ON public.rank_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard_snapshots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rank_history;