/*
# Add media storage bucket for admin uploads

Creates a 'media' bucket for product images, gallery media, and
preparation videos uploaded from the admin dashboard.

1. Storage
- Creates a 'media' bucket (public read, authenticated write)
- Policies: anyone can read; authenticated users can upload/update/delete

2. Security
- Public read so storefront images load without auth
- Only authenticated users (admin) can write
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
DROP POLICY IF EXISTS "read_media" ON storage.objects;
CREATE POLICY "read_media" ON storage.objects FOR SELECT
  TO public USING (bucket_id = 'media');

-- Authenticated can upload
DROP POLICY IF EXISTS "upload_media" ON storage.objects;
CREATE POLICY "upload_media" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'media');

-- Authenticated can update
DROP POLICY IF EXISTS "update_media" ON storage.objects;
CREATE POLICY "update_media" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'media');

-- Authenticated can delete
DROP POLICY IF EXISTS "delete_media" ON storage.objects;
CREATE POLICY "delete_media" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'media');
