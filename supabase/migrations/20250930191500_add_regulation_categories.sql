alter table public.regulations
  add column if not exists category text default 'General';

alter table public.regulations
  add column if not exists subcategory text default 'General';

update public.regulations
set
  category = coalesce(category, 'General'),
  subcategory = coalesce(subcategory, 'General');

alter table public.regulations
  alter column category set not null;

alter table public.regulations
  alter column subcategory set not null;
