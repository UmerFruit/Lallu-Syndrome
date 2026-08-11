-- Function to create a profile whenever a new auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (
        id,
        display_name
    )
    values (
        new.id,
        coalesce(
            new.raw_user_meta_data ->> 'name',
            new.email,
            'User'
        )
    );

    return new;
end;
$$;


-- Trigger the function after a new Supabase Auth user is created
create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_user();