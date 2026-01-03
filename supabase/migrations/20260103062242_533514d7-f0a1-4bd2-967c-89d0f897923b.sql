-- Add status columns to error_logs for resolution workflow
ALTER TABLE public.error_logs 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'ignored')),
ADD COLUMN IF NOT EXISTS resolved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS resolved_by uuid,
ADD COLUMN IF NOT EXISTS resolution_notes text;

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_error_logs_status ON public.error_logs(status);

-- Add RLS policy for admins to update error logs
CREATE POLICY "Admins can update error logs" 
ON public.error_logs 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for admins to delete error logs
CREATE POLICY "Admins can delete error logs" 
ON public.error_logs 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for admins to view all error logs
CREATE POLICY "Admins can view all error logs" 
ON public.error_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create player_activity_log table for real-time feed
CREATE TABLE IF NOT EXISTS public.player_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity_type text NOT NULL,
  activity_description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.player_activity_log ENABLE ROW LEVEL SECURITY;

-- Admins can view all activity
CREATE POLICY "Admins can view activity log" 
ON public.player_activity_log 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can insert activity (for logging from client)
CREATE POLICY "Authenticated users can log activity" 
ON public.player_activity_log 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for efficient querying
CREATE INDEX idx_activity_log_created_at ON public.player_activity_log(created_at DESC);
CREATE INDEX idx_activity_log_user_id ON public.player_activity_log(user_id);

-- Enable realtime for activity feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_activity_log;