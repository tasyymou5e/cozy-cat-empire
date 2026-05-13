
DROP POLICY IF EXISTS "Admins can insert sync health" ON public.sync_health_log;

DROP POLICY IF EXISTS "Users can update own portrait credits" ON public.player_portrait_credits;
DROP POLICY IF EXISTS "Users can insert own portrait credits" ON public.player_portrait_credits;
