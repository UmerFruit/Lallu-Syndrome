drop policy if exists "Authors can view article media metadata"
on storage.objects;

create policy "Authors can view article media metadata"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'media'
  and split_part(name, '/', 1) = 'articles'
  and split_part(name, '/', 2) <> ''
  and exists (
    select 1
    from public.articles
    where articles.id::text = split_part(storage.objects.name, '/', 2)
      and articles.author_id = auth.uid()
  )
);
drop policy if exists "Authors can upload article media"
on storage.objects;

create policy "Authors can upload article media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'media'
  and split_part(name, '/', 1) = 'articles'
  and split_part(name, '/', 2) <> ''
  and exists (
    select 1
    from public.articles
    where articles.id::text = split_part(storage.objects.name, '/', 2)
      and articles.author_id = auth.uid()
  )
);
drop policy if exists "Authors can delete article media"
on storage.objects;

create policy "Authors can delete article media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'media'
  and split_part(name, '/', 1) = 'articles'
  and split_part(name, '/', 2) <> ''
  and exists (
    select 1
    from public.articles
    where articles.id::text = split_part(storage.objects.name, '/', 2)
      and articles.author_id = auth.uid()
  )
);