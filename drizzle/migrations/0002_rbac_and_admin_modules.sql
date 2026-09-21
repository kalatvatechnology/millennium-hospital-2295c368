-- enums
do $$ begin create type public.request_status as enum ('pending','approved','rejected'); exception when duplicate_object then null; end $$;

-- helper functions
create or replace function public.is_super_admin() returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'super_admin')
$$;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('super_admin','admin'))
$$;

create or replace function public.can_manage_content() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('super_admin','admin','editor','writer'))
$$;

create or replace function public.can_publish() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('super_admin','admin','editor'))
$$;

create or replace function public.can_manage_enquiries() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('super_admin','admin','front_desk'))
$$;

create or replace function public.is_staff() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid())
$$;

-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  doctor_id uuid references public.doctors(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles own read" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles own update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles admin read" on public.profiles for select to authenticated using (public.is_admin());
create policy "profiles admin write" on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());
create trigger set_updated_at_profiles before update on public.profiles for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, nullif(new.raw_user_meta_data ->> 'full_name',''))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

insert into public.profiles (id, email)
select u.id, u.email from auth.users u on conflict (id) do nothing;

-- user_roles management: only super admins may change roles
drop policy if exists "user_roles admin manage" on public.user_roles;
create policy "user_roles super admin manage" on public.user_roles for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
create policy "user_roles read own" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- audit logs
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  action text not null,
  entity_table text,
  entity_id uuid,
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select, insert on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "audit read admins" on public.audit_logs for select to authenticated using (public.is_admin());
create policy "audit insert staff" on public.audit_logs for insert to authenticated with check (public.is_staff() and actor_id = auth.uid());

-- notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "notifications own read" on public.notifications for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "notifications own update" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications staff insert" on public.notifications for insert to authenticated with check (public.is_staff());
create policy "notifications admin delete" on public.notifications for delete to authenticated using (public.is_admin());

