import type { Article, Comment, Category, ArticleInput } from '@/types';
import type { Database } from '@/types/database';
import { supabase } from '@/lib/supabase';
import {
getCategoryBySlug,
getCategoryById,
} from '@/services/categoryService';

type ArticleRow = Database['public']['Tables']['articles']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type CommentRow = Database['public']['Tables']['comments']['Row'];


function createExcerpt(content: string): string {
return content.length > 150
  ? `${content.substring(0, 150)}...`
  : content;
}

function mapSupabaseArticle(
article: ArticleRow,
category: Category,
profile: ProfileRow,
tags: string[]
): Article {
return {
  id: article.id,
  slug: article.slug,
  title: article.title,
  excerpt: createExcerpt(article.content),
  content: article.content,
  category: category.slug,
  tags,
  coverImage: article.cover_image ?? '',
  author: {
    name: profile.display_name,
    avatar: profile.avatar_url ?? undefined,
    bio: profile.bio ?? undefined,
  },
  publishedAt: article.published_at ?? undefined,
  createdAt: article.created_at,
  updatedAt: article.updated_at ?? undefined,
  readingTime: article.reading_time ?? 0,
  likes: 0,
  status: article.status,
};
}

async function getArticleTags(articleId: string): Promise<string[]> {
const { data: articleTags, error: articleTagsError } = await supabase
  .from('article_tags')
  .select('tag_id')
  .eq('article_id', articleId);

if (articleTagsError) throw articleTagsError;

const tagIds = articleTags.map((tag) => tag.tag_id);

if (tagIds.length === 0) return [];

const { data: tags, error: tagsError } = await supabase
  .from('tags')
  .select('name')
  .in('id', tagIds);

if (tagsError) throw tagsError;

return tags.map((tag) => tag.name);
}

async function hydrateArticles(
articles: ArticleRow[]
): Promise<Article[]> {
return Promise.all(articles.map(hydrateArticle));
}

async function hydrateArticle(article: ArticleRow): Promise<Article> {
const [category, profileResult, tags, likes] = await Promise.all([
  getCategoryById(article.category_id),
  supabase
    .from('profiles')
    .select('display_name, avatar_url, bio')
    .eq('id', article.author_id)
    .single(),
  getArticleTags(article.id),
  getArticleLikeCount(article.id),

]);

const { data: profile, error: profileError } = profileResult;

if (profileError) throw profileError;

if (!category) {
  throw new Error(`Category not found for article ${article.id}`);
}

if (!profile) {
  throw new Error(`Profile not found for author ${article.author_id}`);
}

const mappedArticle = mapSupabaseArticle(
  article,
  category,
  profile as ProfileRow,
  tags
);

return {
  ...mappedArticle,
  likes,
};
}

async function getArticleLikeCount(articleId: string): Promise<number> {
const { count, error } = await supabase
  .from('article_likes')
  .select('*', { count: 'exact', head: true })
  .eq('article_id', articleId);

if (error) throw error;

return count ?? 0;
}

function mapSupabaseComment(
comment: CommentRow,
profile: Pick<ProfileRow, 'display_name' | 'avatar_url'>
): Comment {
return {
  id: comment.id,
  articleId: comment.article_id,
  author: profile.display_name,
  avatar: profile.avatar_url ?? undefined,
  content: comment.content,
  createdAt: comment.created_at,
  parentId: comment.parent_id,
};
}

