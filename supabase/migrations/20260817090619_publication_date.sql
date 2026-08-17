create or replace function public.handle_article_publication()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
    if new.status = 'published' then
        if new.published_at is null then
            new.published_at = now();
        end if;
    elsif new.status = 'draft' then
        new.published_at = null;
    end if;

    return new;
end;
$$;