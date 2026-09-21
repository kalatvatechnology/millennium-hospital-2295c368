DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('GRANT SELECT ON public.%I TO anon', t);
  END LOOP;
END $$;

REVOKE SELECT ON public.enquiries FROM anon;
REVOKE SELECT ON public.enquiry_forwardings FROM anon;
REVOKE SELECT ON public.user_roles FROM anon;
GRANT INSERT ON public.enquiries TO anon;
GRANT INSERT ON public.enquiry_forwardings TO anon;