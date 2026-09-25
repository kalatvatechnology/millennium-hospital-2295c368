ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS short_description text;
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS card_image_url text;
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS card_image_alt text;
ALTER TABLE public.departments ADD CONSTRAINT departments_short_description_length CHECK (short_description IS NULL OR char_length(short_description) <= 180);
ALTER TABLE public.departments ADD CONSTRAINT departments_card_image_alt_length CHECK (card_image_alt IS NULL OR char_length(card_image_alt) <= 160);
COMMENT ON COLUMN public.departments.short_description IS 'Short public text shown on the Department Card (max 180 chars).';
COMMENT ON COLUMN public.departments.card_image_url IS 'Department Card image served from managed storage.';
COMMENT ON COLUMN public.departments.card_image_alt IS 'Alt text for the Department Card image (max 160 chars).';