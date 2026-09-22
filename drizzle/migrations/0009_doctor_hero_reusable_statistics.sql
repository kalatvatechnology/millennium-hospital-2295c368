ALTER TABLE public.doctors
  ADD COLUMN hero_image_position text NOT NULL DEFAULT 'center';

ALTER TABLE public.doctors
  ADD CONSTRAINT doctors_hero_image_position_check
  CHECK (hero_image_position IN ('left', 'center', 'right'));

CREATE TABLE public.doctor_statistic_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  meaning text,
  default_icon_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.doctor_statistic_definitions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_statistic_definitions TO authenticated;
GRANT ALL ON public.doctor_statistic_definitions TO service_role;

ALTER TABLE public.doctor_statistic_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "active statistic definitions are public"
ON public.doctor_statistic_definitions
FOR SELECT TO anon
USING (active);

CREATE POLICY "staff read statistic definitions"
ON public.doctor_statistic_definitions
FOR SELECT TO authenticated
USING (public.is_staff());

CREATE POLICY "content managers manage statistic definitions"
ON public.doctor_statistic_definitions
FOR ALL TO authenticated
USING (public.can_manage_content())
WITH CHECK (public.can_manage_content());

CREATE UNIQUE INDEX doctor_statistic_definitions_name_unique_idx
ON public.doctor_statistic_definitions (lower(name));

CREATE TRIGGER set_doctor_statistic_definitions_updated_at
BEFORE UPDATE ON public.doctor_statistic_definitions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.doctor_statistics
  ADD COLUMN statistic_id uuid REFERENCES public.doctor_statistic_definitions(id) ON DELETE RESTRICT,
  ADD COLUMN icon_override_url text;

INSERT INTO public.doctor_statistic_definitions (name, meaning, default_icon_url, active)
SELECT DISTINCT ON (lower(trim(label)))
  trim(label),
  NULL,
  icon,
  true
FROM public.doctor_statistics
WHERE trim(label) <> ''
ORDER BY lower(trim(label)), created_at;

UPDATE public.doctor_statistics AS assignment
SET statistic_id = definition.id
FROM public.doctor_statistic_definitions AS definition
WHERE lower(trim(assignment.label)) = lower(definition.name)
  AND assignment.statistic_id IS NULL;

CREATE INDEX doctor_statistics_statistic_idx
ON public.doctor_statistics(statistic_id);

COMMENT ON COLUMN public.doctor_statistics.label IS 'Legacy compatibility label; reusable assignments use statistic_id.';
COMMENT ON COLUMN public.doctor_statistics.icon IS 'Legacy compatibility icon; reusable assignments use the definition icon or icon_override_url.';