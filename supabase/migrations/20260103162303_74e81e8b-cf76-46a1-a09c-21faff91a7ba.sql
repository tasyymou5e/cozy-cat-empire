-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON public.player_stats;

-- Create policy for authenticated users to view all stats (for leaderboards)
CREATE POLICY "Authenticated users can view leaderboard"
  ON public.player_stats FOR SELECT
  TO authenticated
  USING (true);

-- Create a public leaderboard view that only exposes non-identifying aggregate data
-- This allows unauthenticated users to see top players without exposing all user data
CREATE OR REPLACE VIEW public.public_leaderboard 
WITH (security_invoker = true)
AS
SELECT 
  display_name,
  avatar_emoji,
  total_show_wins,
  total_cats_owned,
  total_kittens_bred,
  total_money_earned,
  highest_cat_grade,
  achievements_unlocked
FROM public.player_stats
ORDER BY total_show_wins DESC
LIMIT 100;

-- Grant access to the view for anonymous and authenticated users
GRANT SELECT ON public.public_leaderboard TO anon;
GRANT SELECT ON public.public_leaderboard TO authenticated;