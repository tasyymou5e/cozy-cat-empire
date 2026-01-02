-- Part 1: Admin Activity Log Table
CREATE TABLE public.admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  target_user_id UUID,
  target_table TEXT,
  target_record_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view activity log"
  ON public.admin_activity_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert activity log"
  ON public.admin_activity_log FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Part 2: Auth Attempts Log Table
CREATE TABLE public.auth_attempts_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  attempt_type TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  error_message TEXT,
  user_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.auth_attempts_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert auth attempts"
  ON public.auth_attempts_log FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view auth attempts"
  ON public.auth_attempts_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));