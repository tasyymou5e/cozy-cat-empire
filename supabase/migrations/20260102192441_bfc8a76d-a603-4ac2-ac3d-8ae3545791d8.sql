-- Allow authenticated users to view public profile information for social features
CREATE POLICY "Authenticated users can view public profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);