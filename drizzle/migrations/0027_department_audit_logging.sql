CREATE OR REPLACE FUNCTION public.audit_department_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action text;
  v_meta jsonb := '{}'::jsonb;
  v_kind text;
  v_old jsonb;
  v_new jsonb;
BEGIN
  IF new.published AND NOT old.published THEN
    v_action := 'department.published';
  ELSIF old.published AND NOT new.published THEN
    v_action := 'department.unpublished';
  ELSIF new.page_published IS DISTINCT FROM old.page_published THEN
    v_action := 'department.published';
  ELSE
    v_action := 'department.updated';
  END IF;

  -- Record specialist / FAQ / media links added or removed in the published page.
  IF new.page_published IS DISTINCT FROM old.page_published THEN
    FOREACH v_kind IN ARRAY ARRAY['doctors', 'faqs', 'media'] LOOP
      v_old := coalesce(old.page_published -> 'links' -> v_kind, '[]'::jsonb);
      v_new := coalesce(new.page_published -> 'links' -> v_kind, '[]'::jsonb);
      IF v_old IS DISTINCT FROM v_new THEN
        v_meta := v_meta || jsonb_build_object(v_kind, jsonb_build_object(
          'linked', (SELECT coalesce(jsonb_agg(x), '[]'::jsonb) FROM jsonb_array_elements(v_new) x WHERE NOT v_old @> jsonb_build_array(x)),
          'unlinked', (SELECT coalesce(jsonb_agg(x), '[]'::jsonb) FROM jsonb_array_elements(v_old) x WHERE NOT v_new @> jsonb_build_array(x))
        ));
      END IF;
    END LOOP;
  END IF;

  INSERT INTO public.audit_logs (actor_id, actor_email, action, entity_table, entity_id, summary, metadata)
  VALUES (
    auth.uid(),
    (SELECT email FROM public.profiles WHERE id = auth.uid()),
    v_action,
    'departments',
    new.id,
    new.name,
    v_meta
  );
  RETURN new;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.audit_department_changes() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER departments_audit
AFTER UPDATE ON public.departments
FOR EACH ROW
WHEN (old.* IS DISTINCT FROM new.*)
EXECUTE FUNCTION public.audit_department_changes();