ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS body_document jsonb NOT NULL DEFAULT '{"type":"doc","content":[]}'::jsonb,
  ADD COLUMN IF NOT EXISTS featured_image_alt text,
  ADD COLUMN IF NOT EXISTS featured_image_caption text,
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS canonical_url text,
  ADD COLUMN IF NOT EXISTS focus_topic text,
  ADD COLUMN IF NOT EXISTS related_keywords text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS search_intent text,
  ADD COLUMN IF NOT EXISTS robots_index boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS og_title text,
  ADD COLUMN IF NOT EXISTS og_description text,
  ADD COLUMN IF NOT EXISTS og_image_url text,
  ADD COLUMN IF NOT EXISTS visualizations jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS engagement_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS comments_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE public.doctor_achievements
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS image_alt text;

ALTER TABLE public.doctor_locations
  ADD COLUMN IF NOT EXISTS public_name text,
  ADD COLUMN IF NOT EXISTS map_url text;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'hospital_google',
  ADD COLUMN IF NOT EXISTS source_url text;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_source_type_check CHECK (source_type IN ('hospital_google', 'doctor_google', 'other')) NOT VALID;

CREATE TABLE public.doctor_social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  platform text NOT NULL,
  url text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT doctor_social_links_platform_check CHECK (platform IN ('instagram','facebook','linkedin','youtube','x','other'))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_social_links TO authenticated;
GRANT SELECT ON public.doctor_social_links TO anon;
GRANT ALL ON public.doctor_social_links TO service_role;
ALTER TABLE public.doctor_social_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published doctor social links are public" ON public.doctor_social_links FOR SELECT TO anon USING (enabled AND EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_social_links.doctor_id AND d.published));
CREATE POLICY "staff read doctor social links" ON public.doctor_social_links FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "content managers manage doctor social links" ON public.doctor_social_links FOR ALL TO authenticated USING (public.can_manage_content()) WITH CHECK (public.can_manage_content());
CREATE INDEX doctor_social_links_doctor_order_idx ON public.doctor_social_links(doctor_id, display_order);
CREATE TRIGGER set_doctor_social_links_updated_at BEFORE UPDATE ON public.doctor_social_links FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.doctor_review_selections (
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (doctor_id, review_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_review_selections TO authenticated;
GRANT SELECT ON public.doctor_review_selections TO anon;
GRANT ALL ON public.doctor_review_selections TO service_role;
ALTER TABLE public.doctor_review_selections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published selected doctor reviews are public" ON public.doctor_review_selections FOR SELECT TO anon USING (enabled AND EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_review_selections.doctor_id AND d.published) AND EXISTS (SELECT 1 FROM public.reviews r WHERE r.id = doctor_review_selections.review_id AND r.show_publicly));
CREATE POLICY "staff read selected doctor reviews" ON public.doctor_review_selections FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "content managers manage selected doctor reviews" ON public.doctor_review_selections FOR ALL TO authenticated USING (public.can_manage_content()) WITH CHECK (public.can_manage_content());
CREATE INDEX doctor_review_selections_order_idx ON public.doctor_review_selections(doctor_id, display_order);

CREATE TABLE public.blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','hidden')),
  moderated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  moderated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_comments TO authenticated;
GRANT SELECT ON public.blog_comments TO anon;
GRANT ALL ON public.blog_comments TO service_role;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approved blog comments are public" ON public.blog_comments FOR SELECT TO anon, authenticated USING (status = 'approved' AND EXISTS (SELECT 1 FROM public.blog_posts p WHERE p.id = blog_comments.post_id AND p.status = 'published'));
CREATE POLICY "signed in readers submit own comments" ON public.blog_comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() AND status = 'pending' AND moderated_by IS NULL AND moderated_at IS NULL);
CREATE POLICY "content managers read comments" ON public.blog_comments FOR SELECT TO authenticated USING (public.can_manage_content());
CREATE POLICY "content managers moderate comments" ON public.blog_comments FOR UPDATE TO authenticated USING (public.can_manage_content()) WITH CHECK (public.can_manage_content());
CREATE POLICY "admins delete comments" ON public.blog_comments FOR DELETE TO authenticated USING (public.is_admin());
CREATE INDEX blog_comments_post_status_created_idx ON public.blog_comments(post_id, status, created_at DESC);
CREATE TRIGGER set_blog_comments_updated_at BEFORE UPDATE ON public.blog_comments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.blog_likes (
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.blog_likes TO authenticated;
GRANT SELECT ON public.blog_likes TO anon;
GRANT ALL ON public.blog_likes TO service_role;
ALTER TABLE public.blog_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blog likes are publicly countable" ON public.blog_likes FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.blog_posts p WHERE p.id = blog_likes.post_id AND p.status = 'published'));
CREATE POLICY "signed in readers manage own likes" ON public.blog_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "signed in readers remove own likes" ON public.blog_likes FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX blog_likes_post_idx ON public.blog_likes(post_id);

CREATE OR REPLACE FUNCTION public.enforce_blog_publish_authority()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published') AND NOT public.can_publish() THEN
    RAISE EXCEPTION 'You do not have permission to publish content';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_publish_blog_posts ON public.blog_posts;
CREATE TRIGGER enforce_publish_blog_posts BEFORE INSERT OR UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.enforce_blog_publish_authority();

COMMENT ON COLUMN public.blog_posts.body_document IS 'Structured rich-text document; legacy body remains readable during migration.';
COMMENT ON TABLE public.blog_comments IS 'Authenticated submissions only; public reads are limited to approved comments.';
COMMENT ON TABLE public.blog_likes IS 'One authenticated like per reader and article.';