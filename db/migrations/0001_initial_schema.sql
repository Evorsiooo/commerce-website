-- Phase 1: Baseline schema, enums, and row level security
set check_function_bodies = off;

create extension if not exists "pgcrypto";

-- Enums
create type application_type as enum ('business_new', 'property', 'permit', 'dev_support', 'amend_governance');
create type application_status as enum ('received', 'under_review', 'need_more_info', 'approved', 'rejected');
create type business_type as enum ('corporation', 'llc', 'gp', 'lp', 'llp', 'sole_prop', 'nonprofit_corp');
create type management_type as enum ('member_managed', 'manager_managed', 'board_managed');
create type business_status as enum ('active', 'suspended', 'closed');
create type property_status as enum ('available', 'pending', 'occupied');
create type permit_status as enum ('pending', 'issued', 'revoked', 'expired');
create type permit_type as enum ('standard', 'event', 'temporary', 'renewal');
create type bureau as enum ('licensing', 'property', 'compliance');
create type staff_role as enum ('staff', 'admin');
create type tipline_status as enum ('received', 'triage', 'in_review', 'closed');

-- Helper functions for RLS checks
create or replace function public.is_staff()
returns boolean
language sql
stable
as $$
  select exists(
    select 1 from public.staff s
    where s.user_id = auth.uid()
  );
$$;

create or replace function public.is_staff_admin()
returns boolean
language sql
stable
as $$
  select exists(
    select 1 from public.staff s
    where s.user_id = auth.uid() and s.role = 'admin'
  );
$$;

create or replace function public.is_staff_in_bureau(target bureau)
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.staff s
    where s.user_id = auth.uid() and s.bureau = target
  );
$$;

-- Core tables
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  industry text,
  status business_status not null default 'active',
  purpose text,
  discord_url text,
  employee_db_url text,
  type business_type not null,
  management_type management_type,
  logo_storage_path text,
  governance_json jsonb not null default '{}'::jsonb
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text,
  address text,
  status property_status not null default 'available',
  current_business_id uuid references public.businesses(id) on delete set null,
  notes text,
  photo_storage_path text
);

create table public.permits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  type permit_type not null,
  holder_business_id uuid not null references public.businesses(id) on delete cascade,
  status permit_status not null default 'pending',
  effective_at date,
  expires_at date
);

create table public.people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  discord_id text,
  discord_username text,
  roblox_user_id text,
  roblox_username text,
  first_name text,
  last_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  bureau bureau not null,
  role staff_role not null default 'staff',
  created_at timestamptz not null default now()
);

create table public.business_memberships (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  role text not null,
  is_primary_contact boolean not null default false,
  created_at timestamptz not null default now(),
  unique (business_id, person_id)
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null default auth.uid(),
  type application_type not null,
  payload_json jsonb not null default '{}'::jsonb,
  governance_json jsonb,
  status application_status not null default 'received',
  decision_notes text,
  linked_business_id uuid references public.businesses(id) on delete set null,
  linked_property_id uuid references public.properties(id) on delete set null
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  actor_id uuid references auth.users(id) on delete set null,
  context_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.tipline_reports (
  id uuid primary key default gen_random_uuid(),
  submitted_at timestamptz not null default now(),
  submitted_by uuid default auth.uid(),
  business_name text,
  description text not null,
  evidence_url text,
  status tipline_status not null default 'received',
  assigned_to uuid references public.staff(user_id) on delete set null
);

-- Indexes
create index idx_businesses_name on public.businesses using gin (to_tsvector('english', name));
create index idx_businesses_status_industry on public.businesses (status, industry);
create index idx_properties_status on public.properties (status);
create index idx_properties_current_business on public.properties (current_business_id);
create index idx_permits_holder on public.permits (holder_business_id);
create index idx_permits_status_type on public.permits (status, type);
create index idx_assignments_property_start on public.assignments (property_id, start_at);
create index idx_applications_created_by on public.applications (created_by);
create index idx_applications_status on public.applications (status);
create index idx_tipline_status on public.tipline_reports (status);
create index idx_tipline_assigned on public.tipline_reports (assigned_to);

-- Row level security
alter table public.businesses enable row level security;
alter table public.properties enable row level security;
alter table public.permits enable row level security;
alter table public.people enable row level security;
alter table public.staff enable row level security;
alter table public.business_memberships enable row level security;
alter table public.assignments enable row level security;
alter table public.applications enable row level security;
alter table public.audit_events enable row level security;
alter table public.tipline_reports enable row level security;

-- Businesses policies
create policy "Public can read active businesses" on public.businesses
  for select
  using (status = 'active');

create policy "Staff can read all businesses" on public.businesses
  for select
  using (public.is_staff());

create policy "Staff manage businesses" on public.businesses
  for all
  using (public.is_staff()) with check (public.is_staff());

-- Properties policies
create policy "Public can read available properties" on public.properties
  for select using (status in ('available', 'pending'));

create policy "Staff can read all properties" on public.properties
  for select using (public.is_staff());

create policy "Staff manage properties" on public.properties
  for all using (public.is_staff()) with check (public.is_staff());

-- Permits policies (staff only)
create policy "Staff read permits" on public.permits
  for select using (public.is_staff());

create policy "Staff manage permits" on public.permits
  for all using (public.is_staff()) with check (public.is_staff());

-- People policies
create policy "Users read their profile" on public.people
  for select using (user_id = auth.uid());

create policy "Users manage their profile" on public.people
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Staff read people" on public.people
  for select using (public.is_staff());

-- Staff policies (admin only)
create policy "Admins manage staff" on public.staff
  for all using (public.is_staff_admin()) with check (public.is_staff_admin());

-- Business memberships policies
create policy "Members read their memberships" on public.business_memberships
  for select using (
    person_id in (
      select id from public.people p where p.user_id = auth.uid()
    )
    or public.is_staff()
  );

create policy "Staff manage memberships" on public.business_memberships
  for all using (public.is_staff()) with check (public.is_staff());

-- Assignments policies
create policy "Staff manage assignments" on public.assignments
  for all using (public.is_staff()) with check (public.is_staff());

-- Applications policies
create policy "Applicants insert applications" on public.applications
  for insert with check (auth.uid() is not null);

create policy "Applicants read their applications" on public.applications
  for select using (created_by = auth.uid());

create policy "Staff read applications" on public.applications
  for select using (public.is_staff());

create policy "Staff manage applications" on public.applications
  for all using (public.is_staff()) with check (public.is_staff());

-- Audit events policies (staff only)
create policy "Staff read audit events" on public.audit_events
  for select using (public.is_staff());

create policy "Staff insert audit events" on public.audit_events
  for insert with check (public.is_staff());

-- Tipline policies
create policy "Public can submit tips" on public.tipline_reports
  for insert with check (true);

create policy "Compliance staff read tips" on public.tipline_reports
  for select using (public.is_staff_in_bureau('compliance'));

create policy "Compliance staff manage tips" on public.tipline_reports
  for all using (public.is_staff_in_bureau('compliance')) with check (public.is_staff_in_bureau('compliance'));

-- Updated_at triggers
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger touch_businesses before update on public.businesses
for each row execute procedure public.touch_updated_at();

create trigger touch_properties before update on public.properties
for each row execute procedure public.touch_updated_at();

create trigger touch_permits before update on public.permits
for each row execute procedure public.touch_updated_at();

create trigger touch_people before update on public.people
for each row execute procedure public.touch_updated_at();

create trigger touch_applications before update on public.applications
for each row execute procedure public.touch_updated_at();
