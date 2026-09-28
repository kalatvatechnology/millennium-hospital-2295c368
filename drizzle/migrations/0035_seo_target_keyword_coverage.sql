-- 1. Document the existing live table (no-op on the live database: it already exists).
CREATE TABLE IF NOT EXISTS public.seo_target_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL,
  normalized text NOT NULL UNIQUE,
  keyword_type text NOT NULL DEFAULT 'general' CHECK (keyword_type = ANY (ARRAY['general','local','service','doctor','department','location','blog','brand'])),
  search_intent text NOT NULL DEFAULT 'informational' CHECK (search_intent = ANY (ARRAY['informational','commercial','local','navigational','transactional'])),
  priority text NOT NULL DEFAULT 'primary' CHECK (priority = ANY (ARRAY['primary','secondary'])),
  target_url text,
  target_entity_type text,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  professional_service_id uuid REFERENCES public.professional_services(id) ON DELETE SET NULL,
  doctor_id uuid REFERENCES public.doctors(id) ON DELETE SET NULL,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  blog_post_id uuid REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'planned' CHECK (status = ANY (ARRAY['planned','active','paused','achieved'])),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS seo_target_keywords_type_idx ON public.seo_target_keywords (keyword_type);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_target_keywords TO authenticated;
GRANT ALL ON public.seo_target_keywords TO service_role;
ALTER TABLE public.seo_target_keywords ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_seo_target_keywords_updated_at') THEN
    CREATE TRIGGER set_seo_target_keywords_updated_at BEFORE UPDATE ON public.seo_target_keywords
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- 2. New primary-target columns.
ALTER TABLE public.seo_target_keywords
  ADD COLUMN IF NOT EXISTS hospital_service_id uuid REFERENCES public.hospital_services(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS website_page_id uuid REFERENCES public.website_pages(id) ON DELETE SET NULL;

-- 3. Primary target types ('page' becomes 'website_page'; table holds no rows using it).
UPDATE public.seo_target_keywords SET target_entity_type = 'website_page' WHERE target_entity_type = 'page';
ALTER TABLE public.seo_target_keywords DROP CONSTRAINT IF EXISTS seo_target_keywords_target_entity_type_check;
ALTER TABLE public.seo_target_keywords ADD CONSTRAINT seo_target_keywords_target_entity_type_check
  CHECK (target_entity_type IS NULL OR target_entity_type = ANY (ARRAY['department','professional_service','hospital_service','doctor','location','website_page','blog_post']));

-- 4. When a primary target record is deleted (ON DELETE SET NULL), clear the type so the row reads as Needs Setup.
CREATE OR REPLACE FUNCTION public.seo_target_clear_deleted_target()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (NEW.target_entity_type = 'department' AND OLD.department_id IS NOT NULL AND NEW.department_id IS NULL)
    OR (NEW.target_entity_type = 'professional_service' AND OLD.professional_service_id IS NOT NULL AND NEW.professional_service_id IS NULL)
    OR (NEW.target_entity_type = 'hospital_service' AND OLD.hospital_service_id IS NOT NULL AND NEW.hospital_service_id IS NULL)
    OR (NEW.target_entity_type = 'doctor' AND OLD.doctor_id IS NOT NULL AND NEW.doctor_id IS NULL)
    OR (NEW.target_entity_type = 'location' AND OLD.location_id IS NOT NULL AND NEW.location_id IS NULL)
    OR (NEW.target_entity_type = 'website_page' AND OLD.website_page_id IS NOT NULL AND NEW.website_page_id IS NULL)
    OR (NEW.target_entity_type = 'blog_post' AND OLD.blog_post_id IS NOT NULL AND NEW.blog_post_id IS NULL) THEN
    NEW.target_entity_type := NULL;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS seo_target_clear_deleted_target ON public.seo_target_keywords;
CREATE TRIGGER seo_target_clear_deleted_target BEFORE UPDATE ON public.seo_target_keywords
  FOR EACH ROW EXECUTE FUNCTION public.seo_target_clear_deleted_target();

-- 5. One consistent primary target; location_id may be separate context.
ALTER TABLE public.seo_target_keywords DROP CONSTRAINT IF EXISTS seo_target_keywords_primary_target_check;
ALTER TABLE public.seo_target_keywords ADD CONSTRAINT seo_target_keywords_primary_target_check CHECK (
  target_entity_type IS NULL OR (
    (target_entity_type = 'department') = (department_id IS NOT NULL)
    AND (target_entity_type = 'professional_service') = (professional_service_id IS NOT NULL)
    AND (target_entity_type = 'hospital_service') = (hospital_service_id IS NOT NULL)
    AND (target_entity_type = 'doctor') = (doctor_id IS NOT NULL)
    AND (target_entity_type = 'website_page') = (website_page_id IS NOT NULL)
    AND (target_entity_type = 'blog_post') = (blog_post_id IS NOT NULL)
    AND (target_entity_type <> 'location' OR location_id IS NOT NULL)
  )
);

-- 6. Indexes for grouping and fast referential actions.
CREATE INDEX IF NOT EXISTS seo_target_keywords_entity_type_idx ON public.seo_target_keywords (target_entity_type);
CREATE INDEX IF NOT EXISTS seo_target_keywords_department_idx ON public.seo_target_keywords (department_id) WHERE department_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS seo_target_keywords_professional_service_idx ON public.seo_target_keywords (professional_service_id) WHERE professional_service_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS seo_target_keywords_hospital_service_idx ON public.seo_target_keywords (hospital_service_id) WHERE hospital_service_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS seo_target_keywords_doctor_idx ON public.seo_target_keywords (doctor_id) WHERE doctor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS seo_target_keywords_location_idx ON public.seo_target_keywords (location_id) WHERE location_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS seo_target_keywords_website_page_idx ON public.seo_target_keywords (website_page_id) WHERE website_page_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS seo_target_keywords_blog_post_idx ON public.seo_target_keywords (blog_post_id) WHERE blog_post_id IS NOT NULL;

-- 7. Permissions matching the CMS: manage = super_admin/admin/editor; read = roles with seo.read.
CREATE OR REPLACE FUNCTION public.can_manage_seo()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('super_admin','admin','editor'))
$$;
CREATE OR REPLACE FUNCTION public.can_read_seo()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('super_admin','admin','editor','writer','doctor'))
$$;
DROP POLICY IF EXISTS "content managers manage seo target keywords" ON public.seo_target_keywords;
DROP POLICY IF EXISTS "staff read seo target keywords" ON public.seo_target_keywords;
DROP POLICY IF EXISTS "seo readers read target keywords" ON public.seo_target_keywords;
DROP POLICY IF EXISTS "seo managers insert target keywords" ON public.seo_target_keywords;
DROP POLICY IF EXISTS "seo managers update target keywords" ON public.seo_target_keywords;
DROP POLICY IF EXISTS "seo managers delete target keywords" ON public.seo_target_keywords;
CREATE POLICY "seo readers read target keywords" ON public.seo_target_keywords FOR SELECT TO authenticated USING (public.can_read_seo());
CREATE POLICY "seo managers insert target keywords" ON public.seo_target_keywords FOR INSERT TO authenticated WITH CHECK (public.can_manage_seo());
CREATE POLICY "seo managers update target keywords" ON public.seo_target_keywords FOR UPDATE TO authenticated USING (public.can_manage_seo()) WITH CHECK (public.can_manage_seo());
CREATE POLICY "seo managers delete target keywords" ON public.seo_target_keywords FOR DELETE TO authenticated USING (public.can_manage_seo());