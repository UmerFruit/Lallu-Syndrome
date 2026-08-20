create trigger articles_handle_publication_insert
before insert on public.articles
for each row execute function public.handle_article_publication();

with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.articles
    where articles.id = article_likes.article_id
    and articles.status = 'published'
  )
);