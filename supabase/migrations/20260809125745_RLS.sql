alter table public.profiles enable row level security;

create policy "Profiles are publicly readable"
on public.profiles
for select
to anon, authenticated
using (true);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
