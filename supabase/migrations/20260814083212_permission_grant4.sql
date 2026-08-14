grant select
on public.comments
to anon, authenticated;

grant insert, update, delete
on public.comments
to authenticated;