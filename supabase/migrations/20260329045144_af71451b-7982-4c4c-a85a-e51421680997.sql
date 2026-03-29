-- Update trigger to save username from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', '')
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'observer');
  RETURN NEW;
END;
$function$;

-- Allow any authenticated user to check if username exists (for signup validation)
CREATE POLICY "Auth can check usernames" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- Drop the old restrictive select policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Function to check username availability (callable by anon for signup)
CREATE OR REPLACE FUNCTION public.check_username_available(p_username text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE lower(username) = lower(p_username)
  )
$$;