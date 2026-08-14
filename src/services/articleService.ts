import type { Article, Comment, Category } from '@/types';
import { supabase } from '@/lib/supabase';
import {
  getCategoryBySlug,
  getCategoryById,
} from '@/services/categoryService';
import { mockComments } from '@/data/mockData';

const COMMENTS_KEY = 'ls_comments';
const LIKES_KEY = 'ls_likes';

type SupabaseArticle = {
  id: string;
  author_id: string;
  category_id: number;
  title: string;
  slug: string;
  content: string;
  cover_image: string | null;
  status: Article['status'];
  reading_time: number | null;
  published_at: string | null;
  updated_at: string | null;
  created_at: string;
};

type SupabaseProfile = {
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
};

function createExcerpt(content: string): string {
  return content.length > 150
    ? `${content.substring(0, 150)}...`
    : content;
}

function mapSupabaseArticle(
  article: SupabaseArticle,
  category: Category,
  profile: SupabaseProfile,
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

async function hydrateArticle(article: SupabaseArticle): Promise<Article> {
  const [category, profileResult, tags] = await Promise.all([
    getCategoryById(article.category_id),
    supabase
      .from('profiles')
      .select('display_name, avatar_url, bio')
      .eq('id', article.author_id)
      .single(),
    getArticleTags(article.id),
  ]);

  const { data: profile, error: profileError } = profileResult;

  if (profileError) throw profileError;

  if (!category) {
    throw new Error(`Category not found for article ${article.id}`);
  }

  if (!profile) {
    throw new Error(`Profile not found for author ${article.author_id}`);
  }

  return mapSupabaseArticle(
    article,
    category,
    profile as SupabaseProfile,
    tags
  );
}

async function getStoredComments(): Promise<Comment[]> {
  try {
    const stored = localStorage.getItem(COMMENTS_KEY);

    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore localStorage errors.
  }

  return [...mockComments];
}

function saveComments(comments: Comment[]): void {
  try {
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
  } catch {
    // Ignore localStorage errors.
  }
}

function getLikedArticles(): Set<string> {
  try {
    const stored = localStorage.getItem(LIKES_KEY);

    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch {
    // Ignore localStorage errors.
  }

  return new Set();
}

function saveLikedArticles(liked: Set<string>): void {
  try {
    localStorage.setItem(LIKES_KEY, JSON.stringify([...liked]));
  } catch {
    // Ignore localStorage errors.
  }
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

  return Promise.all(
    data.map((article) => hydrateArticle(article as SupabaseArticle))
  );
}

export async function getAllArticles(): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return Promise.all(
    data.map((article) => hydrateArticle(article as SupabaseArticle))
  );
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

  return hydrateArticle(data as SupabaseArticle);
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

  return hydrateArticle(data as SupabaseArticle);
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

  return Promise.all(
    data.map((article) => hydrateArticle(article as SupabaseArticle))
  );
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

  return hydrateArticle(data as SupabaseArticle);
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

  return Promise.all(
    data.map((article) => hydrateArticle(article as SupabaseArticle))
  );
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

  const related = await Promise.all(
    data.map((item) => hydrateArticle(item as SupabaseArticle))
  );

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
    additional.map((item) => hydrateArticle(item as SupabaseArticle))
  );

  return [...related, ...others];
}

export async function createArticle(
  data: Partial<Article>
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

  return hydrateArticle(article as SupabaseArticle);
}

export async function updateArticle(
  id: string,
  data: Partial<Article>
): Promise<Article | null> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;

  if (!user) {
    throw new Error('You must be logged in to update an article.');
  }

  const updateData: Record<string, unknown> = {};

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

  return hydrateArticle(article as SupabaseArticle);
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
  const comments = await getStoredComments();

  return comments.filter((comment) => comment.articleId === articleId);
}

export async function addComment(
  articleId: string,
  author: string,
  content: string,
  parentId?: string | null
): Promise<Comment> {
  const comments = await getStoredComments();

  const newComment: Comment = {
    id: crypto.randomUUID(),
    articleId,
    author,
    content,
    createdAt: new Date().toISOString(),
    parentId: parentId ?? null,
  };

  comments.push(newComment);
  saveComments(comments);

  return newComment;
}

export async function toggleLike(
  articleId: string
): Promise<{ liked: boolean; likes: number }> {
  const liked = getLikedArticles();
  const isCurrentlyLiked = liked.has(articleId);

  if (isCurrentlyLiked) {
    liked.delete(articleId);
  } else {
    liked.add(articleId);
  }

  saveLikedArticles(liked);

  return {
    liked: !isCurrentlyLiked,
    likes: 0,
  };
}

export async function isLiked(articleId: string): Promise<boolean> {
  return getLikedArticles().has(articleId);
}