-- Create tutorial analytics table
CREATE TABLE public.tutorial_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'step_viewed', 'step_skipped', 'section_jumped', 'completed', 'abandoned'
  step_index INTEGER,
  step_id TEXT,
  from_step INTEGER,
  to_step INTEGER,
  section TEXT,
  time_on_step_ms INTEGER,
  total_time_ms INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tutorial_analytics ENABLE ROW LEVEL SECURITY;

-- Anyone can insert analytics (including anonymous users)
CREATE POLICY "Anyone can insert tutorial analytics"
ON public.tutorial_analytics FOR INSERT
WITH CHECK (true);

-- Only admins can view analytics
CREATE POLICY "Admins can view tutorial analytics"
ON public.tutorial_analytics FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for efficient querying
CREATE INDEX idx_tutorial_analytics_event_type ON public.tutorial_analytics(event_type);
CREATE INDEX idx_tutorial_analytics_step ON public.tutorial_analytics(step_index, step_id);
CREATE INDEX idx_tutorial_analytics_created ON public.tutorial_analytics(created_at DESC);