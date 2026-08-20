-- Drop new policies
drop policy if exists "Published articles are publicly readable" on public.articles;
drop policy if exists "Authors can read their own articles" on public.articles;
drop policy if exists "Admins can read all articles" on public.articles;
drop policy if exists "Writers can create articles" on public.articles;
drop policy if exists "Writers can update their own articles" on public.articles;
drop policy if exists "Writers can delete their own articles" on public.articles;
drop policy if exists "Admins can delete any article" on public.articles;
drop policy if exists "Users can delete their own comments" on public.comments;
drop policy if exists "Admins can delete any comment" on public.comments;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Admins can update any profile" on public.profiles;

-- Restore original policies
create policy "Published articles are publicly readable"
on public.articles for select to anon, authenticated
using (status = 'published');

create policy "Authors can read their own articles"
on public.articles for select to authenticated
using (auth.uid() = author_id);

create policy "Authors can create their own articles"
on public.articles for insert to authenticated
with check (auth.uid() = author_id);

create policy "Authors can update their own articles"
on public.articles for update to authenticated
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

create policy "Authors can delete their own articles"
on public.articles for delete to authenticated
using (auth.uid() = author_id);

create policy "Users can delete their own comments"
on public.comments for delete to authenticated
using (auth.uid() = author_id);

create policy "Users can update their own profile"
on public.profiles for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Drop functions, column, enum
drop function if exists public.is_admin(uuid);
drop function if exists public.is_writer(uuid);
alter table public.profiles drop column if exists role;
drop type if exists public.user_role;


-- 1. Add is_admin flag
alter table public.profiles
add column is_admin boolean not null default false;

-- 2. Helper function
create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = user_id and is_admin = true
  );
$$;

-- 3. Admin can read ALL articles (for admin panel)
create policy "Admins can read all articles"
on public.articles for select to authenticated
using (public.is_admin(auth.uid()));

-- 4. Admin can delete ANY article
create policy "Admins can delete any article"
on public.articles for delete to authenticated
using (public.is_admin(auth.uid()));

-- 5. Admin can delete ANY comment
create policy "Admins can delete any comment"
on public.comments for delete to authenticated
using (public.is_admin(auth.uid()));

-- 6. Prevent users from setting themselves as admin
drop policy if exists "Users can update their own profile" on public.profiles;

create policy "Users can update their own profile"
on public.profiles for update to authenticated
using (auth.uid() = id)
with check (
  auth.uid() = id
  AND is_admin = (select p.is_admin from public.profiles p where p.id = auth.uid())
);

-- 7. Admins can update any profile (to grant/revoke admin)
create policy "Admins can update any profile"
on public.profiles for update to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));


update public.profiles set is_admin = true where id = '1d571977-83a0-4cf0-a573-7fe1e92fea8b';