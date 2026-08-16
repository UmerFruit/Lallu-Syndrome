import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams} from 'react-router-dom';
import { TiptapEditor } from '@/components/editor/TiptapEditor';
import type { Article, ArticleStatus, Category } from '@/types';
import { getArticleById, createArticle, updateArticle, calculateReadingTime, generateSlug } from '@/services/articleService';
import { getCategories } from '@/services/categoryService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ArticleContent } from '@/components/articles/ArticleContent';
import { upload, deleteRemovedContentImages } from '@/services/storageService'
import {
  ArrowLeft, Eye, Settings as SettingsIcon,
  Maximize2, Minimize2, X, Check, ImagePlus,
} from 'lucide-react';

const AUTHOR = { name: 'Umer Farooq', avatar: 'https://images.unsplash.com/photo-1500648767731-5ca545ace573?w=200&h=200&fit=crop&crop=faces&q=80' };

type SaveState = 'idle' | 'saving' | 'saved';

export function ArticleEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const isNew = !id || id === 'new';

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('development');
  const [tags, setTags] = useState('');
  const [slug, setSlug] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [status, setStatus] = useState<ArticleStatus>('draft');
  const [loading, setLoading] = useState(!isNew);
  const [preview, setPreview] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [savedTime, setSavedTime] = useState<string>('');

  const articleRef = useRef<Article | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!isNew && id) {
      getArticleById(id).then((a) => {
        if (a) {
          articleRef.current = a;
          setTitle(a.title);
          setExcerpt(a.excerpt);
          setContent(a.content);
          setCategory(a.category);
          setTags(a.tags.join(', '));
          setSlug(a.slug);
          setCoverImage(a.coverImage);
          setStatus(a.status);
        }
        setLoading(false);
      });
    }
  }, [id, isNew]);

  const readingTime = calculateReadingTime(content);

  const buildArticleData = useCallback((): Partial<Article> => {
    return {
      title: title || 'Untitled',
      excerpt,
      content,
      category,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      slug: slug || generateSlug(title || 'untitled'),
      coverImage,
      status,
      author: AUTHOR,
      readingTime,
    };
  }, [title, excerpt, content, category, tags, slug, coverImage, status, readingTime]);

  const triggerAutosave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState('saving');
    saveTimer.current = setTimeout(async () => {
      if (isNew) {
        const created = await createArticle(buildArticleData());
        articleRef.current = created;
        if (created.id !== id) {
          navigate(`/dashboard/articles/${created.id}/edit`, { replace: true });
        }
      } else if (id) {
        const updated = await updateArticle(id, buildArticleData());

        if (updated) {
          articleRef.current = updated;
        }
      }
      setSaveState('saved');
      setSavedTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
    }, 1000);
  }, [buildArticleData, id, isNew, navigate]);

  useEffect(() => {
    if (loading) return;
    triggerAutosave();
  }, [title, excerpt, content, category, tags, slug, coverImage, status, triggerAutosave, loading]);

  const handlePublish = async () => {
    if (!coverImage) {
      alert('Cover image is required for published articles.');
      return;
    }

    const previousContent = articleRef.current?.content ?? '';
    const nextContent = content;

    const data = {
      ...buildArticleData(),
      status: 'published' as ArticleStatus,
    };

    if (isNew) {
      const created = await createArticle(data);
      articleRef.current = created;
      navigate('/dashboard');
      return;
    }

    if (id) {
      const updated = await updateArticle(id, data);

      if (updated) {
        articleRef.current = updated;

        try {
          await deleteRemovedContentImages(previousContent, nextContent);
        } catch (error) {
          console.error('Failed to delete removed images:', error);
        }
      }

      navigate('/dashboard');
    }
  };

  const handleSaveAndExit = async () => {
    const previousContent = articleRef.current?.content ?? '';
    const nextContent = content;
    const data = buildArticleData();

    try {
      setSaveState('saving');

      if (isNew) {
        const created = await createArticle(data);
        articleRef.current = created;

        navigate('/dashboard');
        return;
      }

      if (id) {
        const updated = await updateArticle(id, data);

        if (updated) {
          articleRef.current = updated;

          try {
            await deleteRemovedContentImages(
              previousContent,
              nextContent
            );
          } catch (error) {
            console.error(
              'Failed to delete removed images:',
              error
            );
          }
        }

        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Failed to save article:', error);
      setSaveState('idle');
      alert('Failed to save the article. Please try again.');
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    e.target.value = '';

    const articleId = articleRef.current?.id ?? id;

    if (!articleId || articleId === 'new') {
      alert('Save the article before uploading a cover image.');
      return;
    }

    try {
      setSaveState('saving');

      const result = await upload(articleId, file, 'cover');

      setCoverImage(result.publicUrl);
    } catch (error) {
      console.error('Failed to upload cover image:', error);
      alert('Failed to upload cover image. Please try again.');
    } finally {
      setSaveState('idle');
    }
  };
  const uploadContentImage = async (file: File): Promise<string> => {
    const articleId = articleRef.current?.id ?? id;

    if (!articleId || articleId === 'new') {
      throw new Error('Save the article before inserting an image.');
    }

    const result = await upload(articleId, file, 'content');

    return result.publicUrl;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={zenMode ? 'fixed inset-0 z-50 bg-bg overflow-y-auto' : ''}>
      {/* Top Bar */}
      <header className={`sticky top-0 z-40 bg-bg/80 backdrop-blur-md border-b border-border-subtle ${zenMode ? 'px-6' : ''}`}>
        <div className="flex items-center justify-between h-14 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            {!zenMode ? (
              <button
                type="button"
                onClick={handleSaveAndExit}
                disabled={saveState === 'saving'}
                className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
              >
                <ArrowLeft size={16} />
                Save & Exit
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setZenMode(false)}
                className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                <Minimize2 size={16} />
                Exit focus
              </button>
            )}
            <div className="flex items-center gap-1.5 text-xs font-mono text-text-muted">
              {saveState === 'saving' && (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse" />
                  Saving...
                </span>
              )}
              {saveState === 'saved' && (
                <span className="flex items-center gap-1 text-accent">
                  <Check size={12} />
                  Saved{savedTime && ` ${savedTime}`}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreview((p) => !p)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${preview ? 'bg-elevated text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-elevated'
                }`}
            >
              <Eye size={15} />
              Preview
            </button>
            {!zenMode && (
              <button
                type="button"
                onClick={() => setZenMode(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors"
              >
                <Maximize2 size={15} />
                Focus
              </button>
            )}
            {!zenMode && (
              <button
                type="button"
                onClick={() => setShowSettings((s) => !s)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${showSettings ? 'bg-elevated text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-elevated'
                  }`}
              >
                <SettingsIcon size={15} />
                Settings
              </button>
            )}
            <Button type="button" size="sm" onClick={handlePublish}>
              Publish
            </Button>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && !zenMode && (
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
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-text-secondary mb-1.5">Category</label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
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
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Tags (comma-separated)"
                  name="tags"
                  placeholder="TypeScript, React, API"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Excerpt"
                  name="excerpt"
                  placeholder="Short description for cards and SEO"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor='status' className="block text-sm font-medium text-text-secondary mb-1.5">Status</label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ArticleStatus)}
                  className="w-full rounded bg-surface border border-border px-3.5 py-2.5 text-text-primary text-sm transition-colors focus:border-accent focus:outline-none"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div>
                <label htmlFor='reading-time' className="block text-sm font-medium text-text-secondary mb-1.5">Reading time (auto)</label>
                <div id='reading-time' className="px-3.5 py-2.5 rounded bg-elevated border border-border-subtle text-sm text-text-muted font-mono">
                  {readingTime} min
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {preview ? (
        <div className="max-w-article mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="accent">{category}</Badge>
            <span className="font-mono text-xs text-text-muted">{readingTime} min read</span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-medium text-text-primary leading-[1.1] tracking-tight text-balance mb-4">
            {title || 'Untitled'}
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed mb-6">
            {excerpt || 'No excerpt yet.'}
          </p>
          <div className="flex items-center gap-3 mb-8">
            <img src={AUTHOR.avatar} alt={AUTHOR.name} className="w-9 h-9 rounded-full" />
            <span className="text-sm font-medium text-text-primary">{AUTHOR.name}</span>
          </div>
          {coverImage && (
            <div className="overflow-hidden rounded-card border border-border-subtle mb-10">
              <img src={coverImage} alt={title} className="w-full" />
            </div>
          )}
          <ArticleContent content={content || 'Nothing written yet.'} />
        </div>
      ) : (
        <div className={`relative mx-auto ${zenMode ? 'max-w-3xl px-6' : 'max-w-3xl px-4 sm:px-6'} py-8`}>
          <div className="absolute top-6 right-4 sm:right-6 hidden sm:flex items-center gap-1 rounded-lg bg-elevated p-1">
            <span className="px-2.5 py-1 rounded-md bg-surface text-xs font-medium text-text-primary">Rich</span>
            <span className="px-2 py-1 rounded-md text-xs font-mono text-text-muted">MD</span>
          </div>

          <div className="flex items-center gap-4 mb-5">
            <label className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary cursor-pointer transition-colors">
              <ImagePlus size={15} />
              Cover
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            </label>
            <button
              type="button"
              onClick={() => setContent((prev) => prev + '\n\n## ')}
              className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors"
            >
              Subheading
            </button>
          </div>

          {coverImage && (
            <div className="relative group mb-6">
              <div className="overflow-hidden rounded-card border border-border-subtle">
                <img src={coverImage} alt="Cover" className="w-full h-48 object-cover" />
              </div>
              <button
                type="button"
                onClick={() => setCoverImage('')}
                className="absolute top-2 right-2 p-1.5 rounded bg-bg/80 text-text-secondary hover:text-accent transition-colors"
                aria-label="Remove cover"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article title"
            className="w-full bg-transparent font-serif text-4xl md:text-5xl font-semibold text-text-primary placeholder:text-text-muted tracking-tight focus:outline-none mb-3" aria-label="Article title"
          />

          {/* Excerpt */}
          <input
            type="text"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Short description..."
            className="w-full bg-transparent text-lg text-text-secondary placeholder:text-text-muted focus:outline-none mb-4"
            aria-label="Short description"
          />

          {/* Category + Reading Time */}
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border-subtle">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded border border-border bg-surface px-2.5 py-1 font-mono text-xs uppercase tracking-wider text-text-secondary focus:border-accent focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
            <span className="font-mono text-xs text-text-muted">{readingTime} min read</span>
          </div>

          {/* Editor */}
          <TiptapEditor value={content} onChange={setContent} onImageUpload={uploadContentImage} />
        </div>
      )}
    </div>
  );
}
