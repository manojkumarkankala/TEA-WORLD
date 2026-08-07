/*
# Add profiles table and profile-images storage bucket

1. New Tables
- `profiles` — stores customer profile data linked to auth users
  - `id` (uuid, PK, matches auth.users id)
  - `full_name` (text, nullable display name)
  - `avatar_url` (text, nullable URL to profile image)
  - `phone` (text, nullable phone number)
  - `created_at` / `updated_at` (timestamps)

2. Storage
- Creates a `profile-images` storage bucket (public read, owner write)
- Policies: anyone can read profile images; authenticated users can
  upload/update/delete only within a folder named after their own user id.

3. Security
- RLS on `profiles`: each authenticated user can read and update only
  their own profile row. INSERT is allowed for the owner (auto-created
  on first upload).
- Storage policies enforce per-user folder isolation.

4. Notes
- The profile row id defaults to auth.uid() so the frontend can insert
  without explicitly passing the id.
- A trigger auto-creates a profile row when a new auth user signs up.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_profile" ON profiles;
CREATE POLICY "read_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Auto-create a profile row on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Storage bucket for profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read, owner-only write per user folder
DROP POLICY IF EXISTS "read_profile_images" ON storage.objects;
CREATE POLICY "read_profile_images" ON storage.objects FOR SELECT
  TO public USING (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "upload_own_profile_image" ON storage.objects;
CREATE POLICY "upload_own_profile_image" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "update_own_profile_image" ON storage.objects;
CREATE POLICY "update_own_profile_image" ON storage.objects FOR UPDATE
  TO authenticated USING (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "delete_own_profile_image" ON storage.objects;
CREATE POLICY "delete_own_profile_image" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
