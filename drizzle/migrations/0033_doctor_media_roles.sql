-- Doctor media roles on the existing media_doctors relationship (no new media table).
ALTER TABLE public.media_doctors ADD COLUMN usage text NOT NULL DEFAULT 'gallery';
ALTER TABLE public.media_doctors ADD CONSTRAINT media_doctors_usage_check
  CHECK (usage IN ('gallery','profile_image','hero_image','hero_background_image','og_image'));
ALTER TABLE public.media_doctors DROP CONSTRAINT media_doctors_pkey;
ALTER TABLE public.media_doctors ADD CONSTRAINT media_doctors_pkey PRIMARY KEY (media_id, doctor_id, usage);
CREATE UNIQUE INDEX media_doctors_one_asset_per_role
  ON public.media_doctors (doctor_id, usage) WHERE usage <> 'gallery';
COMMENT ON COLUMN public.media_doctors.usage IS
  'gallery = profile media list; other values = the doctor image role this asset fills (doctors.* URL columns are kept in sync by trigger).';

CREATE OR REPLACE FUNCTION public.media_image_src(_m public.media_items)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT coalesce(nullif(_m.thumbnail_url, ''), nullif(_m.url, ''))
$$;

-- Keep the doctor's rendered URL column in step with its role connection.
CREATE OR REPLACE FUNCTION public.sync_doctor_media_role()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE r record; src text; alt text;
BEGIN
  IF TG_OP IN ('DELETE','UPDATE') AND OLD.usage <> 'gallery' THEN
    IF TG_OP = 'DELETE' OR OLD.usage <> NEW.usage OR OLD.doctor_id <> NEW.doctor_id OR OLD.media_id <> NEW.media_id THEN
      IF NOT EXISTS (SELECT 1 FROM media_doctors x WHERE x.doctor_id = OLD.doctor_id AND x.usage = OLD.usage) THEN
        UPDATE doctors SET
          photo_url = CASE WHEN OLD.usage = 'profile_image' THEN NULL ELSE photo_url END,
          hero_image_url = CASE WHEN OLD.usage = 'hero_image' THEN NULL ELSE hero_image_url END,
          hero_background_image_url = CASE WHEN OLD.usage = 'hero_background_image' THEN NULL ELSE hero_background_image_url END,
          og_image_url = CASE WHEN OLD.usage = 'og_image' THEN NULL ELSE og_image_url END
        WHERE id = OLD.doctor_id;
      END IF;
    END IF;
  END IF;
  IF TG_OP IN ('INSERT','UPDATE') AND NEW.usage <> 'gallery' THEN
    SELECT public.media_image_src(m) AS s, m.alt_text AS a INTO r FROM media_items m WHERE m.id = NEW.media_id;
    src := r.s; alt := nullif(r.a, '');
    UPDATE doctors SET
      photo_url = CASE WHEN NEW.usage = 'profile_image' THEN src ELSE photo_url END,
      profile_image_alt = CASE WHEN NEW.usage = 'profile_image' THEN coalesce(alt, profile_image_alt) ELSE profile_image_alt END,
      hero_image_url = CASE WHEN NEW.usage = 'hero_image' THEN src ELSE hero_image_url END,
      hero_image_alt = CASE WHEN NEW.usage = 'hero_image' THEN coalesce(alt, hero_image_alt) ELSE hero_image_alt END,
      hero_background_image_url = CASE WHEN NEW.usage = 'hero_background_image' THEN src ELSE hero_background_image_url END,
      hero_background_image_alt = CASE WHEN NEW.usage = 'hero_background_image' THEN coalesce(alt, hero_background_image_alt) ELSE hero_background_image_alt END,
      og_image_url = CASE WHEN NEW.usage = 'og_image' THEN src ELSE og_image_url END
    WHERE id = NEW.doctor_id
      AND (CASE NEW.usage WHEN 'profile_image' THEN photo_url WHEN 'hero_image' THEN hero_image_url
             WHEN 'hero_background_image' THEN hero_background_image_url ELSE og_image_url END) IS DISTINCT FROM src
       OR (id = NEW.doctor_id AND alt IS NOT NULL);
  END IF;
  RETURN NULL;
END $$;

CREATE TRIGGER media_doctors_sync_role
AFTER INSERT OR UPDATE OR DELETE ON public.media_doctors
FOR EACH ROW EXECUTE FUNCTION public.sync_doctor_media_role();

