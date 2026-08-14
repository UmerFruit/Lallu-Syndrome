import type { Article, Comment, ArticleStatus, Category } from '@/types';
import { supabase } from '@/lib/supabase';
import {
        getCategoryBySlug as getSupabaseCategoryBySlug,
        getCategoryById as getSupabaseCategoryById,
        getCategoryBySlug,
        getCategoryById,
} from '@/services/categoryService';
import { articles as mockArticles, mockComments, categories } from '@/data/mockData';
const STORAGE_KEY = 'ls_articles';
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
        updated_at: string;
        created_at: string;
};

type SupabaseProfile = {
        display_name: string;
        avatar_url: string | null;
        bio: string | null;
};

function createExcerpt(content: string): string {
        if (content.length <= 150) {
                return content;
        }
        return `${content.substring(0, 150)}...`;
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
                publishedAt: article.published_at ?? '',
                updatedAt: article.updated_at,
                readingTime: article.reading_time ?? 0,
                likes: 0,
                status: article.status,
        };
}


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
        const { data: article, error } = await supabase
                .from('articles')
                .select('*')
                .eq('id', id)
                .single();

        if (error) {
                if (error.code === 'PGRST116') {
                        return null;
                }

                throw error;
        }

        const category = await getSupabaseCategoryById(article.category_id);

        const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('display_name, avatar_url, bio')
                .eq('id', article.author_id)
                .single();

        if (profileError) {
                throw profileError;
        }

        const { data: articleTags, error: articleTagsError } = await supabase
                .from('article_tags')
                .select('tag_id')
                .eq('article_id', id);

        if (articleTagsError) {
                throw articleTagsError;
        }

        const tagIds = articleTags.map((tag) => tag.tag_id);

        let tags: string[] = [];

        if (tagIds.length > 0) {
                const { data: tagRows, error: tagsError } = await supabase
                        .from('tags')
                        .select('name')
                        .in('id', tagIds);

                if (tagsError) {
                        throw tagsError;
                }

                tags = tagRows.map((tag) => tag.name);
        }

        return mapSupabaseArticle(
                article as SupabaseArticle,
                category,
                profile as SupabaseProfile,
                tags
        );
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
        const {
                data: { user },
                error: authError
        } = await supabase.auth.getUser();

        if (authError) { throw authError; }

        if (!user) {
                throw new Error('You must be logged in to create an article.');
        }

        const categorySlug = data.category ?? 'development';
        const category = await getSupabaseCategoryBySlug(categorySlug);

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
                        status: data.status ?? 'draft',
                        reading_time: calculateReadingTime(content),
                })
                .select()
                .single();

        if (error) {
                throw error;
        }

        const excerpt =
                content.length > 150
                        ? `${content.substring(0, 150)}...`
                        : content;

        return {
                id: article.id,
                slug: article.slug,
                title: article.title,
                excerpt,
                content: article.content,
                category: category.slug,
                tags: [],
                coverImage: article.cover_image ?? '',
                author: {
                        name: user.user_metadata.name ?? 'User',
                        avatar: user.user_metadata.avatar,
                },
                publishedAt: article.published_at ?? '',
                updatedAt: article.updated_at,
                readingTime: article.reading_time ?? 0,
                likes: 0,
                status: article.status,
        };
}

export async function updateArticle(id: string, data: Partial<Article>): Promise<Article | null> {
        const {
                data: { user },
                error: authError,
        } = await supabase.auth.getUser();

        if (authError) { throw authError; }

        if (!user) { throw new Error('You must be logged in to update an article.'); }

        let categoryId: number | undefined;

        if (data.category) {
                const category = await getCategoryBySlug(data.category);
                if (!category) { throw new Error(`Category "${data.category}" not found.`); }
                categoryId = category.id;
        }

        const updateData: Record<string, unknown> = {};

        if (data.title !== undefined) { updateData.title = data.title; }

        if (data.slug !== undefined) { updateData.slug = data.slug; }

        if (data.content !== undefined) {
                updateData.content = data.content;
                updateData.reading_time = calculateReadingTime(data.content);
        }

        if (data.coverImage !== undefined) { updateData.cover_image = data.coverImage || null; }

        if (data.status !== undefined) { updateData.status = data.status; }

        if (categoryId !== undefined) { updateData.category_id = categoryId; }

        const { data: article, error } = await supabase
                .from('articles')
                .update(updateData)
                .eq('id', id)
                .eq('author_id', user.id)
                .select()
                .single();

        if (error) { throw error; }

        const category = await getCategoryById(article.category_id);

        if (!category) { throw new Error('Article category not found.'); }

        const excerpt =
                article.content.length > 150
                        ? `${article.content.substring(0, 150)}...`
                        : article.content;

        return {
                id: article.id,
                slug: article.slug,
                title: article.title,
                excerpt,
                content: article.content,
                category: category.slug,
                tags: [],
                coverImage: article.cover_image ?? '',
                author: {
                        name: user.user_metadata.name ?? 'User',
                        avatar: user.user_metadata.avatar,
                },
                publishedAt: article.published_at ?? '',
                updatedAt: article.updated_at,
                readingTime: article.reading_time ?? 0,
                likes: 0,
                status: article.status,
        };
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

function simulateDelay<T>(value: T, ms: number = 150): Promise<T> {
        return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
