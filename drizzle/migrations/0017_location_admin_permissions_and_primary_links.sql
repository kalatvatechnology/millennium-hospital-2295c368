DROP POLICY IF EXISTS "locations manage" ON public.locations;
CREATE POLICY "locations manage" ON public.locations FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "content managers manage doctor locations" ON public.doctor_locations;
CREATE POLICY "admins manage doctor locations" ON public.doctor_locations FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

UPDATE public.locations
SET map_url = 'https://www.google.com/maps/search/?api=1&query=The%20Millennium%20Multispecialty%20Hospital%2C%20Sector%2019%2C%20Ulwe%2C%20Navi%20Mumbai%2C%20Maharashtra%20410206'
WHERE id = 'c05eb511-3414-4a93-bcc9-8ef1e6ebcf6a' AND map_url LIKE '<iframe%';

INSERT INTO public.doctor_locations (doctor_id, location_id, enabled, display_order)
SELECT d.id, 'c05eb511-3414-4a93-bcc9-8ef1e6ebcf6a', true, 0
FROM public.doctors d
WHERE EXISTS (SELECT 1 FROM public.locations WHERE id = 'c05eb511-3414-4a93-bcc9-8ef1e6ebcf6a')
  AND NOT EXISTS (
    SELECT 1 FROM public.doctor_locations dl
    WHERE dl.doctor_id = d.id AND dl.location_id = 'c05eb511-3414-4a93-bcc9-8ef1e6ebcf6a'
  );