-- When a connected asset's image or alt text changes in Media & Content, doctors follow.
CREATE OR REPLACE FUNCTION public.propagate_media_to_doctors()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE src text := public.media_image_src(NEW); alt text := nullif(NEW.alt_text, '');
BEGIN
  IF public.media_image_src(OLD) IS NOT DISTINCT FROM src AND OLD.alt_text IS NOT DISTINCT FROM NEW.alt_text THEN
    RETURN NULL;
  END IF;
  UPDATE doctors d SET
    photo_url = CASE WHEN l.usage = 'profile_image' THEN src ELSE d.photo_url END,
    profile_image_alt = CASE WHEN l.usage = 'profile_image' THEN coalesce(alt, d.profile_image_alt) ELSE d.profile_image_alt END,
    hero_image_url = CASE WHEN l.usage = 'hero_image' THEN src ELSE d.hero_image_url END,
    hero_image_alt = CASE WHEN l.usage = 'hero_image' THEN coalesce(alt, d.hero_image_alt) ELSE d.hero_image_alt END,
    hero_background_image_url = CASE WHEN l.usage = 'hero_background_image' THEN src ELSE d.hero_background_image_url END,
    hero_background_image_alt = CASE WHEN l.usage = 'hero_background_image' THEN coalesce(alt, d.hero_background_image_alt) ELSE d.hero_background_image_alt END,
    og_image_url = CASE WHEN l.usage = 'og_image' THEN src ELSE d.og_image_url END
  FROM media_doctors l
  WHERE l.media_id = NEW.id AND l.usage <> 'gallery' AND d.id = l.doctor_id;
  RETURN NULL;
END $$;
REVOKE EXECUTE ON FUNCTION public.propagate_media_to_doctors() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER media_items_propagate_doctors
AFTER UPDATE OF url, thumbnail_url, alt_text ON public.media_items
FOR EACH ROW EXECUTE FUNCTION public.propagate_media_to_doctors();

-- A media asset that fills a doctor image role cannot be deleted silently.
CREATE OR REPLACE FUNCTION public.block_delete_media_in_doctor_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uses text;
BEGIN
  SELECT string_agg(d.name || ' — ' || replace(l.usage, '_', ' '), ', ') INTO uses
  FROM media_doctors l JOIN doctors d ON d.id = l.doctor_id
  WHERE l.media_id = OLD.id AND l.usage <> 'gallery';
  IF uses IS NOT NULL THEN
    RAISE EXCEPTION 'This image is still used by: %. Remove it from those doctors first.', uses
      USING ERRCODE = 'P0001';
  END IF;
  RETURN OLD;
END $$;
REVOKE EXECUTE ON FUNCTION public.block_delete_media_in_doctor_role() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER media_items_block_doctor_role_delete
BEFORE DELETE ON public.media_items
FOR EACH ROW EXECUTE FUNCTION public.block_delete_media_in_doctor_role();

-- Backfill: existing doctor images become Media & Content assets with explicit role connections.
-- URLs are preserved exactly; nothing is removed.
INSERT INTO public.media_items (title, media_type, url, thumbnail_url, alt_text, published, show_on_home)
SELECT d.name || ' — ' || v.label, 'image', v.src, v.src, nullif(v.alt, ''), true, false
FROM public.doctors d
CROSS JOIN LATERAL (VALUES
  ('Profile image', d.photo_url, d.profile_image_alt),
  ('Hero image', d.hero_image_url, d.hero_image_alt),
  ('Hero background image', d.hero_background_image_url, d.hero_background_image_alt),
  ('Open Graph image', d.og_image_url, NULL)
) AS v(label, src, alt)
WHERE coalesce(v.src, '') <> ''
  AND NOT EXISTS (SELECT 1 FROM public.media_items m WHERE m.url = v.src OR m.thumbnail_url = v.src);

INSERT INTO public.media_doctors (media_id, doctor_id, usage, enabled, show_on_profile, display_order)
SELECT DISTINCT ON (d.id, v.usage) m.id, d.id, v.usage, true, false, 0
FROM public.doctors d
CROSS JOIN LATERAL (VALUES
  ('profile_image', d.photo_url), ('hero_image', d.hero_image_url),
  ('hero_background_image', d.hero_background_image_url), ('og_image', d.og_image_url)
) AS v(usage, src)
JOIN public.media_items m ON m.url = v.src OR m.thumbnail_url = v.src
WHERE coalesce(v.src, '') <> ''
ORDER BY d.id, v.usage, m.created_at
ON CONFLICT DO NOTHING;