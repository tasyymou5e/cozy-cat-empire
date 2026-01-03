-- Create admin delete user function that cascades deletion
CREATE OR REPLACE FUNCTION public.admin_delete_user(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- Delete user profile (will cascade to related data via foreign keys)
  DELETE FROM public.profiles WHERE id = _user_id;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users (function does its own auth check)
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;