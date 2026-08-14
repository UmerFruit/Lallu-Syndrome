create policy "Public profiles are viewable"
on public.profiles
for select
to anon, authenticated
using (true);