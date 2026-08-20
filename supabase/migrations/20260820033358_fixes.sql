create trigger articles_handle_publication_insert
before insert on public.articles
for each row execute function public.handle_article_publication();

drop policy if exists "Users can like articles"
on public.article_likes;

drop policy if exists "Users can like published articles"
on public.article_likes;

create policy "Users can like published articles"
on public.article_likes
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.articles
    where articles.id = article_likes.article_id
      and articles.status = 'published'
  )
);

---------------adding admin role-----------------
-- 1. Create Role Enum
create type public.user_role as enum ('reader', 'writer', 'admin');

-- 2. Add Role Column to Profiles (defaults to 'reader')
alter table public.profiles
add column role public.user_role not null default 'reader';

-- 3. Helper Functions for RLS (Row Level Security)
create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select role = 'admin' from public.profiles where id = user_id;
$$;

create or replace function public.is_writer(user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select role in ('writer', 'admin') from public.profiles where id = user_id;
$$;

-- 4. Update Articles RLS (Drop old, create new)
drop policy if exists "Authors can create their own articles" on public.articles;
drop policy if exists "Authors can update their own articles" on public.articles;
drop policy if exists "Authors can delete their own articles" on public.articles;

create policy "Writers can create their own articles"
on public.articles for insert to authenticated
with check (auth.uid() = author_id and public.is_writer(auth.uid()));

create policy "Writers can update their own articles"
on public.articles for update to authenticated
using (auth.uid() = author_id and public.is_writer(auth.uid()))
with check (auth.uid() = author_id and public.is_writer(auth.uid()));

create policy "Writers can delete their own articles"
on public.articles for delete to authenticated
using (auth.uid() = author_id and public.is_writer(auth.uid()));

-- 5. Admin Comment Moderation RLS (Allows admins to delete ANY comment)
create policy "Admins can delete any comment"
on public.comments for delete to authenticated
using (public.is_admin(auth.uid()));