-- doctor profile change requests
create table if not exists public.doctor_profile_change_requests (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  changes jsonb not null default '{}'::jsonb,
  note text,
  status request_status not null default 'pending',
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.doctor_profile_change_requests to authenticated;
grant all on public.doctor_profile_change_requests to service_role;
alter table public.doctor_profile_change_requests enable row level security;
create policy "dpcr own read" on public.doctor_profile_change_requests for select to authenticated using (requested_by = auth.uid() or public.is_admin());
create policy "dpcr own insert" on public.doctor_profile_change_requests for insert to authenticated with check (requested_by = auth.uid() and public.is_staff());
create policy "dpcr admin manage" on public.doctor_profile_change_requests for all to authenticated using (public.is_admin()) with check (public.is_admin());
create trigger set_updated_at_dpcr before update on public.doctor_profile_change_requests for each row execute function public.set_updated_at();

-- locations
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  address_line text,
  city text,
  state text,
  postal_code text,
  phone text,
  email text,
  map_url text,
  opening_hours text,
  published boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.locations to anon;
grant select, insert, update, delete on public.locations to authenticated;
grant all on public.locations to service_role;
alter table public.locations enable row level security;
create policy "locations public read" on public.locations for select to anon, authenticated using (published or public.is_staff());
create policy "locations manage" on public.locations for all to authenticated using (public.can_manage_content()) with check (public.can_manage_content());
create trigger set_updated_at_locations before update on public.locations for each row execute function public.set_updated_at();

-- website pages
create table if not exists public.website_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body text,
  meta_title text,
  meta_description text,
  status post_status not null default 'draft',
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.website_pages to anon;
grant select, insert, update, delete on public.website_pages to authenticated;
grant all on public.website_pages to service_role;
alter table public.website_pages enable row level security;
create policy "pages public read" on public.website_pages for select to anon, authenticated using (status = 'published' or public.is_staff());
create policy "pages manage" on public.website_pages for all to authenticated using (public.can_manage_content()) with check (public.can_manage_content());
create trigger set_updated_at_pages before update on public.website_pages for each row execute function public.set_updated_at();

-- navigation
create table if not exists public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  menu text not null default 'primary',
  label text not null,
  href text not null,
  parent_id uuid references public.navigation_items(id) on delete cascade,
  published boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.navigation_items to anon;
grant select, insert, update, delete on public.navigation_items to authenticated;
grant all on public.navigation_items to service_role;
alter table public.navigation_items enable row level security;
create policy "nav public read" on public.navigation_items for select to anon, authenticated using (published or public.is_staff());
create policy "nav manage" on public.navigation_items for all to authenticated using (public.can_manage_content()) with check (public.can_manage_content());
create trigger set_updated_at_nav before update on public.navigation_items for each row execute function public.set_updated_at();

-- broaden content management beyond admins
do $$
declare t text;
begin
  foreach t in array array['departments','doctors','professional_services','hospital_services','facilities','media_items','faq_categories','faqs','reviews','blog_authors','blog_categories','blog_posts',
    'facility_departments','facility_doctors','facility_hospital_services','facility_professional_services',
    'professional_service_departments','professional_service_doctors','media_departments','media_doctors',
    'media_hospital_services','media_professional_services','blog_post_departments','blog_post_doctors',
    'blog_post_facilities','blog_post_hospital_services','blog_post_professional_services']
  loop
    execute format('drop policy if exists %I on public.%I', 'content managers manage', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.can_manage_content()) with check (public.can_manage_content())', 'content managers manage', t);
  end loop;
end $$;

-- enquiries: front desk
drop policy if exists "enquiries front desk read" on public.enquiries;
create policy "enquiries front desk read" on public.enquiries for select to authenticated using (public.can_manage_enquiries());
drop policy if exists "enquiries front desk update" on public.enquiries;
create policy "enquiries front desk update" on public.enquiries for update to authenticated using (public.can_manage_enquiries()) with check (public.can_manage_enquiries());
drop policy if exists "forwardings front desk read" on public.enquiry_forwardings;
create policy "forwardings front desk read" on public.enquiry_forwardings for select to authenticated using (public.can_manage_enquiries());

-- publishing authority: writers cannot publish blog posts
create or replace function public.enforce_publish_authority() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    if not public.can_publish() then
      raise exception 'You do not have permission to publish content';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists enforce_publish_blog_posts on public.blog_posts;
create trigger enforce_publish_blog_posts before insert or update on public.blog_posts for each row execute function public.enforce_publish_authority();

-- doctors may record clinical review outcomes without other edit rights
create or replace function public.restrict_doctor_blog_edits() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.can_manage_content() then return new; end if;
  if not public.has_role(auth.uid(), 'doctor') then
    raise exception 'Not permitted to modify this post';
  end if;
  if (to_jsonb(new) - 'clinical_review_status' - 'clinical_review_notes' - 'clinical_reviewed_at' - 'updated_at')
     is distinct from
     (to_jsonb(old) - 'clinical_review_status' - 'clinical_review_notes' - 'clinical_reviewed_at' - 'updated_at') then
    raise exception 'Clinical reviewers may only update the clinical review outcome';
  end if;
  return new;
end $$;
drop trigger if exists restrict_doctor_blog_edits_trg on public.blog_posts;
create trigger restrict_doctor_blog_edits_trg before update on public.blog_posts for each row execute function public.restrict_doctor_blog_edits();

drop policy if exists "blog reviewer update" on public.blog_posts;
create policy "blog reviewer update" on public.blog_posts for update to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.doctor_id = blog_posts.clinical_reviewer_id))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.doctor_id = blog_posts.clinical_reviewer_id));
drop policy if exists "blog reviewer read" on public.blog_posts;
create policy "blog reviewer read" on public.blog_posts for select to authenticated
using (public.is_staff());

-- doctors may read their own record
drop policy if exists "doctors self read" on public.doctors;
create policy "doctors self read" on public.doctors for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.doctor_id = doctors.id));