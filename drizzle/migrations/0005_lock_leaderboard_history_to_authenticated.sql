-- Lock leaderboard snapshots and rank history to signed-in users only

DROP POLICY "Anyone can view snapshots" ON public.leaderboard_snapshots;
CREATE POLICY "Signed-in users can view snapshots"
  ON public.leaderboard_snapshots
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY "Anyone can view rank history" ON public.rank_history;
CREATE POLICY "Signed-in users can view rank history"
  ON public.rank_history
  FOR SELECT
  TO authenticated
  USING (true);

-- Remove anonymous read access at the grant level too
REVOKE SELECT ON public.leaderboard_snapshots FROM anon;
REVOKE SELECT ON public.rank_history FROM anon;