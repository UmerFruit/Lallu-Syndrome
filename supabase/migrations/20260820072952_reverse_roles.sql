-- 1. Drop the new policies
drop policy if exists "Writers can create their own articles" on public.articles;
drop policy if exists "Writers can update their own articles" on public.articles;
drop policy if exists "Writers can delete their own articles" on public.articles;
drop policy if exists "Admins can delete any comment" on public.comments;

-- 2. Recreate the original article policies (from your initial migrations)
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

-- 3. Drop functions, column, and enum
drop function if exists public.is_admin(uuid);
drop function if exists public.is_writer(uuid);
alter table public.profiles drop column if exists role;
drop type if exists public.user_role;