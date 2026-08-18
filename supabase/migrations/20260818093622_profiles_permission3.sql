-- 1. Fix the Profiles table permissions
grant insert, update on public.profiles to authenticated;

-- 2. BONUS FIX: Article Tags permissions
-- You have RLS policies for article_tags, but you are also missing the grants for it!
-- This will save you a massive headache later when you try to add tags to your articles.
grant insert, delete on public.article_tags to authenticated;