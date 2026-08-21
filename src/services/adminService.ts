import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';
import { deleteArticleMedia } from '@/services/storageService';

export type AdminComment = {
  id: string;
  article_id: string;
  author_id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  author_name: string;
  author_avatar: string | null;
  article_title: string;
};

export type AdminArticle = {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  created_at: string;
  published_at: string | null;
  author_name: string;
  author_id: string;
  category_name: string;
};

// ─── Users ───────────────────────────────────────────────────
export async function getAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Profile[];
}

export async function updateUserAdminStatus(
  userId: string,
  isAdmin: boolean
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_admin: isAdmin })
    .eq('id', userId);

  if (error) throw error;
}
// ─── Comments ────────────────────────────────────────────────
export async function getAllComments(): Promise<AdminComment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      id,
      article_id,
      author_id,
      content,
      created_at,
      parent_id,
      profiles!comments_author_id_fkey (
        display_name,
        avatar_url
      ),
      articles!comments_article_id_fkey (
        title
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;

  return data.map((row: any) => ({
    id: row.id,
    article_id: row.article_id,
    author_id: row.author_id,
    content: row.content,
    created_at: row.created_at,
    parent_id: row.parent_id,
    author_name: row.profiles?.display_name ?? 'Unknown',
    author_avatar: row.profiles?.avatar_url ?? null,
    article_title: row.articles?.title ?? 'Unknown Article',
  }));
}

export async function adminDeleteComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;
}

// ─── Articles ────────────────────────────────────────────────
export async function getAllArticlesAdmin(): Promise<AdminArticle[]> {
  const { data, error } = await supabase
    .from('articles')
    .select(`
      id,
      title,
      slug,
      status,
      created_at,
      published_at,
      author_id,
      profiles!articles_author_id_fkey (
        display_name
      ),
      categories (
        name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map((row: any) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    status: row.status,
    created_at: row.created_at,
    published_at: row.published_at,
    author_id: row.author_id,
    author_name: row.profiles?.display_name ?? 'Unknown',
    category_name: row.categories?.name ?? 'Uncategorized',
  }));
}

export async function adminDeleteArticle(articleId: string): Promise<void> {
  const { data: article, error: fetchError } = await supabase
    .from('articles')
    .select('content, cover_image')
    .eq('id', articleId)
    .single();
  if (fetchError) throw fetchError;

  try {
    await deleteArticleMedia(article.content, article.cover_image);
  } catch (error) {
    console.error('Failed to clean up article media:', error);
  }

  const { error } = await supabase
    .from('articles')
    .delete()
    .eq('id', articleId);

  if (error) throw error;
}