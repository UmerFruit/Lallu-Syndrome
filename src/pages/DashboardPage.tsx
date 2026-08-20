import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Article } from '@/types';
import { getMyArticles, deleteArticle } from '@/services/articleService';
import { useAuth } from '@/contexts/AuthContext';
import { PageContainer } from '@/components/layout/Navbar';
import { formatDate } from '@/utils/date';
import { Badge } from '@/components/ui/Badge';
import { Plus, Pencil, Trash2, FileText } from 'lucide-react';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

export function DashboardPage() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'published' | 'drafts'>('published');

  // Modal State
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;

    getMyArticles(user.id).then((a) => {
      setArticles(a);
      setLoading(false);
    });
  }, [user]);

  const published = articles.filter((a) => a.status === 'published');
  const drafts = articles.filter((a) => a.status === 'draft');
  const displayed = tab === 'published' ? published : drafts;

  const handleConfirmDelete = async () => {
    if (!articleToDelete) return;

    setIsDeleting(true);
    try {
      await deleteArticle(articleToDelete.id);
      setArticles((prev) => prev.filter((a) => a.id !== articleToDelete.id));
      setArticleToDelete(null);
    } catch (error) {
      console.error('Failed to delete article:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const articleListContent = (() => {
    if (loading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded border border-border-subtle bg-surface animate-pulse" />
          ))}
        </div>
      );
    }

    if (displayed.length === 0) {
      return (
        <div className="py-16 text-center">
          <FileText size={32} className="mx-auto text-text-muted mb-3" />
          <p className="text-text-secondary">
            {tab === 'drafts' ? 'No drafts. Go write something.' : 'No published articles yet.'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {displayed.map((article) => (
          <div
            key={article.id}
            className="flex items-center gap-4 p-4 rounded border border-border-subtle bg-surface hover:border-border transition-colors duration-200 group"
          >
            <div className="flex-1 min-w-0">
              <Link
                to={`/articles/${article.slug}`}
                className="font-serif text-base font-medium text-text-primary hover:text-accent transition-colors line-clamp-1"
              >
                {article.title}
              </Link>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <Badge variant="muted">{article.category}</Badge>
                <span className="font-mono text-xs text-text-muted">
                  {article.publishedAt && formatDate(article.publishedAt)}
                </span>
                <span className="font-mono text-xs text-text-muted">
                  {article.readingTime} min
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                to={`/dashboard/articles/${article.id}/edit`}
                className="p-2 rounded text-text-muted hover:text-text-primary hover:bg-elevated transition-colors"
                aria-label="Edit article"
              >
                <Pencil size={16} />
              </Link>
              <button
                type="button"
                onClick={() => setArticleToDelete(article)}
                className="p-2 rounded text-text-muted hover:text-accent hover:bg-elevated transition-colors"
                aria-label="Delete article"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  })();

  return (
    <PageContainer className="py-8 md:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-text-primary tracking-tight">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {user ? `Signed in as ${user.user_metadata.name}` : 'Manage your writing.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard/publications"
            className="inline-flex items-center gap-1.5 rounded border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-elevated hover:text-text-primary"
          >
            Publications
          </Link>

          <Link
            to="/dashboard/articles/new"
            className="inline-flex items-center gap-1.5 rounded bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <Plus size={16} />
            New Article
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        <TabButton
          label="Published"
          count={published.length}
          active={tab === 'published'}
          onClick={() => setTab('published')}
        />
        <TabButton
          label="Drafts"
          count={drafts.length}
          active={tab === 'drafts'}
          onClick={() => setTab('drafts')}
        />
      </div>

      {/* Article List */}
      {articleListContent}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(articleToDelete)}
        isLoading={isDeleting}
        onClose={() => setArticleToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Article"
        message={`Are you sure you want to delete "${articleToDelete?.title}"? This action cannot be undone.`}
      />
    </PageContainer>
  );
}

function TabButton({ label, count, active, onClick }: Readonly<{ label: string; count: number; active: boolean; onClick: () => void }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-200 ${active
        ? 'border-accent text-text-primary'
        : 'border-transparent text-text-muted hover:text-text-secondary'
        }`}
    >
      {label}
      <span className="ml-1.5 font-mono text-xs text-text-muted">{count}</span>
    </button>
  );
}