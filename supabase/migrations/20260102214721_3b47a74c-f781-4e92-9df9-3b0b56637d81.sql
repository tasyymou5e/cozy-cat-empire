-- Add streak tracking columns to player_challenge_stats
ALTER TABLE player_challenge_stats
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_week_completed TIMESTAMPTZ DEFAULT NULL;