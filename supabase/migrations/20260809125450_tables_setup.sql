-- Profiles extend Supabase Auth users with application-specific data.
create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,

    display_name text not null,
    username text unique,

    avatar_url text,
    bio text,

    website_url text,
    github_url text,
    linkedin_url text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.profiles
    add constraint profiles_display_name_length
    check (char_length(display_name) between 1 and 100);

alter table public.profiles
    add constraint profiles_username_length
    check (username is null or char_length(username) between 3 and 30);

alter table public.profiles
    add constraint profiles_bio_length
    check (bio is null or char_length(bio) <= 500);