-- Attachments on player messages
ALTER TABLE public.player_messages
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_name text,
  ADD COLUMN IF NOT EXISTS attachment_type text,
  ADD COLUMN IF NOT EXISTS broadcast_id uuid;

CREATE INDEX IF NOT EXISTS idx_player_messages_broadcast
  ON public.player_messages (broadcast_id)
  WHERE broadcast_id IS NOT NULL;

-- Admin broadcast: one message row per player, grouped by broadcast_id
CREATE OR REPLACE FUNCTION public.broadcast_player_message(
  _body text,
  _attachment_url text DEFAULT NULL,
  _attachment_name text DEFAULT NULL,
  _attachment_type text DEFAULT NULL
)
RETURNS TABLE(broadcast_id uuid, recipients integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _admin uuid := auth.uid();
  _batch uuid := gen_random_uuid();
  _clean text := btrim(coalesce(_body, ''));
  _count integer;
BEGIN
  IF NOT public.has_role(_admin, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  IF char_length(_clean) = 0 THEN
    RAISE EXCEPTION 'message body required';
  END IF;
  IF char_length(_clean) > 4000 THEN
    RAISE EXCEPTION 'message body too long';
  END IF;

  INSERT INTO public.player_messages (
    player_id, sender_id, direction, body,
    attachment_url, attachment_name, attachment_type,
    broadcast_id, read_by_player, read_by_admin
  )
  SELECT p.id, _admin, 'to_player', _clean,
         LEFT(coalesce(_attachment_url, ''), 1000),
         LEFT(coalesce(_attachment_name, ''), 300),
         LEFT(coalesce(_attachment_type, ''), 100),
         _batch, false, true
  FROM public.profiles p
  WHERE p.suspended_at IS NULL;

  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN QUERY SELECT _batch, _count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.broadcast_player_message(text, text, text, text) TO authenticated;