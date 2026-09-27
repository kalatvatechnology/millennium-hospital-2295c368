CREATE OR REPLACE FUNCTION public.sync_department_media(_department_id uuid, _media_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NOT public.can_manage_content() THEN
    RAISE EXCEPTION 'You do not have permission to publish department media.';
  END IF;
  DELETE FROM public.media_departments WHERE department_id = _department_id;
  INSERT INTO public.media_departments (media_id, department_id, display_order)
  SELECT m.id, _department_id, (x.ord - 1)::int
  FROM unnest(_media_ids) WITH ORDINALITY AS x(id, ord)
  JOIN public.media_items m ON m.id = x.id
  ON CONFLICT DO NOTHING;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_department_media(uuid, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_department_media(uuid, uuid[]) TO authenticated;