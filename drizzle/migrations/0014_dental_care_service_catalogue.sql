CREATE TABLE IF NOT EXISTS public.individual_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.individual_services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.individual_services TO authenticated;
GRANT ALL ON public.individual_services TO service_role;
ALTER TABLE public.individual_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "active individual services are public" ON public.individual_services;
CREATE POLICY "active individual services are public" ON public.individual_services FOR SELECT TO anon USING (active);
DROP POLICY IF EXISTS "staff read individual services" ON public.individual_services;
CREATE POLICY "staff read individual services" ON public.individual_services FOR SELECT TO authenticated USING (public.is_staff());
DROP POLICY IF EXISTS "content managers manage individual services" ON public.individual_services;
CREATE POLICY "content managers manage individual services" ON public.individual_services FOR ALL TO authenticated USING (public.can_manage_content()) WITH CHECK (public.can_manage_content());
CREATE UNIQUE INDEX IF NOT EXISTS individual_services_title_unique_idx ON public.individual_services(lower(title));
DROP TRIGGER IF EXISTS set_individual_services_updated_at ON public.individual_services;
CREATE TRIGGER set_individual_services_updated_at BEFORE UPDATE ON public.individual_services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.professional_service_items (
  professional_service_id uuid NOT NULL REFERENCES public.professional_services(id) ON DELETE CASCADE,
  individual_service_id uuid NOT NULL REFERENCES public.individual_services(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (professional_service_id, individual_service_id)
);
GRANT SELECT ON public.professional_service_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_service_items TO authenticated;
GRANT ALL ON public.professional_service_items TO service_role;
ALTER TABLE public.professional_service_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service items are public" ON public.professional_service_items;
CREATE POLICY "service items are public" ON public.professional_service_items FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "staff read service items" ON public.professional_service_items;
CREATE POLICY "staff read service items" ON public.professional_service_items FOR SELECT TO authenticated USING (public.is_staff());
DROP POLICY IF EXISTS "content managers manage service items" ON public.professional_service_items;
CREATE POLICY "content managers manage service items" ON public.professional_service_items FOR ALL TO authenticated USING (public.can_manage_content()) WITH CHECK (public.can_manage_content());
CREATE INDEX IF NOT EXISTS professional_service_items_item_idx ON public.professional_service_items(individual_service_id);

CREATE TABLE IF NOT EXISTS public.doctor_service_items (
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  professional_service_id uuid NOT NULL,
  individual_service_id uuid NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (doctor_id, professional_service_id, individual_service_id),
  FOREIGN KEY (professional_service_id, individual_service_id)
    REFERENCES public.professional_service_items(professional_service_id, individual_service_id) ON DELETE CASCADE
);
GRANT SELECT ON public.doctor_service_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_service_items TO authenticated;
GRANT ALL ON public.doctor_service_items TO service_role;
ALTER TABLE public.doctor_service_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "published doctor service items are public" ON public.doctor_service_items;
CREATE POLICY "published doctor service items are public" ON public.doctor_service_items FOR SELECT TO anon USING (EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.published));
DROP POLICY IF EXISTS "staff read doctor service items" ON public.doctor_service_items;
CREATE POLICY "staff read doctor service items" ON public.doctor_service_items FOR SELECT TO authenticated USING (public.is_staff());
DROP POLICY IF EXISTS "content managers manage doctor service items" ON public.doctor_service_items;
CREATE POLICY "content managers manage doctor service items" ON public.doctor_service_items FOR ALL TO authenticated USING (public.can_manage_content()) WITH CHECK (public.can_manage_content());
CREATE INDEX IF NOT EXISTS doctor_service_items_service_idx ON public.doctor_service_items(professional_service_id);