export function calculateReadingTime(content: string): number {
const wordsPerMinute = 200;
const trimmedContent = content.trim();

if (!trimmedContent) return 1;

const words = trimmedContent.split(/\s+/).length;

return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function generateSlug(title: string): string {
return title
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');
}

export async function getArticles(): Promise<Article[]> {
const { data, error } = await supabase
  .from('articles')
  .select('*')
  .eq('status', 'published')
  .order('published_at', { ascending: false });

if (error) throw error;

return hydrateArticles(data);
}

export async function getAllArticles(): Promise<Article[]> {
const { data, error } = await supabase
  .from('articles')
  .select('*')
  .order('created_at', { ascending: false });

if (error) throw error;

return hydrateArticles(data);
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
const { data, error } = await supabase
  .from('articles')
  .select('*')
  .eq('slug', slug)
  .single();

if (error) {
  if (error.code === 'PGRST116') return null;
  throw error;
}

return hydrateArticle(data);
}

export async function getArticleById(id: string): Promise<Article | null> {
const { data, error } = await supabase
  .from('articles')
  .select('*')
  .eq('id', id)
  .single();

if (error) {
  if (error.code === 'PGRST116') return null;
  throw error;
}

return hydrateArticle(data);
}

export async function getArticlesByCategory(
categorySlug: string
): Promise<Article[]> {
const category = await getCategoryBySlug(categorySlug);

if (!category) {
  throw new Error(`Category "${categorySlug}" not found.`);
}

const { data, error } = await supabase
  .from('articles')
  .select('*')
  .eq('status', 'published')
  .eq('category_id', category.id)
  .order('published_at', { ascending: false });

if (error) throw error;
return hydrateArticles(data);
}

export async function getLatestArticle(): Promise<Article | null> {
const { data, error } = await supabase
  .from('articles')
  .select('*')
  .eq('status', 'published')
  .order('published_at', { ascending: false })
  .limit(1)
  .maybeSingle();

if (error) throw error;

if (!data) return null;

return hydrateArticle(data);
}

export async function getLatestArticles(
count: number = 5
): Promise<Article[]> {
const { data, error } = await supabase
  .from('articles')
  .select('*')
  .eq('status', 'published')
  .order('published_at', { ascending: false })
  .limit(count);

if (error) throw error;

return hydrateArticles(data);
}

export async function getRelatedArticles(
article: Article,
count: number = 3
): Promise<Article[]> {
const category = await getCategoryBySlug(article.category);

if (!category) return [];

const { data, error } = await supabase
  .from('articles')
  .select('*')
  .eq('status', 'published')
  .neq('id', article.id)
  .eq('category_id', category.id)
  .order('published_at', { ascending: false })
  .limit(count);

if (error) throw error;

const related = await hydrateArticles(data);

if (related.length >= count) return related;

const { data: additional, error: additionalError } = await supabase
  .from('articles')
  .select('*')
  .eq('status', 'published')
  .neq('id', article.id)
  .neq('category_id', category.id)
  .order('published_at', { ascending: false })
  .limit(count - related.length);

if (additionalError) throw additionalError;

const others = await Promise.all(
  additional.map((item) => hydrateArticle(item as ArticleRow))
);

return [...related, ...others];
}

export async function createArticle(
data: Partial<ArticleInput>
): Promise<Article> {
const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser();

if (authError) throw authError;

if (!user) {
  throw new Error('You must be logged in to create an article.');
}

const categorySlug = data.category ?? 'development';
const category = await getCategoryBySlug(categorySlug);

if (!category) {
  throw new Error(`Category "${categorySlug}" not found.`);
}

const title = data.title ?? 'Untitled';
const content = data.content ?? '';

const { data: article, error } = await supabase
  .from('articles')
  .insert({
    author_id: user.id,
    category_id: category.id,
    title,
    slug: data.slug ?? generateSlug(title),
    content,
    cover_image: data.coverImage || null,
    status: data.status ?? 'draft',
    reading_time: calculateReadingTime(content),
  })
  .select()
  .single();

if (error) throw error;

return hydrateArticle(article as ArticleRow);
}

export async function updateArticle(
id: string,
data: Partial<ArticleInput>
): Promise<Article | null> {
const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser();

if (authError) throw authError;

if (!user) {
  throw new Error('You must be logged in to update an article.');
}

const updateData: Database['public']['Tables']['articles']['Update'] = {};

if (data.title !== undefined) {
  updateData.title = data.title;
}

if (data.slug !== undefined) {
  updateData.slug = data.slug;
}

if (data.content !== undefined) {
  updateData.content = data.content;
  updateData.reading_time = calculateReadingTime(data.content);
}

if (data.coverImage !== undefined) {
  updateData.cover_image = data.coverImage || null;
}

if (data.status !== undefined) {
  updateData.status = data.status;
}

if (data.category !== undefined) {
  const category = await getCategoryBySlug(data.category);

  if (!category) {
    throw new Error(`Category "${data.category}" not found.`);
  }

  updateData.category_id = category.id;
}

const { data: article, error } = await supabase
  .from('articles')
  .update(updateData)
  .eq('id', id)
  .eq('author_id', user.id)
  .select()
  .single();

if (error) throw error;

return hydrateArticle(article as ArticleRow);
}

export async function deleteArticle(id: string): Promise<boolean> {
const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser();

if (authError) throw authError;

if (!user) {
  throw new Error('You must be logged in to delete an article.');
}

const { error } = await supabase
  .from('articles')
  .delete()
  .eq('id', id)
  .eq('author_id', user.id);

if (error) throw error;

return true;
}

export async function getComments(articleId: string): Promise<Comment[]> {
const { data: comments, error } = await supabase
  .from('comments')
  .select(`
    id,
    article_id,
    parent_id,
    author_id,
    content,
    created_at,
    profiles!comments_author_id_fkey (
      display_name,
      avatar_url
    )
  `)
  .eq('article_id', articleId)
  .order('created_at', { ascending: true });

if (error) throw error;

return comments.map((comment) => {
  const profile = Array.isArray(comment.profiles)
    ? comment.profiles[0]
    : comment.profiles;

  if (!profile) {
    throw new Error(`Profile not found for comment ${comment.id}`);
  }

  return mapSupabaseComment(
    {
      id: comment.id,
      article_id: comment.article_id,
      parent_id: comment.parent_id,
      author_id: comment.author_id,
      content: comment.content,
      created_at: comment.created_at,
    },
    profile 
  );
});
}

export async function addComment(
articleId: string,
content: string,
parentId: string | null = null
): Promise<Comment> {
const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser();

if (authError) throw authError;

if (!user) {
  throw new Error('You must be logged in to comment.');
}

const { data: comment, error } = await supabase
  .from('comments')
  .insert({
    article_id: articleId,
    parent_id: parentId,
    author_id: user.id,
    content,
  })
  .select(`
    id,
    article_id,
    parent_id,
    author_id,
    content,
    created_at,
    profiles!comments_author_id_fkey (
      display_name,
      avatar_url
    )
  `)
  .single();

if (error) throw error;

const profile = Array.isArray(comment.profiles)
  ? comment.profiles[0]
  : comment.profiles;

if (!profile) {
  throw new Error(`Profile not found for comment ${comment.id}`);
}

return mapSupabaseComment(
  {
    id: comment.id,
    article_id: comment.article_id,
    parent_id: comment.parent_id,
    author_id: comment.author_id,
    content: comment.content,
    created_at: comment.created_at,
  },
  profile 
);
}
export async function toggleLike(
articleId: string
): Promise<{ liked: boolean; likes: number }> {
const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser();

if (authError) throw authError;

if (!user) {
  throw new Error('You must be logged in to like an article.');
}

const { data: existingLike, error: existingLikeError } = await supabase
  .from('article_likes')
  .select('article_id')
  .eq('article_id', articleId)
  .eq('user_id', user.id)
  .maybeSingle();

if (existingLikeError) throw existingLikeError;

if (existingLike) {
  const { error: deleteError } = await supabase
    .from('article_likes')
    .delete()
    .eq('article_id', articleId)
    .eq('user_id', user.id);

  if (deleteError) throw deleteError;

  const likes = await getArticleLikeCount(articleId);

  return {
    liked: false,
    likes,
  };
}

const { error: insertError } = await supabase
  .from('article_likes')
  .insert({
    article_id: articleId,
    user_id: user.id,
  });

if (insertError) throw insertError;

const likes = await getArticleLikeCount(articleId);

return {
  liked: true,
  likes,
};
}

export async function isLiked(articleId: string): Promise<boolean> {
const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser();


if (authError || !user)  return false; 

const { data, error } = await supabase
  .from('article_likes')
  .select('article_id')
  .eq('article_id', articleId)
  .eq('user_id', user.id)
  .maybeSingle();

if (error) throw error;

return data !== null;
}