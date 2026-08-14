import { useEffect, useState } from 'react';
import { Link} from 'react-router-dom';
import type { Article } from '@/types';
import { getAllArticles, deleteArticle } from '@/services/articleService';
import { useAuth } from '@/contexts/AuthContext';
import { PageContainer } from '@/components/layout/Navbar';
import { formatDate } from '@/utils/date';
import { Badge } from '@/components/ui/Badge';
import { Plus, Pencil, Trash2, FileText} from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'published' | 'drafts'>('published');

  useEffect(() => {
    getAllArticles().then((a) => {
      setArticles(a);
      setLoading(false);
    });
  }, []);

  const published = articles.filter((a) => a.status === 'published');
  const drafts = articles.filter((a) => a.status === 'draft');
  const displayed = tab === 'published' ? published : drafts;

  const handleDelete = async (id: string) => {
    await deleteArticle(id);
    setArticles((prev) => prev.filter((a) => a.id !== id));
  };

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
        <Link
          to="/dashboard/articles/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors duration-200"
        >
          <Plus size={16} />
          New Article
        </Link>
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
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded border border-border-subtle bg-surface animate-pulse" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="py-16 text-center">
          <FileText size={32} className="mx-auto text-text-muted mb-3" />
          <p className="text-text-secondary">
            {tab === 'drafts' ? 'No drafts. Go write something.' : 'No published articles yet.'}
          </p>
        </div>
      ) : (
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
                <div className="flex items-center gap-3 mt-1">
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
                  onClick={() => handleDelete(article.id)}
                  className="p-2 rounded text-text-muted hover:text-accent hover:bg-elevated transition-colors"
                  aria-label="Delete article"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}

function TabButton({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-200 ${
        active
          ? 'border-accent text-text-primary'
          : 'border-transparent text-text-muted hover:text-text-secondary'
      }`}
    >
      {label}
      <span className="ml-1.5 font-mono text-xs text-text-muted">{count}</span>
    </button>
  );
}
