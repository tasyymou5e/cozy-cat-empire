-- Phase 1: Database Configuration for AI Portrait Credits System

-- 1.1 Add portrait package configuration to game_config
INSERT INTO game_config (key, value, description, category) VALUES
('portrait_package', '{"cost": 5000, "portraits": 3}', 
 'Cost in game currency and number of portraits per purchase', 'economy')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  updated_at = now();

-- 1.2 Create player_portrait_credits table
CREATE TABLE IF NOT EXISTS player_portrait_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credits_remaining INTEGER NOT NULL DEFAULT 0,
  total_purchased INTEGER NOT NULL DEFAULT 0,
  total_used INTEGER NOT NULL DEFAULT 0,
  last_purchase_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_portrait_credits UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE player_portrait_credits ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own credits
CREATE POLICY "Users can view own portrait credits"
  ON player_portrait_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own portrait credits"
  ON player_portrait_credits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portrait credits"
  ON player_portrait_credits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin policy: Admins can manage all portrait credits
CREATE POLICY "Admins can manage all portrait credits"
  ON player_portrait_credits FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_portrait_credits_user_id ON player_portrait_credits(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_portrait_credits_updated_at
  BEFORE UPDATE ON player_portrait_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();