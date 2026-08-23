import { useEffect, useRef, useState, useCallback, useMemo, lazy, Suspense, Component } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TiptapEditor } from '@/components/editor/TiptapEditor';
import type { Article, ArticleStatus } from '@/types';
import { getArticleById, createArticle, updateArticle, calculateReadingTime, generateSlug } from '@/services/articleService';
import { getCategories } from '@/services/categoryService';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { upload, cleanupArticleContentMedia, deleteCoverImage } from '@/services/storageService';
import {
  ArrowLeft, Eye, Settings as SettingsIcon,
  X, Check, ImagePlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { getMyPublications } from '@/services/publicationService';
import { PageSpinner } from '@/components/ui/Skeleton';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArticleView } from '@/components/articles/ArticleView'; // ⬅️ NEW IMPORT


const Strands = lazy(() => import('@/components/ui/Strands'));

class StrandsErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? null : this.props.children; }
}

type SaveState = 'idle' | 'saving' | 'saved';

export function ArticleEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const initialId = id && id !== 'new' ? id : null;
  const [articleId, setArticleId] = useState<string | null>(initialId);
  const isNew = !articleId;
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
    isDirtyRef.current = true;
    formDataVersionRef.current += 1;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const articleRef = useRef<Article | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savePromiseRef = useRef<Promise<void> | null>(null);

  const exitRequestedRef = useRef(false);
  const hydratedIdRef = useRef<string | null>(null);
  const isDirtyRef = useRef(false);
  const ensureArticlePromiseRef = useRef<Promise<string> | null>(null);
  const formDataVersionRef = useRef(0);
  const saveArticleRef = useRef<(() => Promise<void>) | null>(null);
  const [isHydrated, setIsHydrated] = useState(!initialId);

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
    queryKey: ['article', initialId],
    queryFn: () => getArticleById(initialId!),
    enabled: Boolean(initialId),
  });
  const loading = Boolean(initialId) && isArticleLoading;
  useEffect(() => {
    if (article && initialId) {
      if (hydratedIdRef.current !== initialId) {
        hydratedIdRef.current = initialId;
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
        setIsHydrated(true);
        isDirtyRef.current = false;
        formDataVersionRef.current = 0;
      } else if (!isDirtyRef.current) {
        if (article.content !== formData.content || article.title !== formData.title) {
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
          isDirtyRef.current = false;
          formDataVersionRef.current = 0;
        }
      }
    }
  }, [article, initialId]);
  useEffect(() => {
    if (publications.length > 0 && !publicationId) {
      const fallback = publications.find((p) => p.isDefault) ?? publications[0];
      setPublicationId(fallback?.id ?? '');
    }
  }, [publications, publicationId]);
  const readingTime = useMemo(() => calculateReadingTime(formData.content), [formData.content]);

  const buildArticleData = useCallback((): Partial<Article> => ({
    ...formData,
    slug: formData.slug || generateSlug(formData.title || 'untitled'),
    readingTime,
    publicationId: publicationId || undefined,
    publishedAt: formData.publishedAt ? new Date(formData.publishedAt).toISOString() : undefined,
  }), [formData, readingTime, publicationId]);
  const ensureArticleId = useCallback(async (): Promise<string> => {
    const existing = articleRef.current?.id ?? (articleId && articleId !== 'new' ? articleId : null);

    if (existing) {
      return existing;
    }

    if (ensureArticlePromiseRef.current) {
      return ensureArticlePromiseRef.current;
    }

    const promise = (async () => {
      if (savePromiseRef.current) {
        await savePromiseRef.current.catch(() => { });
      }

      const recheck = articleRef.current?.id ?? (articleId && articleId !== 'new' ? articleId : null);

      if (recheck) {
        return recheck;
      }

      const data = buildArticleData();
      const created = await createArticle(data);

      articleRef.current = created;
      hydratedIdRef.current = created.id;

      setArticleId(created.id);
      navigate(`/dashboard/articles/${created.id}`, { replace: true });

      queryClient.setQueryData(['article', created.id], created);
      queryClient.invalidateQueries({ queryKey: ['my-articles', user?.id] });

      if (!publicationId) {
        setPublicationId(created.publicationId);
      }

      return created.id;
    })();

    ensureArticlePromiseRef.current = promise;

    try {
      return await promise;
    } finally {
      ensureArticlePromiseRef.current = null;
    }
  }, [articleId, buildArticleData, navigate, publicationId, queryClient, user?.id]);
  const saveArticle = useCallback(async () => {
    if (savePromiseRef.current) return savePromiseRef.current;

    const run = (async () => {
      const startVersion = formDataVersionRef.current;
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
          setArticleId(created.id);
          navigate(`/dashboard/articles/${created.id}`, { replace: true });
          queryClient.setQueryData(['article', created.id], created);
          queryClient.invalidateQueries({ queryKey: ['my-articles', user?.id] });
          queryClient.invalidateQueries({ queryKey: ['articles'] });
          if (!publicationId) { setPublicationId(created.publicationId); }

        } else {
          const currentId = articleRef.current?.id ?? articleId;
          if (currentId) {
            const updated = await updateArticle(currentId, data);
            if (updated) {
              articleRef.current = updated;
              queryClient.setQueryData(['article', currentId], updated);
            }
          }
        }
        if (formDataVersionRef.current === startVersion) {
          isDirtyRef.current = false;

          setSavedTime(
            new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
          );
          setSaveState('saved');
        } else {
          setSaveState('idle');
        }
      } catch (error) {
        console.error('Failed to save article:', error);
        setSaveState('idle');
      }
    })();

    savePromiseRef.current = run;
    try {
      await run;
    } finally {
      savePromiseRef.current = null;
    }
  }, [buildArticleData, isNew, id, navigate]);
  useEffect(() => {
    saveArticleRef.current = saveArticle;
  }, [saveArticle]);

  const flushPendingSaves = useCallback(async (): Promise<boolean> => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      if (savePromiseRef.current) {
        await savePromiseRef.current;
        continue;
      }

      if (!isDirtyRef.current) {
        return true;
      }

      await saveArticle();
    }

    return !isDirtyRef.current && !savePromiseRef.current;
  }, [saveArticle]);

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
  }, [formData, publicationId, saveArticle, loading]);
  // Add this new useEffect right after the autosave useEffect
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

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

    const saved = await flushPendingSaves();
    if (!saved) {
      toast.error('Failed to save article before publishing.');
      exitRequestedRef.current = false;
      publishingRef.current = false;
      setPublishing(false);
      return;
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
        setArticleId(created.id);
        queryClient.setQueryData(['article', created.id], created);
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
      const saved = await flushPendingSaves();
      if (!saved) {
        toast.error('Could not save the article. Please try again.');
        exitRequestedRef.current = false;
        return;
      }
      const targetId = articleRef.current?.id ?? articleId;
      if (targetId) {
        queryClient.invalidateQueries({ queryKey: ['article', targetId] });
      }
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
    if (savePromiseRef.current) {
      await savePromiseRef.current;
    }
    if (isNew && !articleRef.current?.id) {
      try {
        const data = buildArticleData();
        const created = await createArticle(data);
        articleRef.current = created;
        setArticleId(created.id);
        articleId = created.id;
        navigate(`/dashboard/articles/${created.id}`, { replace: true });
        queryClient.setQueryData(['article', created.id], created);
        queryClient.invalidateQueries({ queryKey: ['my-articles', user?.id] });
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
    } catch (error: any) {
      console.error('Failed to upload cover image:', error);
      toast.error(error.message || 'Failed to upload cover image. Please try again.');

    } finally {
      setSaveState('idle');
    }
  };

  const uploadContentImage = async (file: File): Promise<string> => {
    const targetArticleId = await ensureArticleId();
    try {
      // The service handles the size/type checks and the actual upload
      const result = await upload(targetArticleId, file, 'content');
      return result.publicUrl;
    } catch (error: any) {
      console.error('Content image upload failed:', error);
      throw error;
    }
  };

  // Inline local datetime for the max attribute
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const maxDateTime = now.toISOString().slice(0, 16);

  if (loading || (initialId && !isHydrated)) {
    return <PageSpinner />;
  }
  const previewArticle = {
    id: articleId || 'preview',
    title: formData.title || 'Untitled',
    content: formData.content || '',
    category: formData.category,
    coverImage: formData.coverImage,
    readingTime,
    publishedAt: formData.publishedAt ? new Date(formData.publishedAt).toISOString() : new Date().toISOString(),
    createdAt: new Date().toISOString(),
    author: {
      id: user?.id || '',
      name: profile?.display_name || 'Author',
      username: profile?.username || '',
      avatar: profile?.avatar_url || '',
      bio: profile?.bio || ''
    },
    publication: publications.find(p => p.id === publicationId) || undefined,
    likes: 0,
    comments: 0,
    status: formData.status,
    slug: formData.slug,
    publicationId: publicationId || undefined
  } as unknown as Article;

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
              <StrandsErrorBoundary>
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
              </StrandsErrorBoundary>
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
        // ⬇️ REPLACED PREVIEW BLOCK WITH SHARED COMPONENT
        <ArticleView
          article={previewArticle}
          showInteractions={false}
          showRelated={false}
          showBackLink={false}
        />
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
            articleId={articleId}
          />
        </div>
      )}
    </div>
  );
}