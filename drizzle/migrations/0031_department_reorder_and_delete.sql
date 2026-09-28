CREATE OR REPLACE FUNCTION public.move_department(_department_id uuid, _direction text)
RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
DECLARE ids uuid[]; pos int; other int;
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Only a super admin can reorder departments'; END IF;
  IF _direction NOT IN ('up','down') THEN RAISE EXCEPTION 'Invalid direction'; END IF;
  SELECT array_agg(id ORDER BY display_order, name, id) INTO ids FROM public.departments;
  pos := array_position(ids, _department_id);
  IF pos IS NULL THEN RAISE EXCEPTION 'Department not found'; END IF;
  other := CASE WHEN _direction = 'up' THEN pos - 1 ELSE pos + 1 END;
  IF other < 1 OR other > array_length(ids, 1) THEN RETURN; END IF;
  ids[other] := ids[pos] || ids[other] ; -- placeholder replaced below
END $$;

CREATE OR REPLACE FUNCTION public.move_department(_department_id uuid, _direction text)
RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
DECLARE ids uuid[]; pos int; other int; tmp uuid;
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Only a super admin can reorder departments'; END IF;
  IF _direction NOT IN ('up','down') THEN RAISE EXCEPTION 'Invalid direction'; END IF;
  SELECT array_agg(id ORDER BY display_order, name, id) INTO ids FROM public.departments;
  pos := array_position(ids, _department_id);
  IF pos IS NULL THEN RAISE EXCEPTION 'Department not found'; END IF;
  other := CASE WHEN _direction = 'up' THEN pos - 1 ELSE pos + 1 END;
  IF other < 1 OR other > array_length(ids, 1) THEN RETURN; END IF;
  tmp := ids[pos]; ids[pos] := ids[other]; ids[other] := tmp;
  -- Renumber every department 0..n-1 so no sequence number repeats; only display_order changes.
  UPDATE public.departments d SET display_order = x.ord - 1
  FROM unnest(ids) WITH ORDINALITY AS x(id, ord)
  WHERE d.id = x.id AND d.display_order IS DISTINCT FROM x.ord - 1;
END $$;

CREATE OR REPLACE FUNCTION public.delete_department(_department_id uuid)
RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'Only a super admin can delete departments'; END IF;
  -- Shared records keep existing; only their pointer to this department is cleared.
  UPDATE public.doctors SET department_id = NULL WHERE department_id = _department_id;
  UPDATE public.enquiries SET department_id = NULL WHERE department_id = _department_id;
  UPDATE public.seo_target_keywords SET department_id = NULL WHERE department_id = _department_id;
  UPDATE public.doctor_specializations SET department_id = NULL, specialization_id = NULL
    WHERE department_id = _department_id
       OR specialization_id IN (SELECT id FROM public.department_specializations WHERE department_id = _department_id);
  UPDATE public.doctor_statistics SET statistic_id = NULL
    WHERE statistic_id IN (SELECT id FROM public.doctor_statistic_definitions WHERE department_id = _department_id);
  -- Link rows (doctors, services, media, facilities, blog, department FAQs and taxonomies) cascade.
  DELETE FROM public.departments WHERE id = _department_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Department not found'; END IF;
END $$;

REVOKE ALL ON FUNCTION public.move_department(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_department(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.move_department(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_department(uuid) TO authenticated;