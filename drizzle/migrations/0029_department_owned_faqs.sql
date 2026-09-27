ALTER TABLE public.faqs ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS faqs_department_id_idx ON public.faqs(department_id);
COMMENT ON COLUMN public.faqs.department_id IS 'Owning department. NULL = hospital-wide FAQ (CMS > FAQs); set = department-specific FAQ managed in that Department workspace.';