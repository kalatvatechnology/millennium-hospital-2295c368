
-- =====================================================================
-- Remove superseded roles (founder, co_founder, brand_super_admin) from
-- app_role and recreate the RBAC helper functions against the shrunk
-- enum, without dropping/recreating any RLS or Storage policy except
-- the 3 that reference the helper functions directly (they are dropped
-- and recreated verbatim, unchanged in behavior, because their DDL
-- literally embeds role casts and Postgres has no ALTER TYPE ... DROP
-- VALUE). All other 28 public + 18 storage policies are never touched:
-- they call can_admin/can_edit_content/is_staff by OID, which is
-- preserved throughout via CREATE OR REPLACE (never DROP).
-- =====================================================================

-- 1. Free the name 'app_role' for a new, smaller enum. This is a pure
--    catalog rename: existing functions keep working, unaffected.
ALTER TYPE public.app_role RENAME TO app_role_old;

-- 2. Create the new, 6-value enum under the name 'app_role'.
CREATE TYPE public.app_role AS ENUM (
  'super_admin', 'admin', 'front_desk', 'doctor', 'writer', 'editor'
);

-- 3. Drop the 3 policies whose stored expressions directly reference
--    has_any_role/role_rank (the only policies with a direct pg_depend
--    edge to those two functions). Recreated verbatim in step 11.
DROP POLICY "staff read enquiries" ON public.appointment_enquiries;
DROP POLICY "staff update enquiries" ON public.appointment_enquiries;
DROP POLICY "admin manage roles" ON public.user_roles;

-- 4. Temporarily neutralize the 4 wrapper functions so they stop
--    referencing has_any_role_old/role_rank_old (removing those
--    pg_depend edges). This runs inside one transaction, so no
--    concurrent request ever observes this intermediate stub body.
--    Parameter names must match the originals exactly (CREATE OR
--    REPLACE cannot rename a parameter).
CREATE OR REPLACE FUNCTION public.actor_max_rank(_uid uuid)
 RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $$ select 0; $$;

CREATE OR REPLACE FUNCTION public.can_admin(_uid uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $$ select false; $$;

CREATE OR REPLACE FUNCTION public.can_edit_content(_uid uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $$ select false; $$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $$ select false; $$;

-- 5. Now dependency-free: drop the old-typed leaf functions.
DROP FUNCTION public.role_rank(public.app_role_old);
DROP FUNCTION public.has_role(uuid, public.app_role_old);
DROP FUNCTION public.has_any_role(uuid, public.app_role_old[]);

-- 6. Migrate the column. Only 'super_admin' and 'editor' exist in the
--    data today (confirmed in pre-flight), both valid in the new enum.
ALTER TABLE public.user_roles
  ALTER COLUMN role TYPE public.app_role USING role::text::public.app_role;

-- 7. Old type now has zero dependents (no column, no function uses it).
DROP TYPE public.app_role_old;

-- 8. Recreate the leaf functions against the new enum. Same logic,
--    same relative rank ordering for every retained role.
CREATE FUNCTION public.role_rank(_role public.app_role)
 RETURNS integer LANGUAGE sql IMMUTABLE
 SET search_path TO 'public', 'pg_temp'
AS $$
  select case _role
    when 'super_admin' then 6
    when 'admin' then 5
    when 'front_desk' then 4
    when 'doctor' then 3
    when 'writer' then 2
    when 'editor' then 1
    else 0
  end;
$$;

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = _user_id and ur.role = _role
  );
$$;

CREATE FUNCTION public.has_any_role(_user_id uuid, _roles public.app_role[])
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = _user_id and ur.role = any(_roles)
  );
$$;

-- 9. Match the pre-existing EXECUTE grants exactly (anon/authenticated/
--    service_role could already call every RBAC helper via REST RPC;
--    this is a pre-existing condition, not a change this migration
--    introduces or is asked to fix).
GRANT EXECUTE ON FUNCTION public.role_rank(public.app_role) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, public.app_role[]) TO anon, authenticated, service_role;

-- 10. Restore the 4 wrapper functions to their real logic, minus the
--     3 removed roles. CREATE OR REPLACE preserves their OID, so every
--     RLS/Storage policy that calls them (25 public + 18 storage) is
--     never touched and never loses its dependency.
CREATE OR REPLACE FUNCTION public.actor_max_rank(_uid uuid)
 RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $$
  select coalesce(max(public.role_rank(ur.role)), 0)
  from public.user_roles ur
  where ur.user_id = _uid;
$$;

CREATE OR REPLACE FUNCTION public.can_admin(_uid uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $$
  select public.has_any_role(_uid, array['super_admin','admin']::public.app_role[]);
$$;

CREATE OR REPLACE FUNCTION public.can_edit_content(_uid uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $$
  select public.has_any_role(_uid, array['super_admin','admin','editor','writer']::public.app_role[]);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $$
  select public.has_any_role(
    _user_id,
    array['super_admin','admin','front_desk','doctor','writer','editor']::public.app_role[]
  );
$$;

-- 11. Recreate the 3 dropped policies verbatim (same permissive flag,
--     same {public} role target, same USING/WITH CHECK text) -- only
--     the underlying enum they cast into has shrunk.
CREATE POLICY "staff read enquiries" ON public.appointment_enquiries
  FOR SELECT
  USING (public.can_admin(auth.uid()) OR public.has_any_role(auth.uid(), ARRAY['front_desk'::public.app_role, 'doctor'::public.app_role]));

CREATE POLICY "staff update enquiries" ON public.appointment_enquiries
  FOR UPDATE
  USING (public.can_admin(auth.uid()) OR public.has_any_role(auth.uid(), ARRAY['front_desk'::public.app_role]))
  WITH CHECK (public.can_admin(auth.uid()) OR public.has_any_role(auth.uid(), ARRAY['front_desk'::public.app_role]));

CREATE POLICY "admin manage roles" ON public.user_roles
  FOR ALL
  USING (public.can_admin(auth.uid()) AND (public.role_rank(role) <= public.actor_max_rank(auth.uid())))
  WITH CHECK (public.can_admin(auth.uid()) AND (public.role_rank(role) <= public.actor_max_rank(auth.uid())));
