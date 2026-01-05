-- Create game_config table for managing game settings
CREATE TABLE public.game_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES profiles(id)
);

-- Enable RLS
ALTER TABLE public.game_config ENABLE ROW LEVEL SECURITY;

-- Anyone can read config (for game to access settings)
CREATE POLICY "Anyone can read config" ON public.game_config
  FOR SELECT USING (true);

-- Only admins can modify config
CREATE POLICY "Admins can insert config" ON public.game_config
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update config" ON public.game_config
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete config" ON public.game_config
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Initial config entries
INSERT INTO public.game_config (key, value, description, category) VALUES
  ('maintenance_mode', '{"enabled": false, "message": "We are currently performing maintenance. Please check back soon!"}', 'Enable maintenance mode with optional message', 'system'),
  ('features', '{"photo_booth": true, "coop_challenges": true, "battle_pass": true, "lucky_wheel": true, "cat_portraits": true, "trading": true}', 'Feature flags to enable/disable features', 'features'),
  ('daily_reward_multiplier', '1', 'Multiplier for daily login rewards', 'rewards'),
  ('max_cats_per_user', '100', 'Maximum cats a user can own', 'limits'),
  ('show_entry_fee_multiplier', '1', 'Multiplier for show entry fees', 'economy'),
  ('breeding_cooldown_hours', '24', 'Hours between breeding attempts', 'gameplay'),
  ('market_refresh_days', '3', 'Days between market refreshes', 'gameplay'),
  ('max_photo_gallery_size', '50', 'Maximum photos per user in gallery', 'limits');