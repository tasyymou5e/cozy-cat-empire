
CREATE POLICY "Admins can delete activity logs"
ON public.player_activity_log
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
