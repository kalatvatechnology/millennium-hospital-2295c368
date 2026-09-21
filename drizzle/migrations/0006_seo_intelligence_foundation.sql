CREATE TABLE IF NOT EXISTS public.seo_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  pages_scanned integer NOT NULL DEFAULT 0,
  keywords_detected integer NOT NULL DEFAULT 0,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_scans TO authenticated;
GRANT ALL ON public.seo_scans TO service_role;
ALTER TABLE public.seo_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read seo scans" ON public.seo_scans FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "content managers manage seo scans" ON public.seo_scans FOR ALL TO authenticated USING (public.can_manage_content()) WITH CHECK (public.can_manage_content());
CREATE INDEX IF NOT EXISTS seo_scans_started_idx ON public.seo_scans(started_at DESC);

CREATE TABLE IF NOT EXISTS public.seo_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL,
  normalized text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT 'general'
    CHECK (category IN ('general','local','service','doctor','department','location','blog','brand')),
  usage_count integer NOT NULL DEFAULT 0,
  page_count integer NOT NULL DEFAULT 0,
  word_count integer NOT NULL DEFAULT 1,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_scanned_at timestamptz NOT NULL DEFAULT now(),
  scan_id uuid REFERENCES public.seo_scans(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_keywords TO authenticated;
GRANT ALL ON public.seo_keywords TO service_role;
ALTER TABLE public.seo_keywords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read seo keywords" ON public.seo_keywords FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "content managers manage seo keywords" ON public.seo_keywords FOR ALL TO authenticated USING (public.can_manage_content()) WITH CHECK (public.can_manage_content());
CREATE INDEX IF NOT EXISTS seo_keywords_usage_idx ON public.seo_keywords(usage_count DESC);
CREATE INDEX IF NOT EXISTS seo_keywords_category_idx ON public.seo_keywords(category);
CREATE TRIGGER set_seo_keywords_updated_at BEFORE UPDATE ON public.seo_keywords FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.seo_keyword_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id uuid NOT NULL REFERENCES public.seo_keywords(id) ON DELETE CASCADE,
  entity_type text NOT NULL
    CHECK (entity_type IN ('page','department','professional_service','hospital_service','doctor','location','blog_post','faq')),
  entity_id uuid,
  entity_label text NOT NULL,
  entity_path text,
  field text NOT NULL,
  occurrences integer NOT NULL DEFAULT 1,
  scan_id uuid REFERENCES public.seo_scans(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_keyword_usage TO authenticated;
GRANT ALL ON public.seo_keyword_usage TO service_role;
ALTER TABLE public.seo_keyword_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read seo keyword usage" ON public.seo_keyword_usage FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "content managers manage seo keyword usage" ON public.seo_keyword_usage FOR ALL TO authenticated USING (public.can_manage_content()) WITH CHECK (public.can_manage_content());
CREATE INDEX IF NOT EXISTS seo_keyword_usage_keyword_idx ON public.seo_keyword_usage(keyword_id);
CREATE INDEX IF NOT EXISTS seo_keyword_usage_entity_idx ON public.seo_keyword_usage(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS public.seo_target_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL,
  normalized text NOT NULL UNIQUE,
  keyword_type text NOT NULL DEFAULT 'general'
    CHECK (keyword_type IN ('general','local','service','doctor','department','location','blog','brand')),
  search_intent text NOT NULL DEFAULT 'informational'
    CHECK (search_intent IN ('informational','commercial','local','navigational','transactional')),
  priority text NOT NULL DEFAULT 'primary' CHECK (priority IN ('primary','secondary')),
  target_url text,
  target_entity_type text
    CHECK (target_entity_type IS NULL OR target_entity_type IN ('page','department','professional_service','hospital_service','doctor','location','blog_post')),
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  professional_service_id uuid REFERENCES public.professional_services(id) ON DELETE SET NULL,
  doctor_id uuid REFERENCES public.doctors(id) ON DELETE SET NULL,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  blog_post_id uuid REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','active','paused','achieved')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_target_keywords TO authenticated;
GRANT ALL ON public.seo_target_keywords TO service_role;
ALTER TABLE public.seo_target_keywords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read seo target keywords" ON public.seo_target_keywords FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "content managers manage seo target keywords" ON public.seo_target_keywords FOR ALL TO authenticated USING (public.can_manage_content()) WITH CHECK (public.can_manage_content());
CREATE INDEX IF NOT EXISTS seo_target_keywords_type_idx ON public.seo_target_keywords(keyword_type);
CREATE TRIGGER set_seo_target_keywords_updated_at BEFORE UPDATE ON public.seo_target_keywords FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.seo_data_sources (
  key text PRIMARY KEY,
  label text NOT NULL,
  status text NOT NULL DEFAULT 'not_connected' CHECK (status IN ('not_connected','connected','error')),
  last_synced_at timestamptz,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.seo_data_sources TO authenticated;
GRANT ALL ON public.seo_data_sources TO service_role;
ALTER TABLE public.seo_data_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read seo data sources" ON public.seo_data_sources FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "admins manage seo data sources" ON public.seo_data_sources FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER set_seo_data_sources_updated_at BEFORE UPDATE ON public.seo_data_sources FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.seo_data_sources (key, label, notes) VALUES
  ('google_search_console', 'Google Search Console', 'Connect to view Google Search performance.'),
  ('google_analytics_4', 'Google Analytics 4', 'Connect to view website traffic and engagement.'),
  ('google_business_profile', 'Google Business Profile', 'Connect to view local business information.'),
  ('keyword_rank_tracking', 'Keyword rank tracking', 'Connect a keyword data provider to view rankings.')
ON CONFLICT (key) DO NOTHING;