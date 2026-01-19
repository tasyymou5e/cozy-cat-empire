-- Create table to store security scan history for trend tracking
CREATE TABLE public.security_scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scan_duration_ms INTEGER NOT NULL,
  total_issues INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  warnings INTEGER NOT NULL DEFAULT 0,
  infos INTEGER NOT NULL DEFAULT 0,
  security_score INTEGER NOT NULL DEFAULT 100,
  security_grade TEXT NOT NULL DEFAULT 'A',
  issues JSONB NOT NULL DEFAULT '[]',
  scanned_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_scan_history ENABLE ROW LEVEL SECURITY;

-- Only admins can view scan history
CREATE POLICY "Admins can view security scan history"
ON public.security_scan_history
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert scan results
CREATE POLICY "Admins can insert security scan results"
ON public.security_scan_history
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create index for efficient trend queries
CREATE INDEX idx_security_scan_history_scanned_at ON public.security_scan_history(scanned_at DESC);

-- Add comment
COMMENT ON TABLE public.security_scan_history IS 'Stores security scan results for trend analysis';