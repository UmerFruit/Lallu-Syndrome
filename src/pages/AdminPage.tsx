import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Shield, MessageSquare, FileText, Users, ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/layout/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, relativeTime } from '@/utils/date';
import { Badge } from '@/components/ui/Badge';
import {
  getAllProfiles,
  updateUserAdminStatus,
  getAllComments,
  adminDeleteComment,
  getAllArticlesAdmin,
  adminDeleteArticle,
  type AdminComment,
  type AdminArticle,
} from '@/services/adminService';
import type { Profile } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

type Tab = 'users' | 'comments' | 'articles';

export function AdminPage() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>('users');

  return (
    <PageContainer className="py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield size={24} className="text-accent" />
          <h1 className="font-serif text-3xl font-semibold text-text-primary tracking-tight">
            Admin Panel
          </h1>
        </div>
        <p className="text-sm text-text-secondary">
          Manage users, moderate comments, and oversee all articles.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        <TabButton
          icon={<Users size={16} />}
          label="Users"
          active={tab === 'users'}
          onClick={() => setTab('users')}
        />
        <TabButton
          icon={<MessageSquare size={16} />}
          label="Comments"
          active={tab === 'comments'}
          onClick={() => setTab('comments')}
        />
        <TabButton
          icon={<FileText size={16} />}
          label="Articles"
          active={tab === 'articles'}
          onClick={() => setTab('articles')}
        />
      </div>

      {/* Tab Content */}
      {tab === 'users' && <UsersTab />}
      {tab === 'comments' && <CommentsTab />}
      {tab === 'articles' && <ArticlesTab />}

      {/* Back link */}
      <div className="mt-12">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
      </div>
    </PageContainer>
  );
}

