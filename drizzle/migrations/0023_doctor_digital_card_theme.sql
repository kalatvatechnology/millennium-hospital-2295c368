ALTER TABLE public.doctors
  ADD COLUMN IF NOT EXISTS digital_card_theme text NOT NULL DEFAULT 'millennium_signature';
ALTER TABLE public.doctors
  ADD CONSTRAINT doctors_digital_card_theme_check CHECK (digital_card_theme IN ('millennium_signature','clinical_elegance','modern_executive','premium_medical','minimal_luxe'));
COMMENT ON COLUMN public.doctors.digital_card_theme IS 'Presentation-only theme for the Digital Doctor Card; all card content comes from existing doctor data.';