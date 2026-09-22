ALTER TABLE public.doctors
  ADD COLUMN hero_background_image_url text,
  ADD COLUMN hero_background_image_alt text,
  ADD COLUMN hero_background_position text NOT NULL DEFAULT 'center';

ALTER TABLE public.doctors
  ADD CONSTRAINT doctors_hero_background_position_check
  CHECK (hero_background_position IN ('left', 'center', 'right'));

COMMENT ON COLUMN public.doctors.hero_background_image_url IS 'Independent decorative Hero background image; never the doctor portrait.';
COMMENT ON COLUMN public.doctors.hero_background_image_alt IS 'Alternative text for the independent decorative Hero background image.';
COMMENT ON COLUMN public.doctors.hero_background_position IS 'Responsive cover focal position for the independent Hero background image.';
COMMENT ON COLUMN public.doctors.hero_image_url IS 'Legacy Hero image preserved without reinterpretation; do not use as the Hero background.';
COMMENT ON COLUMN public.doctors.hero_image_alt IS 'Legacy Hero image alternative text preserved without reinterpretation.';
COMMENT ON COLUMN public.doctors.hero_image_position IS 'Legacy Hero image position preserved without reinterpretation.';