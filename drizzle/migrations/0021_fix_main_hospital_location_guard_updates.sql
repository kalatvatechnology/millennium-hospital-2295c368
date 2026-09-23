CREATE OR REPLACE FUNCTION public.protect_main_hospital_doctor_location()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.location_id <> 'c05eb511-3414-4a93-bcc9-8ef1e6ebcf6a'::uuid THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.location_id IS DISTINCT FROM OLD.location_id OR NEW.doctor_id IS DISTINCT FROM OLD.doctor_id THEN
      RAISE EXCEPTION 'The main hospital location cannot be reassigned';
    END IF;
    RETURN NEW;
  END IF;
  -- DELETE: allow only when the doctor itself is being deleted (FK cascade)
  IF EXISTS (SELECT 1 FROM public.doctors WHERE id = OLD.doctor_id) THEN
    RAISE EXCEPTION 'The main hospital location cannot be removed from a doctor';
  END IF;
  RETURN OLD;
END $function$;