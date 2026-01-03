-- Add suspension columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN suspended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN suspension_reason TEXT;

-- Create announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Anyone can view active announcements
CREATE POLICY "Anyone can view active announcements"
ON public.announcements
FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Only admins can manage announcements
CREATE POLICY "Admins can insert announcements"
ON public.announcements
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update announcements"
ON public.announcements
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete announcements"
ON public.announcements
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to manage weekly challenges
CREATE POLICY "Admins can insert challenges"
ON public.weekly_challenges
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update challenges"
ON public.weekly_challenges
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete challenges"
ON public.weekly_challenges
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));