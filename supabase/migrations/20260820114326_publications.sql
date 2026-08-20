-- ============================================================
-- Publications / minimal multi-publication support
-- ============================================================

-- 1. Publications table
create table if not exists public.publications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default 'The Journal',
  slug text not null unique,
  description text,
  logo_url text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint publications_name_length check (char_length(name) between 1 and 100),
  constraint publications_slug_length check (char_length(slug) between 1 and 100),
  constraint publications_description_length check (description is null or char_length(description) <= 500)
);

-- Only one default publication per user
create unique index if not exists publications_one_default_per_owner
on public.publications(owner_id)
where is_default;

-- updated_at trigger
drop trigger if exists publications_set_updated_at on public.publications;
create trigger publications_set_updated_at
before update on public.publications
for each row execute function public.set_updated_at();

-- 2. Add publication_id to articles
alter table public.articles
add column if not exists publication_id uuid references public.publications(id);

-- 3. Slug helper
create or replace function public.generate_publication_slug(p_owner_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  base text;
  candidate text;
  i integer := 0;
begin
  select username
  into v_username
  from public.profiles
  where id = p_owner_id;

  if v_username is not null and char_length(v_username) >= 3 then
    base := v_username;
  else
    base := 'journal-' || left(replace(p_owner_id::text, '-', ''), 8);
  end if;

  candidate := base;

  while exists (
    select 1
    from public.publications
    where slug = candidate
  ) loop
    i := i + 1;
    candidate := base || '-' || i;
  end loop;

  return candidate;
end;
$$;

-- 4. Default publication helper
create or replace function public.create_default_publication(p_owner_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.publications
    where owner_id = p_owner_id
      and is_default = true
  ) then
    insert into public.publications (owner_id, name, slug, is_default)
    values (
      p_owner_id,
      'The Journal',
      public.generate_publication_slug(p_owner_id),
      true
    );
  end if;
end;
$$;

-- 5. Create default publication for new users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.email, 'User')
  );

  perform public.create_default_publication(new.id);

  return new;
end;
$$;

-- 6. Backfill default publications for existing users
do $$
declare
  r record;
begin
  for r in
    select id
    from public.profiles
  loop
    perform public.create_default_publication(r.id);
  end loop;
end;
$$;

-- 7. Assign existing articles to owner's default publication
update public.articles a
set publication_id = p.id
from public.publications p
where a.publication_id is null
  and p.owner_id = a.author_id
  and p.is_default = true;

-- Now every article must have a publication
alter table public.articles
alter column publication_id set not null;

-- 8. RLS for publications
alter table public.publications enable row level security;

drop policy if exists "Publications are publicly readable" on public.publications;
drop policy if exists "Users can create their own publications" on public.publications;
drop policy if exists "Owners can update their own publications" on public.publications;
drop policy if exists "Owners can delete non-default publications" on public.publications;

create policy "Publications are publicly readable"
on public.publications
for select
to anon, authenticated
using (true);

create policy "Users can create their own publications"
on public.publications
for insert
to authenticated
with check (auth.uid() = owner_id);

create policy "Owners can update their own publications"
on public.publications
for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "Owners can delete non-default publications"
on public.publications
for delete
to authenticated
using (
  auth.uid() = owner_id
  and is_default = false
);

grant select on public.publications to anon, authenticated;
grant insert, update, delete on public.publications to authenticated;

-- 9. Update article policies to require owning the publication
drop policy if exists "Authors can create their own articles" on public.articles;
drop policy if exists "Authors can update their own articles" on public.articles;

create policy "Authors can create articles in their publications"
on public.articles
for insert
to authenticated
with check (
  auth.uid() = author_id
  and exists (
    select 1
    from public.publications p
    where p.id = publication_id
      and p.owner_id = auth.uid()
  )
);

create policy "Authors can update their own articles"
on public.articles
for update
to authenticated
using (auth.uid() = author_id)
with check (
  auth.uid() = author_id
  and exists (
    select 1
    from public.publications p
    where p.id = publication_id
      and p.owner_id = auth.uid()
  )
);