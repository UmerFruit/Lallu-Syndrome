-- ======================= Article Likes ===============================

create table public.article_likes (
    article_id uuid not null
        references public.articles(id)
        on delete cascade,

    user_id uuid not null
        references public.profiles(id)
        on delete cascade,

    created_at timestamptz not null default now(),

    primary key (article_id, user_id)
);
-- ======================= RLS =========================================

alter table public.article_likes enable row level security;


create policy "Article likes are publicly readable"
on public.article_likes
for select
to anon, authenticated
using (true);


create policy "Users can like articles"
on public.article_likes
for insert
to authenticated
with check (
    auth.uid() = user_id
);


create policy "Users can remove their own likes"
on public.article_likes
for delete
to authenticated
using (
    auth.uid() = user_id
);


-- ======================= Permissions =================================

grant select
on public.article_likes
to anon, authenticated;

grant insert, delete
on public.article_likes
to authenticated;