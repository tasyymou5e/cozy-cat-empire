-- Enable realtime for game_saves table so users receive updates when admins modify their saves
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_saves;