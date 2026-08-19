-- ============================================================
-- 003_rls_grants.sql
-- Row Level Security + Grants
-- ============================================================

-- ── Enable RLS ──────────────────────────────────────────────
alter table public.profiles     enable row level security;
alter table public.categories   enable row level security;
alter table public.articles     enable row level security;
alter table public.comments     enable row level security;
alter table public.article_likes enable row level security;

-- ── Profiles ────────────────────────────────────────────────
create policy "Anyone can view profiles"
  on public.profiles for select to public
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;

-- ── Categories ──────────────────────────────────────────────
create policy "Categories are publicly readable"
  on public.categories for select to anon, authenticated
  using (true);

grant select on public.categories to anon, authenticated;

-- ── Articles ────────────────────────────────────────────────
create policy "Published articles are publicly readable"
  on public.articles for select to anon, authenticated
  using (status = 'published');

create policy "Authors can read their own articles"
  on public.articles for select to authenticated
  using (auth.uid() = author_id);

create policy "Authors can create their own articles"
  on public.articles for insert to authenticated
  with check (auth.uid() = author_id);

create policy "Authors can update their own articles"
  on public.articles for update to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "Authors can delete their own articles"
  on public.articles for delete to authenticated
  using (auth.uid() = author_id);

grant select on public.articles to anon;
grant select, insert, update, delete on public.articles to authenticated;

-- ── Comments ────────────────────────────────────────────────
create policy "Comments are publicly readable"
  on public.comments for select to anon, authenticated
  using (true);

create policy "Users can comment on published articles"
  on public.comments for insert to authenticated
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.articles
      where articles.id = comments.article_id
        and articles.status = 'published'
    )
  );

create policy "Users can update their own comments"
  on public.comments for update to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "Users can delete their own comments"
  on public.comments for delete to authenticated
  using (auth.uid() = author_id);

grant select on public.comments to anon, authenticated;
grant insert, update, delete on public.comments to authenticated;

-- ── Article Likes ───────────────────────────────────────────
create policy "Article likes are publicly readable"
  on public.article_likes for select to anon, authenticated
  using (true);

create policy "Users can like articles"
  on public.article_likes for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can remove their own likes"
  on public.article_likes for delete to authenticated
  using (auth.uid() = user_id);

grant select on public.article_likes to anon, authenticated;
grant insert, delete on public.article_likes to authenticated;