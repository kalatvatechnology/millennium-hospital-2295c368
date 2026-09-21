CREATE OR REPLACE FUNCTION public.enforce_doctor_publish_authority()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.published AND NOT public.can_publish() THEN
      RAISE EXCEPTION 'You do not have permission to publish doctor profiles';
    END IF;
  ELSIF NEW.published IS DISTINCT FROM OLD.published AND NOT public.can_publish() THEN
    RAISE EXCEPTION 'You do not have permission to change doctor publication status';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_doctor_publish_authority_trg ON public.doctors;
CREATE TRIGGER enforce_doctor_publish_authority_trg
BEFORE INSERT OR UPDATE ON public.doctors
FOR EACH ROW
EXECUTE FUNCTION public.enforce_doctor_publish_authority();