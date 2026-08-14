-- Seed: Building a Type-Safe API with Zod and TypeScript

begin;

-- ============================================================
-- 1. Create tags if they do not already exist
-- ============================================================

insert into public.tags (slug, name)
values
    ('typescript', 'TypeScript'),
    ('zod', 'Zod'),
    ('api', 'API'),
    ('validation', 'Validation')
on conflict (slug) do update
set name = excluded.name;


-- ============================================================
-- 2. Insert the article if it does not already exist
-- ============================================================

with inserted_article as (
    insert into public.articles (
        author_id,
        category_id,
        title,
        slug,
        content,
        cover_image,
        status,
        reading_time,
        published_at,
        updated_at,
        created_at
    )
    select
        p.id,
        c.id,
        'Building a Type-Safe API with Zod and TypeScript',
        'building-a-type-safe-api-with-zod-and-typescript',
        $$## The Problem with TypeScript APIs

TypeScript gives you compile-time safety, but at runtime, your types are gone. An API endpoint that expects a `{ name: string; age: number }` body will happily accept `{ name: 42, age: "hello" }` because the type annotation is a lie the compiler tells you.

**The fix**: validate at the boundary, and derive types from the validation schema.

## Setting Up Zod

Zod lets you define schemas that validate runtime data while TypeScript infers the corresponding types.

This gives you a single source of truth for your API contracts.

## Why Runtime Validation Matters

TypeScript only exists during development and compilation. Once your application receives JSON from an API request, that data does not magically become safe because you wrote an interface.

Runtime validation checks the actual values entering your application.

## Building a Schema

A schema describes the shape of valid input.

For example, an API could require a name to be a string and an age to be a valid number. Invalid requests can then be rejected before they reach the rest of your application.

## A Single Source of Truth

The real advantage is avoiding duplicated definitions.

Without validation, you might define TypeScript interfaces separately from runtime validation logic. Those definitions can slowly drift apart as the application changes.

By deriving TypeScript types from Zod schemas, your validation rules and compile-time types stay connected.

## Final Thoughts

TypeScript provides compile-time safety. Zod provides runtime validation.

Using both gives your API stronger boundaries and helps catch invalid data before it spreads through your application.$$,
        'https://cdn.thenewstack.io/media/2022/01/10b88c68-typescript-logo.png',
        'published',
        8,
        '2026-08-08T09:00:00Z'::timestamptz,
        '2026-08-08T14:30:00Z'::timestamptz,
        '2026-08-08T09:00:00Z'::timestamptz
    from public.profiles p
    cross join public.categories c
    where p.display_name = 'UmerFruit'
      and c.slug = 'development'
    on conflict (slug) do update
    set
        title = excluded.title,
        content = excluded.content,
        cover_image = excluded.cover_image,
        status = excluded.status,
        reading_time = excluded.reading_time,
        published_at = excluded.published_at,
        updated_at = excluded.updated_at
    returning id
)

-- ============================================================
-- 3. Attach tags to the article
-- ============================================================

insert into public.article_tags (article_id, tag_id)
select
    a.id,
    t.id
from inserted_article a
cross join public.tags t
where t.slug in (
    'typescript',
    'zod',
    'api',
    'validation'
)
on conflict (article_id, tag_id) do nothing;

commit;