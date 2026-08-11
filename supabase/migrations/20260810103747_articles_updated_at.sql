------------Articles Table---------------
alter table public.articles
alter column updated_at set default now();

alter table public.articles
alter column updated_at set not null;