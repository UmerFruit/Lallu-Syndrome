-- ============================================================
-- 002_functions_triggers.sql
-- All functions and triggers
-- ============================================================

-- updated_at auto-set
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
  for each row execute function public.set_updated_at();

create trigger articles_set_updated_at
  before update on public.articles
  for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.email, 'User')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Publication date management
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

create trigger articles_handle_publication
  before update on public.articles
  for each row execute function public.handle_article_publication();