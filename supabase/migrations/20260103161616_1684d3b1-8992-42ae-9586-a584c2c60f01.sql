-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view public profiles" ON public.profiles;

-- Keep the policy that allows users to view their own profile
-- (Already exists: "Users can view their own profile")

-- For social features (friends, leaderboards, etc.), create a view that only exposes non-sensitive fields
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  display_name,
  avatar_emoji,
  created_at
FROM public.profiles;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;