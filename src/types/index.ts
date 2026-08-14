import type { User } from '@supabase/supabase-js';

export type ArticleStatus = 'draft' | 'published';

export type Author = {
  name: string;
  avatar?: string;
  bio?: string;
};

export type Comment = {
  id: string;
  articleId: string;
  author: string;
  avatar?: string;
  content: string;
  createdAt: string;
  parentId?: string | null;
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
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
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
