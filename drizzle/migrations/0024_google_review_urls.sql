ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS google_review_url text;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS google_review_url text;
ALTER TABLE public.doctors ADD CONSTRAINT doctors_google_review_url_https CHECK (google_review_url IS NULL OR google_review_url ~ '^https://') NOT VALID;
ALTER TABLE public.locations ADD CONSTRAINT locations_google_review_url_https CHECK (google_review_url IS NULL OR google_review_url ~ '^https://') NOT VALID;
COMMENT ON COLUMN public.doctors.google_review_url IS 'Optional individual Google Reviews link for this doctor; Digital Card falls back to the primary hospital location link.';
COMMENT ON COLUMN public.locations.google_review_url IS 'Optional Google Reviews link for this location; the primary hospital location value is the hospital review link.';