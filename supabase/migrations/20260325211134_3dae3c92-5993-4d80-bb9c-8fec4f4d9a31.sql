CREATE TABLE public.test_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  run_by UUID NOT NULL,
  total_tests INTEGER NOT NULL DEFAULT 0,
  passed INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  skipped INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER,
  results JSONB NOT NULL DEFAULT '[]'::jsonb,
  environment TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.test_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage test reports"
  ON public.test_reports FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));