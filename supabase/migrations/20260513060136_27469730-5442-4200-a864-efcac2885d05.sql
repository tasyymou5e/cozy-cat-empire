
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
SET search_path TO 'public'
AS $$
DECLARE
  _meta jsonb := coalesce(_metadata, '{}'::jsonb);
  _clean_email text := btrim(coalesce(_email, ''));
BEGIN
  -- attempt_type allow-list
  IF _attempt_type IS NULL OR _attempt_type NOT IN (
    'admin_login','admin_login_failed','access_denied',
    'login','signup','password_reset','logout'
  ) THEN
    RAISE EXCEPTION 'Invalid attempt_type';
  END IF;

  -- email required, must look like an email, length-bounded
  IF char_length(_clean_email) < 3
     OR char_length(_clean_email) > 254
     OR position('@' in _clean_email) = 0 THEN
    RAISE EXCEPTION 'Invalid email';
  END IF;

  -- success must be explicit boolean
  IF _success IS NULL THEN
    RAISE EXCEPTION 'success required';
  END IF;

  -- error_message length cap
  IF char_length(coalesce(_error_message, '')) > 1000 THEN
    RAISE EXCEPTION 'error_message too long';
  END IF;

  -- metadata must be a JSON object and not too large
  IF jsonb_typeof(_meta) <> 'object' THEN
    RAISE EXCEPTION 'metadata must be an object';
  END IF;
  IF octet_length(_meta::text) > 4096 THEN
    RAISE EXCEPTION 'metadata too large';
  END IF;

  INSERT INTO public.auth_attempts_log (
    email, attempt_type, success, error_message, user_id, metadata
  )
  VALUES (
    LEFT(_clean_email, 254),
    _attempt_type,
    _success,
    LEFT(coalesce(_error_message, ''), 1000),
    auth.uid(),
    _meta
  );
END;
$$;

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
SET search_path TO 'public'
AS $$
DECLARE
  _meta jsonb := coalesce(_metadata, '{}'::jsonb);
  _clean_type text := btrim(coalesce(_error_type, ''));
  _clean_msg text := btrim(coalesce(_error_message, ''));
BEGIN
  -- error_type: required, must match [a-z][a-z0-9_]{2,49}
  IF _clean_type !~ '^[a-z][a-z0-9_]{2,49}$' THEN
    RAISE EXCEPTION 'Invalid error_type';
  END IF;

  -- error_message: required, length-bounded
  IF char_length(_clean_msg) = 0 THEN
    RAISE EXCEPTION 'error_message required';
  END IF;
  IF char_length(_clean_msg) > 5000 THEN
    RAISE EXCEPTION 'error_message too long';
  END IF;

  -- length caps on optional fields
  IF char_length(coalesce(_error_stack, '')) > 10000 THEN
    RAISE EXCEPTION 'error_stack too long';
  END IF;
  IF char_length(coalesce(_component_name, '')) > 200 THEN
    RAISE EXCEPTION 'component_name too long';
  END IF;
  IF char_length(coalesce(_route, '')) > 500 THEN
    RAISE EXCEPTION 'route too long';
  END IF;
  IF char_length(coalesce(_user_agent, '')) > 500 THEN
    RAISE EXCEPTION 'user_agent too long';
  END IF;

  -- metadata: must be an object, capped at 8 KB
  IF jsonb_typeof(_meta) <> 'object' THEN
    RAISE EXCEPTION 'metadata must be an object';
  END IF;
  IF octet_length(_meta::text) > 8192 THEN
    RAISE EXCEPTION 'metadata too large';
  END IF;

  INSERT INTO public.error_logs (
    user_id, error_type, error_message, error_stack,
    component_name, route, user_agent, metadata
  )
  VALUES (
    auth.uid(),
    _clean_type,
    _clean_msg,
    LEFT(coalesce(_error_stack, ''), 10000),
    LEFT(coalesce(_component_name, ''), 200),
    LEFT(coalesce(_route, ''), 500),
    LEFT(coalesce(_user_agent, ''), 500),
    _meta
  );
END;
$$;