CREATE OR REPLACE FUNCTION public.slugify_label(value text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT trim(both '-' from regexp_replace(lower(replace(value, '&', ' and ')), '[^a-z0-9]+', '-', 'g'))
$$;

CREATE TEMP TABLE dental_catalogue (main text, display_order int, items text[]) ON COMMIT DROP;
INSERT INTO dental_catalogue (main, display_order, items) VALUES
  ('General & Preventive Dentistry', 1, ARRAY['Comprehensive Dental Consultation','Routine Dental Check-up','Preventive Dental Care','Professional Teeth Cleaning','Scaling & Polishing','Fluoride Treatment','Dental Sealants','Oral Hygiene Counseling','Dental X-ray & Imaging','Emergency Dental Care']),
  ('Restorative Dentistry', 2, ARRAY['Dental Fillings','Tooth-Colored Fillings','Dental Inlays & Onlays','Dental Crowns','Dental Bridges','Tooth Restoration','Root Canal Treatment','Root Canal Retreatment','Post & Core Restoration']),
  ('Cosmetic & Aesthetic Dentistry', 3, ARRAY['Teeth Whitening','Smile Design','Smile Makeover','Dental Veneers','Composite Veneers','Ceramic Veneers','Tooth Bonding','Cosmetic Dental Contouring','Aesthetic Dental Rehabilitation']),
  ('Prosthodontics & Full Mouth Rehabilitation', 4, ARRAY['Removable Partial Dentures','Complete Dentures','Fixed Prosthodontics','Implant-Supported Dentures','Full Mouth Rehabilitation','Full Mouth Reconstruction','Maxillofacial Prosthodontics','Occlusal Rehabilitation']),
  ('Dental Implant Services', 5, ARRAY['Dental Implants','Single-Tooth Implants','Multiple Dental Implants','Full-Arch Dental Implants','Implant-Supported Bridges','Implant-Supported Dentures','Immediate Implant Placement','Implant Restoration','Implant Prosthodontics','Advanced Implantology']),
  ('Orthodontics', 6, ARRAY['Orthodontic Consultation','Metal Braces','Ceramic Braces','Self-Ligating Braces','Clear Aligners','Invisible Braces','Retainers','Interceptive Orthodontics','Adult Orthodontics','Complex Orthodontic Treatment']),
  ('Periodontics & Gum Care', 7, ARRAY['Gum Disease Treatment','Gingivitis Treatment','Periodontitis Treatment','Deep Cleaning / Root Planing','Gum Surgery','Gum Grafting','Crown Lengthening','Periodontal Regeneration','Gum Depigmentation','Laser Gum Treatment']),
  ('Oral & Maxillofacial Surgery', 8, ARRAY['Wisdom Tooth Removal','Surgical Tooth Extraction','Complex Tooth Extraction','Impacted Tooth Removal','Dental Cyst Removal','Oral Biopsy','Minor Oral Surgery','Pre-Prosthetic Surgery','Bone Grafting','Sinus Lift','Alveolar Bone Preservation','Oral & Maxillofacial Surgical Procedures']),
  ('Pediatric Dentistry', 9, ARRAY['Children''s Dental Consultation','Preventive Pediatric Dentistry','Children''s Dental Cleaning','Fluoride Treatment for Children','Dental Sealants for Children','Pediatric Dental Fillings','Pediatric Root Canal Treatment','Space Maintainers','Early Orthodontic Assessment','Dental Trauma Management for Children']),
  ('Endodontics', 10, ARRAY['Root Canal Treatment','Single-Sitting Root Canal Treatment','Root Canal Retreatment','Complex Root Canal Treatment','Microscopic Root Canal Treatment','Management of Dental Trauma','Treatment of Dental Abscess']),
  ('Oral Medicine, Diagnosis & Radiology', 11, ARRAY['Oral Medicine Consultation','Oral Lesion Assessment','Oral Cancer Screening','TMJ Disorder Assessment','Orofacial Pain Management','Digital Dental X-rays','Intraoral Imaging','Panoramic Dental Imaging','Cephalometric Imaging','CBCT Dental Imaging']),
  ('TMJ, Occlusion & Orofacial Pain', 12, ARRAY['TMJ Disorder Treatment','TMD Evaluation','Occlusal Assessment','Bite Analysis','Night Guards','Occlusal Splints','Bruxism Management','Orofacial Pain Management']),
  ('Specialised & Advanced Dentistry', 13, ARRAY['Laser Dentistry','Digital Dentistry','CAD/CAM Dentistry','Same-Day Digital Dentistry','Sedation Dentistry','Special Care Dentistry','Geriatric Dentistry','Dental Trauma Management','Sleep Dentistry / Dental Sleep Medicine']);

CREATE TEMP TABLE dental_children ON COMMIT DROP AS
SELECT public.slugify_label(c.main) AS main_slug,
       i.title,
       public.slugify_label(i.title) AS slug,
       i.ord::int AS ord
FROM dental_catalogue c, unnest(c.items) WITH ORDINALITY AS i(title, ord);

INSERT INTO public.professional_services (title, slug, published, display_order)
SELECT main, public.slugify_label(main), false, display_order FROM dental_catalogue
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.professional_service_departments (professional_service_id, department_id)
SELECT ps.id, '5f10e403-ff70-44c7-8f36-eb330d4ea142'::uuid
FROM public.professional_services ps
JOIN dental_catalogue c ON public.slugify_label(c.main) = ps.slug
ON CONFLICT DO NOTHING;

INSERT INTO public.individual_services (title, slug)
SELECT DISTINCT ON (slug) title, slug FROM dental_children
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.professional_service_items (professional_service_id, individual_service_id, display_order)
SELECT ps.id, i.id, ch.ord
FROM dental_children ch
JOIN public.professional_services ps ON ps.slug = ch.main_slug
JOIN public.individual_services i ON i.slug = ch.slug
ON CONFLICT DO NOTHING;