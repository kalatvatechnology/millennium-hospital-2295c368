ALTER TYPE public.media_type ADD VALUE IF NOT EXISTS 'image';
ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS alt_text text;