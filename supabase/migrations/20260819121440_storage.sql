-- ============================================================
-- 004_storage.sql
-- Storage buckets + policies
-- ============================================================

-- ── Buckets ─────────────────────────────────────────────────
-- Note: The 'media' bucket is public, so images are downloadable by anyone with the URL.
-- This SELECT policy only restricts users from using the API to LIST the contents of folders they don't own.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- ── Media bucket: authors manage their article images ──────
create policy "Authors can view article media metadata"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'media'
    and split_part(name, '/', 1) = 'articles'
    and split_part(name, '/', 2) <> ''
    and exists (
      select 1 from public.articles
      where articles.id::text = split_part(storage.objects.name, '/', 2)
        and articles.author_id = auth.uid()
    )
  );

create policy "Authors can upload article media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'media'
    and split_part(name, '/', 1) = 'articles'
    and split_part(name, '/', 2) <> ''
    and exists (
      select 1 from public.articles
      where articles.id::text = split_part(storage.objects.name, '/', 2)
        and articles.author_id = auth.uid()
    )
  );

create policy "Authors can delete article media"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'media'
    and split_part(name, '/', 1) = 'articles'
    and split_part(name, '/', 2) <> ''
    and exists (
      select 1 from public.articles
      where articles.id::text = split_part(storage.objects.name, '/', 2)
        and articles.author_id = auth.uid()
    )
  );

-- ── Avatars bucket ──────────────────────────────────────────
create policy "Avatar images are publicly accessible"
  on storage.objects for select to public
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "Users can update their own avatar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );