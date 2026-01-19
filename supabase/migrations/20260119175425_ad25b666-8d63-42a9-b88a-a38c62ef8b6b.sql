-- =============================================
-- COMPREHENSIVE ADMIN RLS POLICIES MIGRATION
-- Adds moderation access for admins across all tables
-- =============================================

-- =============================================
-- 1. PROFILE MANAGEMENT POLICIES
-- =============================================

-- Admins can update profiles (for suspension, display name fixes)
CREATE POLICY "Admins can update profiles"
ON public.profiles FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- 2. GAME DATA MODERATION POLICIES
-- =============================================

-- Game Saves (read-only for admins - debugging)
CREATE POLICY "Admins can view all game saves"
ON public.game_saves FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Cat Gifts (full moderation)
CREATE POLICY "Admins can view all gifts"
ON public.cat_gifts FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update gifts"
ON public.cat_gifts FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete gifts"
ON public.cat_gifts FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trade Offers (full moderation)
CREATE POLICY "Admins can view all trades"
ON public.trade_offers FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update trades"
ON public.trade_offers FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete trades"
ON public.trade_offers FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- 3. SOCIAL MODERATION POLICIES
-- =============================================

-- Player Friends (moderation access)
CREATE POLICY "Admins can view all friendships"
ON public.player_friends FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete friendships"
ON public.player_friends FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Gallery Photos (content moderation)
CREATE POLICY "Admins can view all photos"
ON public.gallery_photos FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete photos"
ON public.gallery_photos FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Coop Challenges (moderation)
CREATE POLICY "Admins can view all coop challenges"
ON public.coop_challenges FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update coop challenges"
ON public.coop_challenges FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete coop challenges"
ON public.coop_challenges FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Coop Challenge Invites (moderation)
CREATE POLICY "Admins can view all coop invites"
ON public.coop_challenge_invites FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete coop invites"
ON public.coop_challenge_invites FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- 4. PLAYER DATA ACCESS POLICIES (Read-only for debugging)
-- =============================================

-- Battle Pass Progress
CREATE POLICY "Admins can view all battle pass progress"
ON public.battle_pass_progress FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update battle pass progress"
ON public.battle_pass_progress FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Daily Login Rewards
CREATE POLICY "Admins can view all login rewards"
ON public.daily_login_rewards FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update login rewards"
ON public.daily_login_rewards FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Daily Objectives Progress
CREATE POLICY "Admins can view all objectives"
ON public.daily_objectives_progress FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Player Challenge Progress
CREATE POLICY "Admins can view all challenge progress"
ON public.player_challenge_progress FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update challenge progress"
ON public.player_challenge_progress FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Player Challenge Stats
CREATE POLICY "Admins can view all challenge stats"
ON public.player_challenge_stats FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update challenge stats"
ON public.player_challenge_stats FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Player Progress (wheel, milestones)
CREATE POLICY "Admins can view all player progress"
ON public.player_progress FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update player progress"
ON public.player_progress FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Player Portrait Credits
CREATE POLICY "Admins can view all portrait credits"
ON public.player_portrait_credits FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update portrait credits"
ON public.player_portrait_credits FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- 5. LEADERBOARD & REWARDS POLICIES
-- =============================================

-- Leaderboard Rewards (admin management)
CREATE POLICY "Admins can view all leaderboard rewards"
ON public.leaderboard_rewards FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update leaderboard rewards"
ON public.leaderboard_rewards FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete leaderboard rewards"
ON public.leaderboard_rewards FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Leaderboard Snapshots
CREATE POLICY "Admins can view all leaderboard snapshots"
ON public.leaderboard_snapshots FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Rank History
CREATE POLICY "Admins can view all rank history"
ON public.rank_history FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- 6. RETIRED CATS & LEGACY
-- =============================================

-- Retired Cats
CREATE POLICY "Admins can view all retired cats"
ON public.retired_cats FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- 7. PUSH SUBSCRIPTIONS (debugging)
-- =============================================

CREATE POLICY "Admins can view all push subscriptions"
ON public.push_subscriptions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- 8. PLAYER ACTIVITY LOG
-- =============================================

CREATE POLICY "Admins can view all activity logs"
ON public.player_activity_log FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));