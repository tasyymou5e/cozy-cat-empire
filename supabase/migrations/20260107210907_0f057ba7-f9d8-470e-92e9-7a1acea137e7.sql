-- Create function to get cron jobs (requires superuser access, so we use security definer)
CREATE OR REPLACE FUNCTION public.get_cron_jobs()
RETURNS TABLE (
  jobid bigint,
  jobname text,
  schedule text,
  active boolean,
  database text,
  nodename text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  RETURN QUERY
  SELECT j.jobid, j.jobname::text, j.schedule::text, j.active, j.database::text, j.nodename::text
  FROM cron.job j
  ORDER BY j.jobid;
END;
$$;

-- Create function to get cron job execution history
CREATE OR REPLACE FUNCTION public.get_cron_job_history(limit_count integer DEFAULT 50)
RETURNS TABLE (
  runid bigint,
  jobid bigint,
  jobname text,
  status text,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  return_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    d.runid,
    d.jobid,
    j.jobname::text,
    d.status::text,
    d.start_time,
    d.end_time,
    d.return_message::text
  FROM cron.job_run_details d
  LEFT JOIN cron.job j ON j.jobid = d.jobid
  ORDER BY d.start_time DESC
  LIMIT limit_count;
END;
$$;