// ─── Users Tab ───────────────────────────────────────────────
function UsersTab() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    getAllProfiles()
      .then(setProfiles)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleAdminToggle = async (userId: string, isAdmin: boolean) => {
    setUpdatingId(userId);
    try {
      await updateUserAdminStatus(userId, isAdmin);
      setProfiles((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, is_admin: isAdmin } : p))
      );
    } catch (error) {
      console.error('Failed to update admin status:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <LoadingSkeleton rows={5} />;

  return (
    <div className="space-y-2">
      {profiles.map((p) => (
        <div
          key={p.id}
          className="flex items-center gap-4 p-4 rounded border border-border-subtle bg-surface"
        >
          {/* Avatar */}
          <Avatar src={p.avatar_url} name={p.display_name} size="md" />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {p.display_name}
            </p>
            <p className="text-xs text-text-muted truncate">
              {p.username ? `@${p.username}` : p.id.slice(0, 8)}
              {' · '}Joined {formatDate(p.created_at)}
            </p>
          </div>

          {/* Role Selector */}
          <select
            value={p.is_admin ? 'admin' : 'user'}
            onChange={(e) => handleAdminToggle(p.id, e.target.value === 'admin')}
            disabled={updatingId === p.id}
            className="rounded border border-border bg-bg px-2.5 py-1.5 text-xs font-mono text-text-secondary focus:border-accent focus:outline-none disabled:opacity-50"
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>

          {/* Role Badge */}
          <Badge variant={p.is_admin ? 'accent' : 'muted'}>
            {p.is_admin ? 'admin' : 'user'}
          </Badge>
        </div>
      ))}
    </div>
  );
}
// ─── Comments Tab ────────────────────────────────────────────
function CommentsTab() {
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null; isDeleting: boolean }>({
    isOpen: false,
    id: null,
    isDeleting: false,
  });

  useEffect(() => {
    getAllComments()
      .then(setComments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleConfirmDelete = async () => {
    if (!deleteModal.id) return;
    
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    try {
      await adminDeleteComment(deleteModal.id);
      setComments((prev) => prev.filter((c) => c.id !== deleteModal.id));
      setDeleteModal({ isOpen: false, id: null, isDeleting: false });
    } catch (error) {
      console.error('Failed to delete comment:', error);
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  if (loading) return <LoadingSkeleton rows={5} />;

  if (comments.length === 0) {
    return <p className="text-text-muted py-12 text-center">No comments yet.</p>;
  }

  return (
    <div className="space-y-2">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="flex items-start gap-4 p-4 rounded border border-border-subtle bg-surface"
        >
          {/* Avatar Component Cleanup */}
          <Avatar src={comment.author_avatar} name={comment.author_name} size="sm" className="mt-0.5" />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-text-primary">
                {comment.author_name}
              </span>
              <span className="font-mono text-xs text-text-muted">
                {relativeTime(comment.created_at)}
              </span>
              {comment.parent_id && (
                <Badge variant="muted">reply</Badge>
              )}
            </div>
            <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">
              {comment.content}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              on <span className="text-text-secondary">{comment.article_title}</span>
            </p>
          </div>

          {/* Delete */}
          <button
            type="button"
            onClick={() => setDeleteModal({ isOpen: true, id: comment.id, isDeleting: false })}
            className="p-2 rounded text-text-muted hover:text-accent hover:bg-elevated transition-colors"
            aria-label="Delete comment"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Delete Comment"
        message="Delete this comment permanently?"
        isLoading={deleteModal.isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModal({ isOpen: false, id: null, isDeleting: false })}
      />
    </div>
  );
}

// ─── Articles Tab ────────────────────────────────────────────
function ArticlesTab() {
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null; isDeleting: boolean }>({
    isOpen: false,
    id: null,
    isDeleting: false,
  });

  useEffect(() => {
    getAllArticlesAdmin()
      .then(setArticles)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleConfirmDelete = async () => {
    if (!deleteModal.id) return;
    
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    try {
      await adminDeleteArticle(deleteModal.id);
      setArticles((prev) => prev.filter((a) => a.id !== deleteModal.id));
      setDeleteModal({ isOpen: false, id: null, isDeleting: false });
    } catch (error) {
      console.error('Failed to delete article:', error);
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  if (loading) return <LoadingSkeleton rows={5} />;

  if (articles.length === 0) {
    return <p className="text-text-muted py-12 text-center">No articles yet.</p>;
  }

  return (
    <div className="space-y-2">
      {articles.map((article) => (
        <div
          key={article.id}
          className="flex items-center gap-4 p-4 rounded border border-border-subtle bg-surface"
        >
          {/* Status indicator */}
          <div
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              article.status === 'published' ? 'bg-emerald-500' : 'bg-text-muted'
            }`}
          />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {article.title}
            </p>
            <p className="text-xs text-text-muted">
              by <span className="text-text-secondary">{article.author_name}</span>
              {' · '}
              {article.category_name}
              {' · '}
              {article.status === 'published' && article.published_at
                ? `Published ${formatDate(article.published_at)}`
                : `Draft · Created ${formatDate(article.created_at)}`
              }
            </p>
          </div>

          {/* Status Badge */}
          <Badge variant={article.status === 'published' ? 'accent' : 'muted'}>
            {article.status}
          </Badge>

          {/* View Link */}
          {article.status === 'published' && (
            <Link
              to={`/articles/${article.slug}`}
              className="text-xs text-text-muted hover:text-text-primary transition-colors"
            >
              View
            </Link>
          )}

          {/* Delete */}
          <button
            type="button"
            onClick={() => setDeleteModal({ isOpen: true, id: article.id, isDeleting: false })}
            className="p-2 rounded text-text-muted hover:text-accent hover:bg-elevated transition-colors"
            aria-label="Delete article"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Delete Article"
        message="Delete this article permanently? This cannot be undone."
        isLoading={deleteModal.isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModal({ isOpen: false, id: null, isDeleting: false })}
      />
    </div>
  );
}

// ─── Shared Components ───────────────────────────────────────
function TabButton({
  icon,
  label,
  active,
  onClick,
}: Readonly<{
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-200 ${
        active
          ? 'border-accent text-text-primary'
          : 'border-transparent text-text-muted hover:text-text-secondary'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function LoadingSkeleton({ rows }: Readonly<{ rows: number }>) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-16 rounded border border-border-subtle bg-surface animate-pulse"
        />
      ))}
    </div>
  );
}