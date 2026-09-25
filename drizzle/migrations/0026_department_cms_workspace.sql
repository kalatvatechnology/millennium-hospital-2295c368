ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS page_draft jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS page_published jsonb;
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS page_draft_saved_at timestamptz;
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS page_published_at timestamptz;
COMMENT ON COLUMN public.departments.page_draft IS 'Department CMS draft page content (sections, SEO). Not public.';
COMMENT ON COLUMN public.departments.page_published IS 'Department CMS published page content. Copied from page_draft on publish.';

ALTER TABLE public.media_departments ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.department_faqs (
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  faq_id uuid NOT NULL REFERENCES public.faqs(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (department_id, faq_id)
);
CREATE INDEX IF NOT EXISTS department_faqs_faq_idx ON public.department_faqs(faq_id);
GRANT SELECT ON public.department_faqs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.department_faqs TO authenticated;
GRANT ALL ON public.department_faqs TO service_role;
ALTER TABLE public.department_faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content managers manage department faqs" ON public.department_faqs FOR ALL TO authenticated
  USING (public.can_manage_content()) WITH CHECK (public.can_manage_content());
CREATE POLICY "staff read department faqs" ON public.department_faqs FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "published department faqs are public" ON public.department_faqs FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.departments d WHERE d.id = department_id AND d.published)
     AND EXISTS (SELECT 1 FROM public.faqs f WHERE f.id = faq_id AND f.published));

CREATE OR REPLACE FUNCTION public.enforce_department_publish_authority()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
begin
  if (tg_op = 'INSERT' and new.published)
     or (tg_op = 'UPDATE' and (new.published is distinct from old.published
         or new.page_published is distinct from old.page_published)) then
    if not public.can_publish() then
      raise exception 'You do not have permission to publish departments';
    end if;
  end if;
  return new;
end $$;
DROP TRIGGER IF EXISTS departments_publish_authority ON public.departments;
CREATE TRIGGER departments_publish_authority BEFORE INSERT OR UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_department_publish_authority();