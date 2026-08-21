import { useEffect, useRef, useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TiptapEditor } from '@/components/editor/TiptapEditor';
import type { Article, ArticleStatus } from '@/types';
import { getArticleById, createArticle, updateArticle, calculateReadingTime, generateSlug } from '@/services/articleService';
import { getCategories } from '@/services/categoryService';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ArticleContent } from '@/components/articles/ArticleContent';
import { upload, cleanupArticleContentMedia, deleteCoverImage } from '@/services/storageService';
import {
  ArrowLeft, Eye, Settings as SettingsIcon,
  X, Check, ImagePlus,
} from 'lucide-react';
import { TableOfContents, extractHeadings } from '@/components/articles/TableOfContents';
import { toast } from 'sonner';
import { getMyPublications } from '@/services/publicationService';
import { PageSpinner } from '@/components/ui/Skeleton';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

const Strands = lazy(() => import('@/components/ui/Strands'));

type SaveState = 'idle' | 'saving' | 'saved';

export function ArticleEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'development',
    slug: '',
    coverImage: '',
    status: 'draft' as ArticleStatus,
    publishedAt: ''
  });
  const [publicationId, setPublicationId] = useState<string>('');
  const [preview, setPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [savedTime, setSavedTime] = useState<string>('');
  const [publishing, setPublishing] = useState(false);
  const publishingRef = useRef(false);

  type FormField = keyof typeof formData;
  const handleChange = (field: FormField, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const articleRef = useRef<Article | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitRequestedRef = useRef(false);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });
  const { data: publications = [] } = useQuery({
    queryKey: ['my-publications', user?.id],
    queryFn: () => getMyPublications(user!.id),
    enabled: Boolean(user),
  });
  const { data: article, isLoading: isArticleLoading } = useQuery({
    queryKey: ['article', id],
    queryFn: () => getArticleById(id!),
    enabled: !isNew && Boolean(id),
  });
  const loading = !isNew && isArticleLoading;
  useEffect(() => {
    if (article) {
      articleRef.current = article;
      setFormData({
        title: article.title,
        content: article.content,
        category: article.category,
        slug: article.slug,
        coverImage: article.coverImage,
        status: article.status,
        publishedAt: article.publishedAt ? new Date(article.publishedAt).toISOString().slice(0, 16) : ''
      });
      setPublicationId(article.publicationId);
    }
  }, [article]);
  useEffect(() => {
    if (publications.length > 0 && !publicationId) {
      const fallback = publications.find((p) => p.isDefault) ?? publications[0];
      setPublicationId(fallback?.id ?? '');
    }
  }, [publications, publicationId]);
  const readingTime = useMemo(() => calculateReadingTime(formData.content), [formData.content]);
  const headings = useMemo(
    () => extractHeadings(formData.content), [formData.content]
  );

  const buildArticleData = useCallback((): Partial<Article> => ({
    ...formData,
    slug: formData.slug || generateSlug(formData.title || 'untitled'),
    readingTime,
    publicationId: publicationId || undefined,
    publishedAt: formData.publishedAt ? new Date(formData.publishedAt).toISOString() : undefined,
  }), [formData, readingTime, publicationId]);

  const saveArticle = useCallback(async () => {
    const data = buildArticleData();
    const isEmpty = !data.title?.trim() && !data.content?.trim();
    if (isNew && isEmpty) {
      setSaveState('idle');
      return;
    }
    setSaveState('saving');
    try {
      if (isNew && !articleRef.current?.id) {
        const created = await createArticle(data);
        articleRef.current = created;
        queryClient.invalidateQueries({ queryKey: ['my-articles', user?.id] });
        queryClient.invalidateQueries({ queryKey: ['articles'] });
        if (!publicationId) { setPublicationId(created.publicationId); }
        navigate(`/dashboard/articles/${created.id}/edit`, { replace: true });
      } else {
        const articleId = articleRef.current?.id ?? id;
        if (articleId) {
          const updated = await updateArticle(articleId, data);
          if (updated) articleRef.current = updated;
        }
      }
      setSavedTime(
        new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      );
      setSaveState('saved');
    } catch (error) {
      console.error('Failed to save article:', error);
      setSaveState('idle');
    }
  }, [buildArticleData, isNew, id, navigate]);

  useEffect(() => {
    if (loading || exitRequestedRef.current) return;
    saveTimer.current = setTimeout(() => {
      saveArticle();
    }, 2000);
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    };
  }, [formData, saveArticle, loading]);

  const handlePublish = async () => {
    if (publishingRef.current) return;

    if (formData.publishedAt && new Date(formData.publishedAt) > new Date()) {
      toast.error('Publication date cannot be in the future.');
      return;
    }

    publishingRef.current = true;
    setPublishing(true);

    // Stop autosave from fighting the publish request
    exitRequestedRef.current = true;

    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }

    const data = {
      ...buildArticleData(),
      status: 'published' as ArticleStatus,
      publishedAt: formData.publishedAt
        ? new Date(formData.publishedAt).toISOString()
        : undefined,
    };

    try {
      if (isNew && !articleRef.current?.id) {
        const created = await createArticle(data);
        articleRef.current = created;
        queryClient.invalidateQueries({ queryKey: ['my-articles', user?.id] });

        navigate('/dashboard');
        return;
      }

      const articleId = articleRef.current?.id ?? id;

      if (!articleId) {
        toast.error('Could not find article to publish.');
        exitRequestedRef.current = false;
        return;
      }

      const updated = await updateArticle(articleId, data);

      if (updated) {
        articleRef.current = updated;

        try {
          await cleanupArticleContentMedia(articleId, data.content ?? '');
        } catch (error) {
          console.error('Failed to clean up article media:', error);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['my-articles', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to publish article:', error);
      toast.error('Failed to publish article. Please try again.');
      exitRequestedRef.current = false;
    } finally {
      publishingRef.current = false;
      setPublishing(false);
    }
  };

  const handleSaveAndExit = async () => {
    const isEmpty =
      !formData.title.trim() &&
      !formData.content.trim() &&
      !formData.coverImage.trim();
    if (isNew && isEmpty && !articleRef.current?.id) {
      navigate('/dashboard');
      return;
    }
    exitRequestedRef.current = true;
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    try {
      await saveArticle();
      queryClient.invalidateQueries({ queryKey: ['my-articles', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to save article:', error);
      exitRequestedRef.current = false;
      toast.error('Failed to save the article. Please try again.');
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    let articleId = articleRef.current?.id ?? id;
    if (isNew && !articleRef.current?.id) {
      try {
        const data = buildArticleData();
        const created = await createArticle(data);
        articleRef.current = created;
        articleId = created.id;
        queryClient.invalidateQueries({ queryKey: ['my-articles', user?.id] });
        navigate(`/dashboard/articles/${created.id}/edit`, { replace: true });
      } catch (error) {
        console.error('Failed to auto-save article:', error);
        toast.error('Failed to save article. Please try again.');
        return;
      }
    }
    if (!articleId) return;
    try {
      setSaveState('saving');
      if (formData.coverImage) {
        await deleteCoverImage(formData.coverImage);
      }
      const result = await upload(articleId, file, 'cover');
      handleChange('coverImage', result.publicUrl);
    } catch (error) {
      console.error('Failed to upload cover image:', error);
      toast.error('Failed to upload cover image. Please try again.');
    } finally {
      setSaveState('idle');
    }
  };

  const uploadContentImage = async (file: File): Promise<string> => {
    const articleId = articleRef.current?.id ?? id;

    if (!articleId || articleId === 'new') {
      const errorMsg = 'Please type something to auto-save the article before inserting an image.';
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      // The service handles the size/type checks and the actual upload
      const result = await upload(articleId, file, 'content');
      return result.publicUrl;
    } catch (error: any) {
      console.error('Content image upload failed:', error);
      // If your service throws "Image must be under 5 MB.", it will be printed right here!
      toast.error(error.message || 'Failed to upload image. Please try again.');
      throw error;
    }
  };

  // Inline local datetime for the max attribute
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const maxDateTime = now.toISOString().slice(0, 16);

  if (loading) {
    return <PageSpinner />;
  }

  return (
    <div>
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-bg/80 backdrop-blur-md border-b border-border-subtle overflow-hidden">
        <div
          className={`absolute inset-0 z-0 hidden pointer-events-none items-center transition-opacity duration-300 md:flex 
            ${saveState === 'saving' ? 'opacity-100' : 'opacity-20'
            }`}
          aria-hidden="true"
        >
          <div className="relative w-full h-[600px]">
            <Suspense fallback={null}>
              <Strands
                colors={["#ff0000", "#000000", "#4500ff"]}
                count={3}
                speed={0.7}
                amplitude={0.5}
                waviness={1.6}
                thickness={3}
                glow={0.8}
                taper={4.4}
                spread={1}
                intensity={0.1}
                saturation={1.75}
                opacity={1}
                scale={0.6}
                glass={false}
                refraction={1}
                dispersion={1}
                glassSize={1}
                hueShift={0}
              />
            </Suspense>
          </div>
        </div>
        <div className="relative max-w-content w-full mx-auto z-10 flex items-center justify-between h-14 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleSaveAndExit}
              disabled={saveState === 'saving'}
              className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Save & Exit</span>
              <span className="sm:hidden">Exit</span>
            </button>
            <div className="flex items-center gap-1.5 text-xs font-mono text-text-muted">
              {saveState === 'saving' && (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse" />
                  {' '}Saving...
                </span>
              )}
              {saveState === 'saved' && (
                <span className="flex items-center gap-1 text-accent">
                  <Check size={12} />
                  Saved{savedTime && <span className="hidden sm:inline">&nbsp;{savedTime}</span>}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreview((p) => !p)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${preview ? 'bg-elevated text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-elevated'}`}
            >
              <Eye size={15} />
              <span className="hidden sm:inline" aria-label="Toggle preview">Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setShowSettings((s) => !s)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${showSettings ? 'bg-elevated text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-elevated'}`}
            >
              <SettingsIcon size={15} />
              <span className="hidden sm:inline" aria-label="Post settings">Settings</span>
            </button>
            <Button type="button" size="sm" onClick={handlePublish} loading={publishing}>
              Publish
            </Button>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-b border-border-subtle bg-surface animate-fade-in">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-xs uppercase tracking-wider text-text-muted">Post Settings</h3>
              <button type="button" onClick={() => setShowSettings(false)} className="text-text-muted hover:text-text-primary">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Cover image URL"
                  name="coverImage"
                  placeholder="https://..."
                  value={formData.coverImage}
                  onChange={(e) => handleChange('coverImage', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="publication" className="block text-sm font-medium text-text-secondary mb-1.5">
                  Publication
                </label>
                <select
                  id="publication"
                  value={publicationId}
                  onChange={(e) => setPublicationId(e.target.value)}
                  className="w-full rounded bg-surface border border-border px-3.5 py-2.5 text-text-primary text-sm transition-colors focus:border-accent focus:outline-none"
                >
                  {publications.length === 0 && (
                    <option value="">Loading publications...</option>
                  )}

                  {publications.map((pub) => (
                    <option key={pub.id} value={pub.id}>
                      {pub.name}
                      {pub.isDefault ? ' (default)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-text-secondary mb-1.5">Category</label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full rounded bg-surface border border-border px-3.5 py-2.5 text-text-primary text-sm transition-colors focus:border-accent focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Input
                  label="Slug"
                  name="slug"
                  placeholder="auto-generated"
                  value={formData.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-text-secondary mb-1.5">Status</label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value as ArticleStatus)}
                  className="w-full rounded bg-surface border border-border px-3.5 py-2.5 text-text-primary text-sm transition-colors focus:border-accent focus:outline-none"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="published-at"
                  className="block text-sm font-medium text-text-secondary mb-1.5"
                >
                  Publication date
                </label>
                <input
                  id="published-at"
                  type="datetime-local"
                  value={formData.publishedAt}
                  max={maxDateTime}
                  onChange={(e) => handleChange("publishedAt", e.target.value)}
                  className="w-full rounded bg-surface border border-border px-3.5 py-2.5 text-text-primary text-sm transition-colors focus:border-accent focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {preview ? (
        <div className="max-w-content mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="accent">{formData.category}</Badge>
            <span className="font-mono text-xs text-text-muted">
              {readingTime} min read
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-medium text-text-primary leading-[1.1] tracking-tight text-balance mb-4">
            {formData.title || 'Untitled'}
          </h1>
          <div className="flex items-center gap-3 mb-8">
            {profile?.avatar_url && (
              <img
                src={profile.avatar_url}
                alt={profile.display_name ?? 'Author'}
                className="w-9 h-9 rounded-full"
              />
            )}
            <span className="text-sm font-medium text-text-primary">
              {profile?.display_name ?? 'Author'}
            </span>
          </div>
          {formData.coverImage && (
            <div className="relative aspect-video overflow-hidden rounded-card border border-border-subtle mb-10 bg-elevated">
              <img
                src={formData.coverImage}
                alt={formData.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-12">
            <article className="min-w-0">
              <ArticleContent
                content={formData.content || 'Nothing written yet.'}
              />
            </article>
            <div className="hidden lg:block lg:col-start-2 lg:row-start-1">
              <TableOfContents headings={headings} />
            </div>
          </div>
        </div>
      ) : (
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 py-8">
          <div className="flex items-center gap-4 mb-5">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-border-subtle px-3 py-2 text-sm text-text-muted transition-colors hover:border-text-muted hover:text-text-secondary">
              <ImagePlus size={15} />
              Cover
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            </label>
          </div>
          {formData.coverImage && (
            <div className="relative group mb-6">
              <div className="relative aspect-video overflow-hidden rounded-card border border-border-subtle bg-elevated">
                <img src={formData.coverImage} alt="Cover" className="absolute inset-0 h-full w-full object-cover" />
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    if (formData.coverImage) {
                      await deleteCoverImage(formData.coverImage);
                    }
                    handleChange('coverImage', '');
                  } catch (error) {
                    console.error('Failed to remove cover image:', error);
                    toast.error('Failed to remove cover image. Please try again.');
                  }
                }}
                className="absolute top-2 right-2 p-1.5 rounded bg-bg/80 text-text-secondary hover:text-accent transition-colors"
                aria-label="Remove cover"
              >
                <X size={16} />
              </button>
            </div>
          )}
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Article title"
            className="w-full bg-transparent font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-text-primary placeholder:text-text-muted tracking-tight focus:outline-none mb-3" aria-label="Article title"
          />
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border-subtle">
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="rounded border border-border bg-surface px-2.5 py-1 font-mono text-xs uppercase tracking-wider text-text-secondary focus:border-accent focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
            <span className="font-mono text-xs text-text-muted">{readingTime} min read</span>
          </div>
          <TiptapEditor
            value={formData.content}
            onChange={(val) => {
              handleChange('content', val);
            }}
            onImageUpload={uploadContentImage}
          />
        </div>
      )}
    </div>
  );
}