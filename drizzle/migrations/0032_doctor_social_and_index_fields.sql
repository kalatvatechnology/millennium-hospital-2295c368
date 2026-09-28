ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS og_title text;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS og_description text;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS robots_index boolean NOT NULL DEFAULT true;
COMMENT ON COLUMN public.doctors.robots_index IS 'Editor choice to allow indexing; only effective while the profile is published.';