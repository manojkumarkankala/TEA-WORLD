/*
# Recreate handle_new_user with explicit search_path

The previous handle_new_user trigger function was failing during signUp
with "Database error saving new user". This recreates it with an explicit
search_path to avoid security and resolution issues.

1. Changes
- Drops and recreates `handle_new_user()` with `SET search_path = public`
- Re-creates the trigger on auth.users

2. Security
- Function remains SECURITY DEFINER owned by postgres (bypasses RLS)
- search_path is pinned to public to prevent path injection
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
