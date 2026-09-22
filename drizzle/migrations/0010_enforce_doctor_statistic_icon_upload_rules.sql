DROP POLICY IF EXISTS "content managers upload doctor profile images" ON storage.objects;
DROP POLICY IF EXISTS "content managers update doctor profile images" ON storage.objects;

CREATE POLICY "content managers upload doctor profile images"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'doctor-profile-images'
  AND public.can_manage_content()
  AND (
    (
      lower(storage.filename(name)) LIKE 'statistic-%'
      AND lower(storage.extension(name)) = 'png'
      AND COALESCE((metadata ->> 'size')::bigint, 0) <= 1048576
    )
    OR (
      lower(storage.filename(name)) NOT LIKE 'statistic-%'
      AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp')
      AND COALESCE((metadata ->> 'size')::bigint, 0) <= 5242880
    )
  )
);

CREATE POLICY "content managers update doctor profile images"
ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'doctor-profile-images' AND public.can_manage_content())
WITH CHECK (
  bucket_id = 'doctor-profile-images'
  AND public.can_manage_content()
  AND (
    (
      lower(storage.filename(name)) LIKE 'statistic-%'
      AND lower(storage.extension(name)) = 'png'
      AND COALESCE((metadata ->> 'size')::bigint, 0) <= 1048576
    )
    OR (
      lower(storage.filename(name)) NOT LIKE 'statistic-%'
      AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp')
      AND COALESCE((metadata ->> 'size')::bigint, 0) <= 5242880
    )
  )
);