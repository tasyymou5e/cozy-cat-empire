-- 1. rank_history: prevent fabrication (no backdating, reasonable bounds)
ALTER TABLE public.rank_history
  DROP CONSTRAINT IF EXISTS rank_history_no_backdating,
  DROP CONSTRAINT IF EXISTS rank_history_reasonable_score,
  DROP CONSTRAINT IF EXISTS rank_history_reasonable_rank;

ALTER TABLE public.rank_history
  ADD CONSTRAINT rank_history_no_backdating
    CHECK (recorded_at >= now() - interval '10 minutes' AND recorded_at <= now() + interval '10 minutes'),
  ADD CONSTRAINT rank_history_reasonable_score
    CHECK (score >= 0 AND score <= 10000000),
  ADD CONSTRAINT rank_history_reasonable_rank
    CHECK (rank >= 1 AND rank <= 1000000);

-- 2. profiles: display_name length cap (defense in depth, complements client Zod)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_display_name_length;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_display_name_length
    CHECK (display_name IS NULL OR char_length(display_name) <= 50);

-- 3. cat_gifts and trade_offers: cap message length
ALTER TABLE public.cat_gifts
  DROP CONSTRAINT IF EXISTS cat_gifts_message_length;
ALTER TABLE public.cat_gifts
  ADD CONSTRAINT cat_gifts_message_length
    CHECK (message IS NULL OR char_length(message) <= 500);

ALTER TABLE public.trade_offers
  DROP CONSTRAINT IF EXISTS trade_offers_message_length;
ALTER TABLE public.trade_offers
  ADD CONSTRAINT trade_offers_message_length
    CHECK (message IS NULL OR char_length(message) <= 500);

-- 4. Public views run with the caller's privileges (security_invoker)
ALTER VIEW public.public_profiles SET (security_invoker = true);
ALTER VIEW public.public_leaderboard SET (security_invoker = true);

-- 5. Storage: enforce user-folder isolation on cat-portraits bucket.
--    Service-role uploads (edge functions) bypass RLS, so they keep working.
DROP POLICY IF EXISTS "Authenticated users can upload portraits" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own cat portraits" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own cat portraits" ON storage.objects;

CREATE POLICY "Users can upload their own cat portraits"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'cat-portraits'
    AND auth.uid() IS NOT NULL
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own cat portraits"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'cat-portraits'
    AND auth.uid() IS NOT NULL
    AND auth.uid()::text = (storage.foldername(name))[1]
  );