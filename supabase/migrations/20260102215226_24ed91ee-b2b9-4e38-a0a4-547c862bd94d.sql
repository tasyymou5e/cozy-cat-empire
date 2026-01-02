-- Create daily login rewards table
CREATE TABLE public.daily_login_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  last_login_date DATE NOT NULL,
  current_streak INTEGER DEFAULT 1,
  longest_streak INTEGER DEFAULT 1,
  total_logins INTEGER DEFAULT 1,
  last_claimed_date DATE DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.daily_login_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own login data"
  ON public.daily_login_rewards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own login data"
  ON public.daily_login_rewards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own login data"
  ON public.daily_login_rewards FOR UPDATE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_daily_login_rewards_updated_at
  BEFORE UPDATE ON public.daily_login_rewards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();