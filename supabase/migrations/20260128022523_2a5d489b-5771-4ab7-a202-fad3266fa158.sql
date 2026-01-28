-- Create save_snapshots table for tracking save history
CREATE TABLE public.save_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  snapshot_type TEXT NOT NULL, -- 'auto', 'manual', 'migration'
  cat_count INTEGER NOT NULL,
  cat_names TEXT[] NOT NULL,
  day INTEGER NOT NULL,
  money INTEGER NOT NULL,
  game_state_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient user lookups
CREATE INDEX idx_save_snapshots_user ON save_snapshots(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE save_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own snapshots" ON save_snapshots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own snapshots" ON save_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own old snapshots" ON save_snapshots
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all snapshots" ON save_snapshots
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete snapshots" ON save_snapshots
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Create sync_health_log table for monitoring
CREATE TABLE public.sync_health_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  saves_checked INTEGER NOT NULL DEFAULT 0,
  saves_with_issues INTEGER NOT NULL DEFAULT 0,
  total_issues INTEGER NOT NULL DEFAULT 0,
  issue_summary JSONB DEFAULT '{}',
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE sync_health_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin and service only)
CREATE POLICY "Admins can view sync health" ON sync_health_log
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service can insert sync health" ON sync_health_log
  FOR INSERT WITH CHECK (true);