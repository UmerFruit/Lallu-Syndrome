create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;


create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();


create trigger articles_set_updated_at
before update on public.articles
for each row
execute function public.set_updated_at();