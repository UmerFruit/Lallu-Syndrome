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
  slug: string;
  name: string;
  description: string;
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
  publishedAt: string;
  updatedAt?: string;
  readingTime: number;
  likes: number;
  status: ArticleStatus;
};

export type User = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
};

export type AuthState = {
  user: User | null;
  isLoading: boolean;
};
