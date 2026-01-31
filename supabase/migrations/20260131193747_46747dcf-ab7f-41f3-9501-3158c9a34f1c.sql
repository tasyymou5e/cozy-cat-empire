-- Allow admins to insert gifts on behalf of the system
CREATE POLICY "Admins can send gifts"
  ON public.cat_gifts
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));