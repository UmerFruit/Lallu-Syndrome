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
        where articles.id = split_part(name, '/', 2)::uuid
        and articles.author_id = auth.uid()
    )
);