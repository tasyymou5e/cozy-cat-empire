-- Add display name and avatar to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_emoji TEXT DEFAULT '😺';

-- Create player_stats table for global leaderboard
CREATE TABLE public.player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_emoji TEXT DEFAULT '😺',
  total_show_wins INTEGER DEFAULT 0,
  total_cats_owned INTEGER DEFAULT 0,
  total_kittens_bred INTEGER DEFAULT 0,
  highest_cat_grade INTEGER DEFAULT 0,
  total_money_earned INTEGER DEFAULT 0,
  achievements_unlocked INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view leaderboard" 
  ON public.player_stats FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can update their own stats" 
  ON public.player_stats FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats" 
  ON public.player_stats FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create player_friends table for social features
CREATE TABLE public.player_friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_friend FOREIGN KEY (friend_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE public.player_friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own friends" 
  ON public.player_friends FOR SELECT 
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can send friend requests" 
  ON public.player_friends FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their friend requests" 
  ON public.player_friends FOR UPDATE 
  USING (auth.uid() = friend_id OR auth.uid() = user_id);

CREATE POLICY "Users can delete friendships" 
  ON public.player_friends FOR DELETE 
  USING (auth.uid() = user_id OR auth.uid() = friend_id);