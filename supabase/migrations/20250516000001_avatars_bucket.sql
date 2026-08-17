-- Migration: Create avatars storage bucket with RLS policies

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,  -- 2 MB, matches client-side guard in profile page
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload into their own folder (path: {user_id}/avatar.*)
DROP POLICY IF EXISTS "avatar_upload" ON storage.objects;
CREATE POLICY "avatar_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to replace/overwrite their own avatar (upsert: true)
DROP POLICY IF EXISTS "avatar_update" ON storage.objects;
CREATE POLICY "avatar_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own avatar
DROP POLICY IF EXISTS "avatar_delete" ON storage.objects;
CREATE POLICY "avatar_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read: anyone can load avatar images (bucket is public)
DROP POLICY IF EXISTS "avatar_read" ON storage.objects;
CREATE POLICY "avatar_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');
