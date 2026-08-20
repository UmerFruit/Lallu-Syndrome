import type { User } from '@supabase/supabase-js';

export type ArticleStatus = 'draft' | 'published';

export type Author = {
  name: string;
  username?: string;
  avatar?: string;
  bio?: string;
};

export type ArticleInput = Pick<
  Article,
  'title' | 'slug' | 'content' | 'category' | 'coverImage' | 'status' | 'publishedAt'
>;

export type Comment = {
  id: string;
  articleId: string;
  authorId: string;
  author: string;
  avatar?: string;
  content: string;
  createdAt: string;
  parentId: string | null;
};

export type Category = {
  id: number;
  slug: string;
  name: string;
};

export type Article = {
  id: string;
  slug: string;
  title: string;
  content: string;
  category: string;
  coverImage: string;
  author: Author;
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
  readingTime: number;
  likes: number;
  status: ArticleStatus;
};

export type AuthState = {
  user: User | null;
  isLoading: boolean;
};

export type Profile = {
  id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  website_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  is_admin: boolean; 
  created_at: string;
  updated_at: string;
};

export type ProfileSaveValues = {
  display_name: string;
  username?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  website_url?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
};