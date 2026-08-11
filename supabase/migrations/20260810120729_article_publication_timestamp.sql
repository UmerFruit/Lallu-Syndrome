create or replace function public.handle_article_publication()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
    if new.status = 'published' then
        if old.status = 'draft' or new.published_at is null then
            new.published_at = now();
        end if;
    elsif new.status = 'draft' then
        new.published_at = null;
    end if;

    return new;
end;
$$;


create trigger articles_handle_publication
before update on public.articles
for each row
execute function public.handle_article_publication();