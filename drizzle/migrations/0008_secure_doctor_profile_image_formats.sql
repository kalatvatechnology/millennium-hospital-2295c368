DROP POLICY IF EXISTS "content managers upload doctor profile images" ON storage.objects;
DROP POLICY IF EXISTS "content managers update doctor profile images" ON storage.objects;

CREATE POLICY "content managers upload doctor profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'doctor-profile-images'
  AND public.can_manage_content()
  AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp')
);

CREATE POLICY "content managers update doctor profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'doctor-profile-images'
  AND public.can_manage_content()
)
WITH CHECK (
  bucket_id = 'doctor-profile-images'
  AND public.can_manage_content()
  AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp')
);