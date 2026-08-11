-- ======================= Comments ===============================

create table public.comments (
    id uuid primary key default gen_random_uuid(),

    article_id uuid not null
    references public.articles(id)
    on delete cascade,

    parent_id uuid
    references public.comments(id)
    on delete cascade,

    author_id uuid not null
        references public.profiles(id)
        on delete cascade,

    content text not null,

    created_at timestamptz not null default now(),

    constraint comments_content_length
        check (char_length(content) between 1 and 1000)
);