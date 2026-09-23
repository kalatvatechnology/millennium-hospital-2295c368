CREATE OR REPLACE FUNCTION public.validate_doctor_department_relationships()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  record_data jsonb := to_jsonb(NEW);
  record_department_id uuid := (record_data ->> 'department_id')::uuid;
BEGIN
  IF TG_TABLE_NAME = 'doctor_designations' AND NOT EXISTS (
    SELECT 1
    FROM public.department_designations d
    WHERE d.id = (record_data ->> 'designation_id')::uuid
      AND d.department_id = record_department_id
  ) THEN
    RAISE EXCEPTION 'Designation does not belong to the selected department';
  END IF;

  IF TG_TABLE_NAME = 'doctor_qualifications' AND NOT EXISTS (
    SELECT 1
    FROM public.department_qualifications q
    WHERE q.id = (record_data ->> 'qualification_id')::uuid
      AND q.department_id = record_department_id
  ) THEN
    RAISE EXCEPTION 'Qualification does not belong to the selected department';
  END IF;

  IF TG_TABLE_NAME = 'doctor_specializations'
    AND record_data ->> 'specialization_id' IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.department_specializations s
      WHERE s.id = (record_data ->> 'specialization_id')::uuid
        AND s.department_id = record_department_id
    )
  THEN
    RAISE EXCEPTION 'Specialization does not belong to the selected department';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validate_doctor_department_relationships() IS
  'Validates each normalized doctor relationship without reading fields absent from sibling trigger tables.';