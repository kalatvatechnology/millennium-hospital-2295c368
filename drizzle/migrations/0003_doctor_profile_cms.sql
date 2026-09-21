ALTER TABLE public.doctors
  ADD COLUMN short_introduction text,
  ADD COLUMN hero_image_url text,
  ADD COLUMN hero_image_alt text,
  ADD COLUMN profile_image_alt text,
  ADD COLUMN quote text,
  ADD COLUMN quote_attribution text,
  ADD COLUMN phone_number text,
  ADD COLUMN seo_title text,
  ADD COLUMN seo_description text,
  ADD COLUMN canonical_url text,
  ADD COLUMN og_image_url text,
  ADD COLUMN section_visibility jsonb NOT NULL DEFAULT '{"statistics":true,"quote":true,"specializations":true,"services":true,"experience":true,"education":true,"achievements":true,"locations":true,"media":true,"reviews":true,"faqs":true}'::jsonb;

CREATE TABLE public.doctor_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  value text NOT NULL,
  label text NOT NULL,
  icon text,
  enabled boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.doctor_statistics TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_statistics TO authenticated;
GRANT ALL ON public.doctor_statistics TO service_role;
ALTER TABLE public.doctor_statistics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published doctor statistics are public" ON public.doctor_statistics FOR SELECT TO anon USING (enabled AND EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.published));
CREATE POLICY "staff read doctor statistics" ON public.doctor_statistics FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "content managers manage doctor statistics" ON public.doctor_statistics FOR ALL TO authenticated USING (public.can_manage_content()) WITH CHECK (public.can_manage_content());
CREATE INDEX doctor_statistics_doctor_order_idx ON public.doctor_statistics(doctor_id, display_order);

CREATE TABLE public.doctor_specializations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  icon text,
  professional_service_id uuid REFERENCES public.professional_services(id) ON DELETE SET NULL,
  enabled boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.doctor_specializations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_specializations TO authenticated;
GRANT ALL ON public.doctor_specializations TO service_role;
ALTER TABLE public.doctor_specializations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published doctor specializations are public" ON public.doctor_specializations FOR SELECT TO anon USING (enabled AND EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.published));
CREATE POLICY "staff read doctor specializations" ON public.doctor_specializations FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "content managers manage doctor specializations" ON public.doctor_specializations FOR ALL TO authenticated USING (public.can_manage_content()) WITH CHECK (public.can_manage_content());
CREATE INDEX doctor_specializations_doctor_order_idx ON public.doctor_specializations(doctor_id, display_order);

CREATE TABLE public.doctor_experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  organization text NOT NULL,
  position text,
  start_year integer,
  end_year integer,
  is_present boolean NOT NULL DEFAULT false,
  description text,
  enabled boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.doctor_experience TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_experience TO authenticated;
GRANT ALL ON public.doctor_experience TO service_role;
ALTER TABLE public.doctor_experience ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published doctor experience is public" ON public.doctor_experience FOR SELECT TO anon USING (enabled AND EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.published));
CREATE POLICY "staff read doctor experience" ON public.doctor_experience FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "content managers manage doctor experience" ON public.doctor_experience FOR ALL TO authenticated USING (public.can_manage_content()) WITH CHECK (public.can_manage_content());
CREATE INDEX doctor_experience_doctor_order_idx ON public.doctor_experience(doctor_id, display_order);

CREATE TABLE public.doctor_education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  qualification text NOT NULL,
  institution text,
  year integer,
  description text,
  enabled boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.doctor_education TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_education TO authenticated;
GRANT ALL ON public.doctor_education TO service_role;
ALTER TABLE public.doctor_education ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published doctor education is public" ON public.doctor_education FOR SELECT TO anon USING (enabled AND EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.published));
CREATE POLICY "staff read doctor education" ON public.doctor_education FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "content managers manage doctor education" ON public.doctor_education FOR ALL TO authenticated USING (public.can_manage_content()) WITH CHECK (public.can_manage_content());
CREATE INDEX doctor_education_doctor_order_idx ON public.doctor_education(doctor_id, display_order);

CREATE TABLE public.doctor_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  achievement_type text NOT NULL,
  title text NOT NULL,
  organization text,
  year integer,
  description text,
  enabled boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.doctor_achievements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_achievements TO authenticated;
GRANT ALL ON public.doctor_achievements TO service_role;
ALTER TABLE public.doctor_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published doctor achievements are public" ON public.doctor_achievements FOR SELECT TO anon USING (enabled AND EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.published));
CREATE POLICY "staff read doctor achievements" ON public.doctor_achievements FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "content managers manage doctor achievements" ON public.doctor_achievements FOR ALL TO authenticated USING (public.can_manage_content()) WITH CHECK (public.can_manage_content());
CREATE INDEX doctor_achievements_doctor_order_idx ON public.doctor_achievements(doctor_id, display_order);

CREATE TABLE public.doctor_locations (
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  consultation_availability text,
  enabled boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (doctor_id, location_id)
);
GRANT SELECT ON public.doctor_locations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_locations TO authenticated;
GRANT ALL ON public.doctor_locations TO service_role;
ALTER TABLE public.doctor_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published doctor locations are public" ON public.doctor_locations FOR SELECT TO anon USING (enabled AND EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.published) AND EXISTS (SELECT 1 FROM public.locations l WHERE l.id = location_id AND l.published));
CREATE POLICY "staff read doctor locations" ON public.doctor_locations FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "content managers manage doctor locations" ON public.doctor_locations FOR ALL TO authenticated USING (public.can_manage_content()) WITH CHECK (public.can_manage_content());
CREATE INDEX doctor_locations_doctor_order_idx ON public.doctor_locations(doctor_id, display_order);

CREATE TABLE public.doctor_faqs (
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  faq_id uuid NOT NULL REFERENCES public.faqs(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (doctor_id, faq_id)
);
GRANT SELECT ON public.doctor_faqs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_faqs TO authenticated;
GRANT ALL ON public.doctor_faqs TO service_role;
ALTER TABLE public.doctor_faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published doctor faqs are public" ON public.doctor_faqs FOR SELECT TO anon USING (enabled AND EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.published) AND EXISTS (SELECT 1 FROM public.faqs f WHERE f.id = faq_id AND f.published));
CREATE POLICY "staff read doctor faqs" ON public.doctor_faqs FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "content managers manage doctor faqs" ON public.doctor_faqs FOR ALL TO authenticated USING (public.can_manage_content()) WITH CHECK (public.can_manage_content());
CREATE INDEX doctor_faqs_doctor_order_idx ON public.doctor_faqs(doctor_id, display_order);

ALTER TABLE public.media_doctors
  ADD COLUMN show_on_profile boolean NOT NULL DEFAULT true,
  ADD COLUMN enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN display_order integer NOT NULL DEFAULT 0;

CREATE INDEX media_doctors_doctor_order_idx ON public.media_doctors(doctor_id, display_order);

CREATE TRIGGER set_doctor_statistics_updated_at BEFORE UPDATE ON public.doctor_statistics FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_doctor_specializations_updated_at BEFORE UPDATE ON public.doctor_specializations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_doctor_experience_updated_at BEFORE UPDATE ON public.doctor_experience FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_doctor_education_updated_at BEFORE UPDATE ON public.doctor_education FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_doctor_achievements_updated_at BEFORE UPDATE ON public.doctor_achievements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();