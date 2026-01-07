-- Create function to get cron job trends for charts
CREATE OR REPLACE FUNCTION public.get_cron_job_trends(days_back INTEGER DEFAULT 14)
RETURNS TABLE(
  date DATE,
  jobname TEXT,
  total_runs BIGINT,
  successful BIGINT,
  failed BIGINT,
  avg_duration_ms NUMERIC
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
    DATE(d.start_time) as date,
    j.jobname::TEXT,
    COUNT(*)::BIGINT as total_runs,
    COUNT(*) FILTER (WHERE d.status = 'succeeded')::BIGINT as successful,
    COUNT(*) FILTER (WHERE d.status = 'failed')::BIGINT as failed,
    AVG(EXTRACT(EPOCH FROM (d.end_time - d.start_time)) * 1000) as avg_duration_ms
  FROM cron.job_run_details d
  JOIN cron.job j ON d.jobid = j.jobid
  WHERE d.start_time > NOW() - (days_back || ' days')::INTERVAL
  GROUP BY DATE(d.start_time), j.jobname
  ORDER BY date DESC;
END;
$$;