-- Add unique case-insensitive index on username
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx 
ON public.profiles (LOWER(username)) 
WHERE username IS NOT NULL AND username != '';

-- Update handle_new_user trigger to ensure username is captured properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_emoji, username)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data ->> 'display_name',
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_emoji', '😺'),
    NEW.raw_user_meta_data ->> 'username'
  );
  RETURN NEW;
END;
$$;