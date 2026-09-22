CREATE TABLE public.doctor_departments (
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (doctor_id, department_id)
);
GRANT SELECT ON public.doctor_departments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_departments TO authenticated;
GRANT ALL ON public.doctor_departments TO service_role;
ALTER TABLE public.doctor_departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published doctor departments are public" ON public.doctor_departments FOR SELECT TO anon USING (EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.published));
CREATE POLICY "staff read doctor departments" ON public.doctor_departments FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "content managers manage doctor departments" ON public.doctor_departments FOR ALL TO authenticated USING (public.can_manage_content()) WITH CHECK (public.can_manage_content());
CREATE INDEX doctor_departments_department_idx ON public.doctor_departments(department_id, doctor_id);
INSERT INTO public.doctor_departments (doctor_id, department_id, is_primary, display_order)
SELECT id, department_id, true, 0 FROM public.doctors WHERE department_id IS NOT NULL
ON CONFLICT DO NOTHING;

CREATE TABLE public.department_designations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.department_designations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.department_designations TO authenticated;
GRANT ALL ON public.department_designations TO service_role;
ALTER TABLE public.department_designations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "active designations are public" ON public.department_designations FOR SELECT TO anon USING (active);
CREATE POLICY "staff read designations" ON public.department_designations FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "content managers manage designations" ON public.department_designations FOR ALL TO authenticated USING (public.can_manage_content()) WITH CHECK (public.can_manage_content());
CREATE UNIQUE INDEX department_designations_name_unique_idx ON public.department_designations(department_id, lower(name));
CREATE TRIGGER set_department_designations_updated_at BEFORE UPDATE ON public.department_designations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.doctor_designations (
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  designation_id uuid NOT NULL REFERENCES public.department_designations(id) ON DELETE RESTRICT,
  PRIMARY KEY (doctor_id, department_id)
);
GRANT SELECT ON public.doctor_designations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_designations TO authenticated;
GRANT ALL ON public.doctor_designations TO service_role;
ALTER TABLE public.doctor_designations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published doctor designations are public" ON public.doctor_designations FOR SELECT TO anon USING (EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.published));
CREATE POLICY "staff read doctor designations" ON public.doctor_designations FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "content managers manage doctor designations" ON public.doctor_designations FOR ALL TO authenticated USING (public.can_manage_content()) WITH CHECK (public.can_manage_content());
CREATE INDEX doctor_designations_designation_idx ON public.doctor_designations(designation_id);

INSERT INTO public.department_designations (department_id, name)
SELECT DISTINCT department_id, trim(designation) FROM public.doctors
WHERE department_id IS NOT NULL AND trim(coalesce(designation, '')) <> ''
ON CONFLICT DO NOTHING;
INSERT INTO public.doctor_designations (doctor_id, department_id, designation_id)
SELECT d.id, d.department_id, dd.id FROM public.doctors d
JOIN public.department_designations dd ON dd.department_id = d.department_id AND lower(dd.name) = lower(trim(d.designation))
WHERE d.department_id IS NOT NULL AND trim(coalesce(d.designation, '')) <> ''
ON CONFLICT DO NOTHING;

CREATE TABLE public.department_qualifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.department_qualifications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.department_qualifications TO authenticated;
GRANT ALL ON public.department_qualifications TO service_role;
ALTER TABLE public.department_qualifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "active qualifications are public" ON public.department_qualifications FOR SELECT TO anon USING (active);
CREATE POLICY "staff read qualifications" ON public.department_qualifications FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "content managers manage qualifications" ON public.department_qualifications FOR ALL TO authenticated USING (public.can_manage_content()) WITH CHECK (public.can_manage_content());
CREATE UNIQUE INDEX department_qualifications_name_unique_idx ON public.department_qualifications(department_id, lower(name));
CREATE TRIGGER set_department_qualifications_updated_at BEFORE UPDATE ON public.department_qualifications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.doctor_qualifications (
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  qualification_id uuid NOT NULL REFERENCES public.department_qualifications(id) ON DELETE RESTRICT,
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (doctor_id, qualification_id)
);
GRANT SELECT ON public.doctor_qualifications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_qualifications TO authenticated;
GRANT ALL ON public.doctor_qualifications TO service_role;
ALTER TABLE public.doctor_qualifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published doctor qualifications are public" ON public.doctor_qualifications FOR SELECT TO anon USING (EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.published));
CREATE POLICY "staff read doctor qualifications" ON public.doctor_qualifications FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "content managers manage doctor qualifications" ON public.doctor_qualifications FOR ALL TO authenticated USING (public.can_manage_content()) WITH CHECK (public.can_manage_content());
CREATE INDEX doctor_qualifications_qualification_idx ON public.doctor_qualifications(qualification_id);

