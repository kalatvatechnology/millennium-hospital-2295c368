DO $$
DECLARE
  dental uuid;
  item text;
  designations text[] := ARRAY[
    'Consultant Dentist','Senior Consultant Dentist','Consultant Dental Surgeon','Senior Consultant Dental Surgeon',
    'Consultant Prosthodontist','Consultant Endodontist','Consultant Periodontist','Consultant Orthodontist',
    'Consultant Oral & Maxillofacial Surgeon','Consultant Implantologist','Consultant Pediatric Dentist',
    'Consultant Oral & Maxillofacial Radiologist','Consultant Oral Medicine & Radiologist','Dental Surgeon',
    'Senior Dental Surgeon','Associate Consultant Dentist'
  ];
  specializations text[] := ARRAY[
    'General Dentistry','Preventive Dentistry','Restorative Dentistry','Cosmetic Dentistry','Aesthetic Dentistry',
    'Prosthodontics','Implant Dentistry','Endodontics','Periodontics','Orthodontics','Pediatric Dentistry',
    'Oral & Maxillofacial Surgery','Oral Medicine & Radiology','Oral & Maxillofacial Radiology','Oral Pathology',
    'Geriatric Dentistry','Microscopic Dentistry','Laser Dentistry','Full Mouth Rehabilitation','Smile Design',
    'Digital Dentistry','Sedation Dentistry','Emergency Dentistry','Special Care Dentistry',
    'Maxillofacial Prosthodontics','Temporomandibular Joint (TMJ) Disorders','Craniofacial Dentistry',
    'Sleep Dentistry & Dental Sleep Medicine','Dental Trauma Management','Advanced Implantology'
  ];
BEGIN
  SELECT id INTO dental FROM public.departments WHERE slug = 'dental-care' LIMIT 1;
  IF dental IS NULL THEN
    RETURN;
  END IF;

  FOREACH item IN ARRAY designations LOOP
    INSERT INTO public.department_designations (department_id, name)
    SELECT dental, item
    WHERE NOT EXISTS (
      SELECT 1 FROM public.department_designations
      WHERE department_id = dental AND lower(name) = lower(item)
    );
  END LOOP;

  FOREACH item IN ARRAY specializations LOOP
    INSERT INTO public.department_specializations (department_id, name)
    SELECT dental, item
    WHERE NOT EXISTS (
      SELECT 1 FROM public.department_specializations
      WHERE department_id = dental AND lower(name) = lower(item)
    );
  END LOOP;
END $$;