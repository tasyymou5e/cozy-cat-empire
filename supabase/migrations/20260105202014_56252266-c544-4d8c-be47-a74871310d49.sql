-- Phase 5.1: Rate Limiting for Admin Actions
CREATE TABLE public.admin_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  UNIQUE(admin_user_id, action_type)
);

-- Enable RLS
ALTER TABLE public.admin_rate_limits ENABLE ROW LEVEL SECURITY;

-- Policies: Only admins can manage their own rate limits
CREATE POLICY "Admins can view their own rate limits" ON public.admin_rate_limits
  FOR SELECT USING (auth.uid() = admin_user_id);

CREATE POLICY "Admins can insert their own rate limits" ON public.admin_rate_limits
  FOR INSERT WITH CHECK (auth.uid() = admin_user_id AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update their own rate limits" ON public.admin_rate_limits
  FOR UPDATE USING (auth.uid() = admin_user_id);

CREATE POLICY "Admins can delete their own rate limits" ON public.admin_rate_limits
  FOR DELETE USING (auth.uid() = admin_user_id);

-- Phase 2.2: Battle Pass Seasons Management
CREATE TABLE public.battle_pass_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  tiers JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT false,
  premium_price INTEGER DEFAULT 500,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

-- Enable RLS
ALTER TABLE public.battle_pass_seasons ENABLE ROW LEVEL SECURITY;

-- Anyone can read active seasons (for game to access)
CREATE POLICY "Anyone can read active seasons" ON public.battle_pass_seasons
  FOR SELECT USING (is_active = true);

-- Admins can manage all seasons
CREATE POLICY "Admins can insert seasons" ON public.battle_pass_seasons
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update seasons" ON public.battle_pass_seasons
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete seasons" ON public.battle_pass_seasons
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can read all seasons (including inactive)
CREATE POLICY "Admins can read all seasons" ON public.battle_pass_seasons
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Phase 2.3: Push Notification Center
CREATE TABLE public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target TEXT DEFAULT 'all', -- 'all', 'vip', 'active', 'inactive', 'specific'
  target_user_ids UUID[] DEFAULT '{}',
  sent_at TIMESTAMPTZ DEFAULT now(),
  sent_by UUID REFERENCES profiles(id),
  delivery_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' -- 'pending', 'sending', 'sent', 'failed'
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can manage notifications
CREATE POLICY "Admins can manage notifications" ON public.admin_notifications
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));