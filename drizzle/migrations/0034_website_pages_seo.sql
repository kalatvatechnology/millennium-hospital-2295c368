ALTER TABLE public.website_pages
  ADD COLUMN IF NOT EXISTS canonical_url text,
  ADD COLUMN IF NOT EXISTS og_title text,
  ADD COLUMN IF NOT EXISTS og_description text,
  ADD COLUMN IF NOT EXISTS og_media_id uuid REFERENCES public.media_items(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS robots_index boolean NOT NULL DEFAULT true;

INSERT INTO public.website_pages (slug, title, meta_title, meta_description, status, display_order)
SELECT 'faq', 'FAQ', 'Frequently asked questions | The Millennium Hospital',
       'Answers to common questions about visiting The Millennium Hospital.', 'published', 30
WHERE NOT EXISTS (SELECT 1 FROM public.website_pages WHERE slug = 'faq');

-- Clear message when a Media & Content asset is still the share image of a website page.
CREATE OR REPLACE FUNCTION public.block_delete_media_used_by_pages()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _pages text;
BEGIN
  SELECT string_agg(title, ', ') INTO _pages FROM public.website_pages WHERE og_media_id = OLD.id;
  IF _pages IS NOT NULL THEN
    RAISE EXCEPTION 'This image is used as the social sharing image of website page(s): %. Remove it there first.', _pages;
  END IF;
  RETURN OLD;
END $$;

DROP TRIGGER IF EXISTS block_delete_media_used_by_pages ON public.media_items;
CREATE TRIGGER block_delete_media_used_by_pages BEFORE DELETE ON public.media_items
FOR EACH ROW EXECUTE FUNCTION public.block_delete_media_used_by_pages();