-- Phase 2: Public content surfaces (regulations)
set check_function_bodies = off;

create type regulation_status as enum ('draft', 'published', 'archived');

create table public.regulations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  slug text not null unique,
  title text not null,
  summary text,
  body_markdown text not null,
  effective_at date,
  tags text[] not null default '{}',
  status regulation_status not null default 'draft',
  published_at timestamptz
);

create index idx_regulations_status_effective on public.regulations (status, effective_at desc);
create index idx_regulations_tags on public.regulations using gin (tags);

create or replace function public.touch_regulations()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  if new.status = 'published' and new.published_at is null then
    if tg_op = 'INSERT' then
      new.published_at = now();
    elsif tg_op = 'UPDATE' and old.status is distinct from 'published' then
      new.published_at = now();
    end if;
  end if;
  return new;
end;
$$;

create trigger touch_regulations before insert or update on public.regulations
for each row execute procedure public.touch_regulations();

alter table public.regulations enable row level security;

create policy "Public read published regulations" on public.regulations
  for select
  using (status = 'published');

create policy "Staff read regulations" on public.regulations
  for select
  using (public.is_staff());

create policy "Staff manage regulations" on public.regulations
  for all
  using (public.is_staff()) with check (public.is_staff());
