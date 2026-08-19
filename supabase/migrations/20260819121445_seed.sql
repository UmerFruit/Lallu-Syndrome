-- ============================================================
-- 005_seed.sql
-- Seed categories
-- ============================================================

insert into public.categories (slug, name) values
  ('development',  'Development'),
  ('ai',           'AI'),
  ('cybersecurity','Cybersecurity'),
  ('web',          'Web'),
  ('hardware',     'Hardware'),
  ('software',     'Software'),
  ('other',        'Other')
on conflict (slug) do nothing;