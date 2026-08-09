import type { Article, Comment, ArticleStatus } from '@/types';
import { articles as mockArticles, mockComments, categories } from '@/data/mockData';

const STORAGE_KEY = 'ls_articles';
const COMMENTS_KEY = 'ls_comments';
const LIKES_KEY = 'ls_likes';

function getStoredArticles(): Article[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return [...mockArticles];
}

function saveArticles(arts: Article[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arts));
  } catch {
    // ignore
  }
}

function getStoredComments(): Comment[] {
  try {
    const stored = localStorage.getItem(COMMENTS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return [...mockComments];
}

function saveComments(comments: Comment[]): void {
  try {
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
  } catch {
    // ignore
  }
}

function getLikedArticles(): Set<string> {
  try {
    const stored = localStorage.getItem(LIKES_KEY);
    if (stored) return new Set(JSON.parse(stored));
  } catch {
    // ignore
  }
  return new Set();
}

function saveLikedArticles(liked: Set<string>): void {
  try {
    localStorage.setItem(LIKES_KEY, JSON.stringify([...liked]));
  } catch {
    // ignore
  }
}

export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export async function getArticles(): Promise<Article[]> {
  return simulateDelay(getStoredArticles().filter((a) => a.status === 'published'));
}

export async function getAllArticles(): Promise<Article[]> {
  return simulateDelay(getStoredArticles());
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const all = getStoredArticles();
  return simulateDelay(all.find((a) => a.slug === slug) ?? null);
}

export async function getArticleById(id: string): Promise<Article | null> {
  const all = getStoredArticles();
  return simulateDelay(all.find((a) => a.id === id) ?? null);
}

export async function getArticlesByCategory(category: string): Promise<Article[]> {
  const all = getStoredArticles();
  return simulateDelay(
    all.filter((a) => a.status === 'published' && a.category === category)
  );
}

export async function getLatestArticle(): Promise<Article | null> {
  const published = getStoredArticles().filter((a) => a.status === 'published');
  if (published.length === 0) return null;
  const sorted = [...published].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  return simulateDelay(sorted[0]);
}

export async function getLatestArticles(count: number = 5): Promise<Article[]> {
  const published = getStoredArticles().filter((a) => a.status === 'published');
  const sorted = [...published].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  return simulateDelay(sorted.slice(0, count));
}

export async function getRelatedArticles(article: Article, count: number = 3): Promise<Article[]> {
  const published = getStoredArticles().filter(
    (a) => a.status === 'published' && a.id !== article.id
  );
  const sameCategory = published.filter((a) => a.category === article.category);
  const others = published.filter((a) => a.category !== article.category);
  const result = [...sameCategory, ...others].slice(0, count);
  return simulateDelay(result);
}

export async function createArticle(data: Partial<Article>): Promise<Article> {
  const all = getStoredArticles();
  const newArticle: Article = {
    id: crypto.randomUUID(),
    slug: data.slug || generateSlug(data.title || 'untitled'),
    title: data.title || 'Untitled',
    excerpt: data.excerpt || '',
    content: data.content || '',
    category: data.category || 'development',
    tags: data.tags || [],
    coverImage: data.coverImage || '',
    author: data.author || { name: 'Umer Farooq' },
    publishedAt: data.publishedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    readingTime: calculateReadingTime(data.content || ''),
    likes: 0,
    status: data.status || 'draft',
  };
  all.unshift(newArticle);
  saveArticles(all);
  return simulateDelay(newArticle);
}

export async function updateArticle(id: string, data: Partial<Article>): Promise<Article | null> {
  const all = getStoredArticles();
  const idx = all.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  const updated: Article = {
    ...all[idx],
    ...data,
    id: all[idx].id,
    updatedAt: new Date().toISOString(),
    readingTime: calculateReadingTime(data.content ?? all[idx].content),
  };
  all[idx] = updated;
  saveArticles(all);
  return simulateDelay(updated);
}

export async function deleteArticle(id: string): Promise<boolean> {
  const all = getStoredArticles();
  const filtered = all.filter((a) => a.id !== id);
  saveArticles(filtered);
  return simulateDelay(true);
}

export async function getComments(articleId: string): Promise<Comment[]> {
  const all = getStoredComments();
  return simulateDelay(all.filter((c) => c.articleId === articleId));
}

export async function addComment(
  articleId: string,
  author: string,
  content: string,
  parentId?: string | null
): Promise<Comment> {
  const all = getStoredComments();
  const newComment: Comment = {
    id: crypto.randomUUID(),
    articleId,
    author,
    content,
    createdAt: new Date().toISOString(),
    parentId: parentId ?? null,
  };
  all.push(newComment);
  saveComments(all);
  return simulateDelay(newComment);
}

export async function toggleLike(articleId: string): Promise<{ liked: boolean; likes: number }> {
  const all = getStoredArticles();
  const idx = all.findIndex((a) => a.id === articleId);
  if (idx === -1) return { liked: false, likes: 0 };

  const liked = getLikedArticles();
  const isLiked = liked.has(articleId);

  if (isLiked) {
    liked.delete(articleId);
    all[idx].likes = Math.max(0, all[idx].likes - 1);
  } else {
    liked.add(articleId);
    all[idx].likes += 1;
  }

  saveLikedArticles(liked);
  saveArticles(all);
  return simulateDelay({ liked: !isLiked, likes: all[idx].likes });
}

export async function isLiked(articleId: string): Promise<boolean> {
  return simulateDelay(getLikedArticles().has(articleId));
}

export function getCategories() {
  return categories;
}

export function getCategoryBySlug(slug: string) {
  return categories.find((c) => c.slug === slug);
}

function simulateDelay<T>(value: T, ms: number = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
