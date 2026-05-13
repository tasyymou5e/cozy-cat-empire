
-- ============================================================================
-- 1. Tighten auth_attempts_log INSERT policy
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can insert auth attempts" ON public.auth_attempts_log;

CREATE POLICY "Authenticated users can insert own auth attempts"
ON public.auth_attempts_log
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (user_id IS NULL OR user_id = auth.uid())
  AND attempt_type IN ('admin_login','admin_login_failed','access_denied','login','signup','password_reset','logout')
  AND char_length(coalesce(email, '')) <= 254
  AND char_length(coalesce(error_message, '')) <= 1000
);

-- SECURITY DEFINER function for unauthenticated failed-login telemetry.
-- Validates inputs and clamps field sizes; bypasses RLS safely.
CREATE OR REPLACE FUNCTION public.log_auth_attempt_secure(
  _email text,
  _attempt_type text,
  _success boolean,
  _error_message text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _attempt_type NOT IN ('admin_login','admin_login_failed','access_denied','login','signup','password_reset','logout') THEN
    RAISE EXCEPTION 'Invalid attempt_type';
  END IF;

  INSERT INTO public.auth_attempts_log (
    email, attempt_type, success, error_message, user_id, metadata
  )
  VALUES (
    LEFT(coalesce(_email, ''), 254),
    _attempt_type,
    coalesce(_success, false),
    LEFT(coalesce(_error_message, ''), 1000),
    auth.uid(),
    coalesce(_metadata, '{}'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.log_auth_attempt_secure(text, text, boolean, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_auth_attempt_secure(text, text, boolean, text, jsonb) TO anon, authenticated;

-- ============================================================================
-- 2. Tighten error_logs INSERT policy
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can insert error logs" ON public.error_logs;

CREATE POLICY "Authenticated users can insert own error logs"
ON public.error_logs
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (user_id IS NULL OR user_id = auth.uid())
  AND char_length(coalesce(error_message, '')) <= 5000
  AND char_length(coalesce(error_stack, '')) <= 10000
);

-- SECURITY DEFINER function for unauthenticated client error telemetry.
CREATE OR REPLACE FUNCTION public.log_client_error_secure(
  _error_type text,
  _error_message text,
  _error_stack text DEFAULT NULL,
  _component_name text DEFAULT NULL,
  _route text DEFAULT NULL,
  _user_agent text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(_error_type, '') = '' OR coalesce(_error_message, '') = '' THEN
    RAISE EXCEPTION 'error_type and error_message required';
  END IF;

  INSERT INTO public.error_logs (
    user_id, error_type, error_message, error_stack,
    component_name, route, user_agent, metadata
  )
  VALUES (
    auth.uid(),
    LEFT(_error_type, 100),
    LEFT(_error_message, 5000),
    LEFT(coalesce(_error_stack, ''), 10000),
    LEFT(coalesce(_component_name, ''), 200),
    LEFT(coalesce(_route, ''), 500),
    LEFT(coalesce(_user_agent, ''), 500),
    coalesce(_metadata, '{}'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.log_client_error_secure(text, text, text, text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_client_error_secure(text, text, text, text, text, text, jsonb) TO anon, authenticated;
