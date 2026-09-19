CREATE TABLE public.player_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  direction TEXT NOT NULL CHECK (direction IN ('to_player','from_player')),
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  read_by_player BOOLEAN NOT NULL DEFAULT false,
  read_by_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.player_messages TO authenticated;
GRANT ALL ON public.player_messages TO service_role;

ALTER TABLE public.player_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all player messages"
ON public.player_messages FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Players can view their own messages"
ON public.player_messages FOR SELECT TO authenticated
USING (auth.uid() = player_id);

CREATE POLICY "Admins can send messages to players"
ON public.player_messages FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  AND direction = 'to_player'
  AND sender_id = auth.uid()
);

CREATE POLICY "Players can send their own messages"
ON public.player_messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = player_id
  AND direction = 'from_player'
  AND sender_id = auth.uid()
);

CREATE POLICY "Admins can update message read state"
ON public.player_messages FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Players can mark their messages read"
ON public.player_messages FOR UPDATE TO authenticated
USING (auth.uid() = player_id)
WITH CHECK (auth.uid() = player_id);

CREATE INDEX idx_player_messages_player ON public.player_messages(player_id, created_at DESC);
CREATE INDEX idx_player_messages_unread_admin ON public.player_messages(read_by_admin) WHERE direction = 'from_player';