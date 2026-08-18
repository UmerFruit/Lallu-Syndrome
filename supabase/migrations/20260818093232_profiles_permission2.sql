-- 1. Remove old/conflicting policies if they exist
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

-- 2. Ensure RLS is enabled
alter table public.profiles enable row level security;

-- 3. Allow anyone to read profiles (needed to show authors on articles)
create policy "Anyone can view profiles"
on public.profiles
for select
to public
using (true);

-- 4. Allow users to insert their own profile (if it doesn't exist yet)
create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

-- 5. Allow users to update their own profile
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);