-- Add missing admin UPDATE policy for game_saves table
-- This allows admins to modify user inventory, reset games, and repair corrupted saves

CREATE POLICY "Admins can update game saves"
  ON public.game_saves
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));