INSERT INTO public.department_qualifications (department_id, name)
SELECT DISTINCT d.department_id, trim(q.name)
FROM public.doctors d CROSS JOIN LATERAL unnest(d.qualifications) q(name)
WHERE d.department_id IS NOT NULL AND trim(q.name) <> ''
ON CONFLICT DO NOTHING;
INSERT INTO public.doctor_qualifications (doctor_id, qualification_id, department_id, display_order)
SELECT d.id, dq.id, d.department_id, q.ordinality - 1
FROM public.doctors d CROSS JOIN LATERAL unnest(d.qualifications) WITH ORDINALITY q(name, ordinality)
JOIN public.department_qualifications dq ON dq.department_id = d.department_id AND lower(dq.name) = lower(trim(q.name))
WHERE d.department_id IS NOT NULL AND trim(q.name) <> ''
ON CONFLICT DO NOTHING;

CREATE TABLE public.department_specializations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  default_icon_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.department_specializations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.department_specializations TO authenticated;
GRANT ALL ON public.department_specializations TO service_role;
ALTER TABLE public.department_specializations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "active specializations are public" ON public.department_specializations FOR SELECT TO anon USING (active);
CREATE POLICY "staff read specializations" ON public.department_specializations FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "content managers manage specializations" ON public.department_specializations FOR ALL TO authenticated USING (public.can_manage_content()) WITH CHECK (public.can_manage_content());
CREATE UNIQUE INDEX department_specializations_name_unique_idx ON public.department_specializations(department_id, lower(name));
CREATE TRIGGER set_department_specializations_updated_at BEFORE UPDATE ON public.department_specializations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.department_specializations (department_id, name)
SELECT DISTINCT department_id, trim(specialty) FROM public.doctors
WHERE department_id IS NOT NULL AND trim(coalesce(specialty, '')) <> ''
ON CONFLICT DO NOTHING;

ALTER TABLE public.doctor_specializations
  ADD COLUMN specialization_id uuid REFERENCES public.department_specializations(id) ON DELETE RESTRICT,
  ADD COLUMN department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  ADD COLUMN icon_override_url text;
CREATE INDEX doctor_specializations_definition_idx ON public.doctor_specializations(specialization_id);
CREATE INDEX doctor_specializations_department_idx ON public.doctor_specializations(department_id);
COMMENT ON COLUMN public.doctor_specializations.title IS 'Legacy compatibility title; normalized assignments use specialization_id.';
COMMENT ON COLUMN public.doctor_specializations.icon IS 'Legacy compatibility icon; normalized assignments use the definition icon or icon_override_url.';

INSERT INTO public.doctor_specializations (doctor_id, title, description, icon, enabled, display_order, specialization_id, department_id)
SELECT d.id, ds.name, ds.description, ds.default_icon_url, true, 0, ds.id, d.department_id
FROM public.doctors d
JOIN public.department_specializations ds ON ds.department_id = d.department_id AND lower(ds.name) = lower(trim(d.specialty))
WHERE d.department_id IS NOT NULL AND trim(coalesce(d.specialty, '')) <> ''
  AND NOT EXISTS (SELECT 1 FROM public.doctor_specializations existing WHERE existing.doctor_id = d.id AND (existing.specialization_id = ds.id OR lower(existing.title) = lower(ds.name)));

ALTER TABLE public.doctor_statistic_definitions
  ADD COLUMN department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE;
CREATE INDEX doctor_statistic_definitions_department_idx ON public.doctor_statistic_definitions(department_id);
COMMENT ON COLUMN public.doctor_statistic_definitions.department_id IS 'NULL means a generic statistic available to all departments.';

CREATE OR REPLACE FUNCTION public.validate_doctor_department_relationships()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_TABLE_NAME = 'doctor_designations' AND NOT EXISTS (
    SELECT 1 FROM public.department_designations d WHERE d.id = NEW.designation_id AND d.department_id = NEW.department_id
  ) THEN RAISE EXCEPTION 'Designation does not belong to the selected department'; END IF;
  IF TG_TABLE_NAME = 'doctor_qualifications' AND NOT EXISTS (
    SELECT 1 FROM public.department_qualifications q WHERE q.id = NEW.qualification_id AND q.department_id = NEW.department_id
  ) THEN RAISE EXCEPTION 'Qualification does not belong to the selected department'; END IF;
  IF TG_TABLE_NAME = 'doctor_specializations' AND NEW.specialization_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.department_specializations s WHERE s.id = NEW.specialization_id AND s.department_id = NEW.department_id
  ) THEN RAISE EXCEPTION 'Specialization does not belong to the selected department'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_doctor_designation_department BEFORE INSERT OR UPDATE ON public.doctor_designations FOR EACH ROW EXECUTE FUNCTION public.validate_doctor_department_relationships();
CREATE TRIGGER validate_doctor_qualification_department BEFORE INSERT OR UPDATE ON public.doctor_qualifications FOR EACH ROW EXECUTE FUNCTION public.validate_doctor_department_relationships();
CREATE TRIGGER validate_doctor_specialization_department BEFORE INSERT OR UPDATE ON public.doctor_specializations FOR EACH ROW EXECUTE FUNCTION public.validate_doctor_department_relationships();