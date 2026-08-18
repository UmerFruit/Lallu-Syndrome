-- Ensure the bucket exists (skip if you already created it in the UI)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 1. Anyone can view avatars (needed to show them on articles/comments)
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible"
on storage.objects
for select
to public
using (bucket_id = 'avatars');

-- 2. Users can upload their own avatar
drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars' 
  and (split_part(name, '/', 1) = auth.uid()::text)
);

-- 3. Users can update their own avatar (overwrite)
drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars' 
  and (split_part(name, '/', 1) = auth.uid()::text)
)
with check (
  bucket_id = 'avatars' 
  and (split_part(name, '/', 1) = auth.uid()::text)
);

-- 4. Users can delete their own avatar
drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars' 
  and (split_part(name, '/', 1) = auth.uid()::text)
);