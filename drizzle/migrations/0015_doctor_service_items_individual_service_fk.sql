ALTER TABLE public.doctor_service_items
  ADD CONSTRAINT doctor_service_items_individual_service_id_fkey
  FOREIGN KEY (individual_service_id) REFERENCES public.individual_services(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS doctor_service_items_individual_service_id_idx
  ON public.doctor_service_items (individual_service_id);