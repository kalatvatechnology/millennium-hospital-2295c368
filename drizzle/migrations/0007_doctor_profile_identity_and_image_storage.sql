ALTER TABLE public.doctors
  ADD COLUMN IF NOT EXISTS professional_registration_no text,
  ADD COLUMN IF NOT EXISTS phone_country_code text,
  ADD COLUMN IF NOT EXISTS whatsapp_country_code text;

COMMENT ON COLUMN public.doctors.professional_registration_no IS 'Professional registration or licence number entered by authorised hospital staff; not an internal identifier.';
COMMENT ON COLUMN public.doctors.phone_country_code IS 'International dialling code stored separately from phone_number.';
COMMENT ON COLUMN public.doctors.whatsapp_country_code IS 'International dialling code stored separately from whatsapp_number.';

CREATE POLICY "public reads doctor profile images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'doctor-profile-images');

CREATE POLICY "content managers upload doctor profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'doctor-profile-images' AND public.can_manage_content());

CREATE POLICY "content managers update doctor profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'doctor-profile-images' AND public.can_manage_content())
WITH CHECK (bucket_id = 'doctor-profile-images' AND public.can_manage_content());

CREATE POLICY "content managers delete doctor profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'doctor-profile-images' AND public.can_manage_content());