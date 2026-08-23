import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';
import { deleteArticleById } from '@/services/articleDeletionService';
import { FunctionsHttpError } from '@supabase/supabase-js';

export type AdminProfile = Profile & {
  last_sign_in_at: string | null;
};

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
export async function getAllProfiles(): Promise<AdminProfile[]> {
  const { data, error } = await supabase.functions.invoke('get-users-admin');
  if (error) {
    let message = 'Failed to fetch users.';
    if (error instanceof FunctionsHttpError) {
      try {
        const body = await error.context.json();
        if (body?.error) message = body.error;
      } catch {
        console.error('Failed to parse error response from get-users-admin function:', error);
      }
    }
    throw new Error(message);
  }
  return (data?.users ?? []) as AdminProfile[];
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
  await deleteArticleById(articleId);
}
// ─── Delete User ─────────────────────────────────────────
export async function adminDeleteUser(userId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-user', {
    body: { userId },
  });
  if (error) {
    let message = 'Failed to delete user.';
    if (error instanceof FunctionsHttpError) {
      try {
        const body = await error.context.json();
        if (body?.error) message = body.error;
      } catch {
        console.error('Failed to parse error response from delete-user function:', error);
      }
    }
    throw new Error(message);
  }
}