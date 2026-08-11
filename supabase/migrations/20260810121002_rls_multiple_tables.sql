---------------------Categories----------------------
alter table public.categories enable row level security;

create policy "Categories are publicly readable"
on public.categories
for select
to anon, authenticated
using (true);


--------------------Articles-------------------------
alter table public.articles enable row level security;


create policy "Published articles are publicly readable"
on public.articles
for select
to anon, authenticated
using (
    status = 'published'
);


create policy "Authors can read their own articles"
on public.articles
for select
to authenticated
using (
    auth.uid() = author_id
);


create policy "Authors can create their own articles"
on public.articles
for insert
to authenticated
with check (
    auth.uid() = author_id
);


create policy "Authors can update their own articles"
on public.articles
for update
to authenticated
using (
    auth.uid() = author_id
)
with check (
    auth.uid() = author_id
);


create policy "Authors can delete their own articles"
on public.articles
for delete
to authenticated
using (
    auth.uid() = author_id
);

-----------------tags-----------------------------
alter table public.tags enable row level security;

create policy "Tags are publicly readable"
on public.tags
for select
to anon, authenticated
using (true);

--------------Articles_tags----------------------------
alter table public.article_tags enable row level security;


create policy "Article tags are publicly readable"
on public.article_tags
for select
to anon, authenticated
using (true);


create policy "Authors can add tags to their own articles"
on public.article_tags
for insert
to authenticated
with check (
    exists (
        select 1
        from public.articles
        where articles.id = article_tags.article_id
        and articles.author_id = auth.uid()
    )
);


create policy "Authors can remove tags from their own articles"
on public.article_tags
for delete
to authenticated
using (
    exists (
        select 1
        from public.articles
        where articles.id = article_tags.article_id
        and articles.author_id = auth.uid()
    )
);

-------------comments-------------------------------
alter table public.comments enable row level security;


create policy "Comments are publicly readable"
on public.comments
for select
to anon, authenticated
using (true);


create policy "Users can comment on published articles"
on public.comments
for insert
to authenticated
with check (
    auth.uid() = author_id
    and exists (
        select 1
        from public.articles
        where articles.id = comments.article_id
        and articles.status = 'published'
    )
);


create policy "Users can update their own comments"
on public.comments
for update
to authenticated
using (
    auth.uid() = author_id
)
with check (
    auth.uid() = author_id
);


create policy "Users can delete their own comments"
on public.comments
for delete
to authenticated
using (
    auth.uid() = author_id
);