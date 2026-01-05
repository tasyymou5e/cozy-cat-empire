-- Update handle_new_user trigger to capture avatar_emoji from signup metadata
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