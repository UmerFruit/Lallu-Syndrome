import type { Article, Comment, ArticleInput } from '@/types';
import type { Database } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { getCategoryBySlug } from '@/services/categoryService';
import { deleteArticleById } from '@/services/articleDeletionService';
import type { QueryData } from '@supabase/supabase-js';
import { slugify } from '@/utils/slugify';
import { getDefaultPublication } from '@/services/publicationService';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type CommentRow = Database['public']['Tables']['comments']['Row'];

const ARTICLE_SELECT = `
  *,
  categories (slug),
  publications!articles_publication_id_fkey (
    id,
    slug,
    name
  ),
  profiles!articles_author_id_fkey (
    display_name,
    username,
    avatar_url,
    bio
  ),
  article_likes (
    count
  )
`;

const articleQuery = supabase
  .from('articles')
  .select(ARTICLE_SELECT);

type ArticleWithRelations = QueryData<typeof articleQuery>[number];

function mapSupabaseArticle(article: ArticleWithRelations): Article {
  const rawCategory = article.categories as any;
  const rawProfile = article.profiles as any;
  const rawPublication = (article as any).publications;

  const publication = Array.isArray(rawPublication)
    ? rawPublication[0]
    : rawPublication;

  if (!rawCategory) {
    throw new Error(`Category not found for article ${article.id}`);
  }

  if (!rawProfile) {
    throw new Error(`Profile not found for article ${article.id}`);
  }

  if (!publication) {
    throw new Error(`Publication not found for article ${article.id}`);
  }

  const likes = article.article_likes?.[0]?.count ?? 0;

  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    content: article.content,
    category: rawCategory.slug,
    coverImage: article.cover_image ?? '',
    publicationId: article.publication_id,
    publication: {
      id: publication.id,
      slug: publication.slug,
      name: publication.name,
    },
    author: {
      name: rawProfile.display_name,
      username: rawProfile.username ?? undefined,
      avatar: rawProfile.avatar_url ?? undefined,
      bio: rawProfile.bio ?? undefined,
    },
    publishedAt: article.published_at ?? undefined,
    createdAt: article.created_at,
    updatedAt: article.updated_at ?? undefined,
    readingTime: article.reading_time ?? 0,
    likes,
    status: article.status,
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
    authorId: comment.author_id,
    author: profile.display_name,
    avatar: profile.avatar_url ?? undefined,
    content: comment.content,
    createdAt: comment.created_at,
    parentId: comment.parent_id,
  };
}

export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 220;

  const parsedDoc = new DOMParser().parseFromString(content, "text/html");
  const plaintext = (parsedDoc.body.textContent || '').trim();

  if (!plaintext) return 1;

  const words = plaintext.split(/\s+/).length;

  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function generateSlug(title: string): string {
  return slugify(title);
}

export async function getArticles(): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_SELECT)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) throw error;

  return data.map(mapSupabaseArticle);
}

export async function getAllArticles(): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_SELECT)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map(mapSupabaseArticle);
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_SELECT)
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapSupabaseArticle(data);
}

export async function getArticleById(id: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_SELECT)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapSupabaseArticle(data);
}

export async function getArticlesByCategory(categorySlug: string): Promise<Article[]> {
  const category = await getCategoryBySlug(categorySlug);

  if (!category) {
    throw new Error(`Category "${categorySlug}" not found.`);
  }

  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_SELECT)
    .eq('status', 'published')
    .eq('category_id', category.id)
    .order('published_at', { ascending: false });

  if (error) throw error;
  return data.map(mapSupabaseArticle);
}

export async function getPublishedArticlesByAuthor(authorId: string): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_SELECT)
    .eq('author_id', authorId)
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (error) throw error;
  return data.map(mapSupabaseArticle);
}

export async function getLatestArticle(): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_SELECT)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  if (!data) return null;

  return mapSupabaseArticle(data);
}

export async function getLatestArticles(count: number = 5): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_SELECT)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(count);

  if (error) throw error;

  return data.map(mapSupabaseArticle);
}

export async function getRelatedArticles(article: Article, count: number = 3): Promise<Article[]> {
  const category = await getCategoryBySlug(article.category);

  if (!category) return [];

  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_SELECT)
    .eq('status', 'published')
    .neq('id', article.id)
    .eq('category_id', category.id)
    .order('published_at', { ascending: false })
    .limit(count);

  if (error) throw error;

  const related = data.map(mapSupabaseArticle);

  if (related.length >= count) return related;

  const { data: additional, error: additionalError } = await supabase
    .from('articles')
    .select(ARTICLE_SELECT)
    .eq('status', 'published')
    .neq('id', article.id)
    .neq('category_id', category.id)
    .order('published_at', { ascending: false })
    .limit(count - related.length);

  if (additionalError) throw additionalError;

  const others = additional.map(mapSupabaseArticle);

  return [...related, ...others];
}

export async function createArticle(data: Partial<ArticleInput>): Promise<Article> {
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

  let publicationId = data.publicationId;

  if (!publicationId) {
    const defaultPublication = await getDefaultPublication(user.id);
    publicationId = defaultPublication.id;
  }

  const title = data.title?.trim() || 'Untitled';
  const content = data.content ?? '';

  const { data: article, error } = await supabase
    .from('articles')
    .insert({
      publication_id: publicationId,
      author_id: user.id,
      category_id: category.id,
      title,
      slug: data.slug ?? generateSlug(title),
      content,
      cover_image: data.coverImage || null,
      status: data.status ?? 'draft',
      published_at: data.publishedAt ?? null,
      reading_time: calculateReadingTime(content),
    })
    .select(ARTICLE_SELECT)
    .single();

  if (error) throw error;

  return mapSupabaseArticle(article);
}

export async function updateArticle(id: string, data: Partial<ArticleInput>): Promise<Article | null> {
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
    updateData.title = data.title.trim() || 'Untitled';
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

  if (data.publishedAt !== undefined) {
    updateData.published_at = data.publishedAt;
  }

  if (data.category !== undefined) {
    const category = await getCategoryBySlug(data.category);

    if (!category) {
      throw new Error(`Category "${data.category}" not found.`);
    }

    updateData.category_id = category.id;
  }
  if (data.publicationId !== undefined) {
    updateData.publication_id = data.publicationId;
  }

  const { data: article, error } = await supabase
    .from('articles')
    .update(updateData)
    .eq('id', id)
    .eq('author_id', user.id)
    .select(ARTICLE_SELECT)
    .single();

  if (error) throw error;

  return mapSupabaseArticle(article);
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
  await deleteArticleById(id);

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

export async function isLiked(articleId: string, userId?: string | null): Promise<boolean> {
  if (!userId) return false;

  const { data, error } = await supabase
    .from('article_likes')
    .select('article_id')
    .eq('article_id', articleId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  return data !== null;
}
export async function getMyArticles(userId: string): Promise<Article[]> {
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("author_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map(mapSupabaseArticle);
}
export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;
}
export async function getArticlesByPublication(publicationSlug: string): Promise<Article[]> {
  const { data: publication, error: publicationError } = await supabase
    .from('publications')
    .select('id')
    .eq('slug', publicationSlug)
    .maybeSingle();

  if (publicationError) throw publicationError;

  if (!publication) return [];

  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_SELECT)
    .eq('status', 'published')
    .eq('publication_id', publication.id)
    .order('published_at', { ascending: false });

  if (error) throw error;

  return data.map(mapSupabaseArticle);
}