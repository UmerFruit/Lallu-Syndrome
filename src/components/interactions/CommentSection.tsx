// src/components/interactions/CommentSection.tsx
import { useEffect, useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';
import type { Comment } from '@/types';
import { getComments, addComment } from '@/services/articleService';
import { useAuth } from '@/contexts/AuthContext';
import { relativeTime } from '@/utils/date';
import type { User } from '@supabase/supabase-js';

type CommentSectionProps = {
  articleId: string;
};

export function CommentSection({ articleId }: Readonly<CommentSectionProps>) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuth();

  useEffect(() => {
    let mounted = true;
    const loadComments = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getComments(articleId);
        if (mounted) setComments(result);
      } catch {
        if (mounted) setError('Unable to load comments.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadComments();
    return () => { mounted = false; };
  }, [articleId]);

  // Helper to add a new comment/reply to the local state
  const handleAddComment = (newComment: Comment) => {
    setComments((prev) => [...prev, newComment]);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent || !user || submitting) return;

    try {
      setSubmitting(true);
      setError(null);
      const newComment = await addComment(articleId, trimmedContent);
      handleAddComment(newComment);
      setContent('');
    } catch {
      setError('Unable to post your comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const topLevel = comments.filter((comment) => comment.parentId === null);
  const getReplies = (parentId: string) =>
    comments.filter((comment) => comment.parentId === parentId);

  let commentsContent: JSX.Element;
  if (loading) {
    commentsContent = (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-elevated" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 bg-elevated rounded" />
                <div className="h-4 w-full bg-elevated rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  } else if (error && comments.length === 0) {
    commentsContent = <p className="text-sm text-text-muted">{error}</p>;
  } else if (topLevel.length === 0) {
    commentsContent = (
      <p className="text-sm text-text-muted">
        No comments yet. Be the first to say something.
      </p>
    );
  } else {
    commentsContent = (
      <div className="space-y-6">
        {topLevel.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            replies={getReplies(comment.id)}
            articleId={articleId}
            user={user}
            onReplyAdded={handleAddComment}
          />
        ))}
      </div>
    );
  }

  return (
    <section className="mt-16 pt-10 border-t border-border-subtle">
      <h3 className="font-mono text-xs uppercase tracking-wider text-text-muted mb-6">
        Comments
      </h3>

      {/* Top-level comment form */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-3">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name ?? 'User'}
                className="w-9 h-9 rounded-full flex-shrink-0 object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-elevated flex items-center justify-center text-sm font-medium text-text-secondary flex-shrink-0">
                {(profile?.display_name ?? user.email ?? 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="Write a comment..."
                rows={3}
                maxLength={1000}
                className="w-full rounded bg-surface border border-border px-3.5 py-2.5 text-text-primary placeholder:text-text-muted text-sm resize-y transition-colors focus:border-accent focus:outline-none"
                aria-label="Write a comment"
                disabled={submitting}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!content.trim() || submitting}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <Send size={14} />
                  {submitting ? 'Posting...' : 'Comment'}
                </button>
              </div>
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-accent">{error}</p>}
        </form>
      ) : (
        <div className="mb-8 p-4 rounded border border-border-subtle bg-surface text-sm text-text-muted text-center">
          <a href="/login" className="text-accent hover:underline">Sign in</a> to leave a comment.
        </div>
      )}

      {commentsContent}
    </section>
  );
}

// Recursive Comment Item component
function CommentItem({
  comment,
  replies,
  articleId,
  user,
  onReplyAdded,
}: Readonly<{
  comment: Comment;
  replies: Comment[];
  articleId: string;
  user: User | null;
  onReplyAdded: (newComment: Comment) => void;
}>) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReplySubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = replyContent.trim();
    if (!trimmed || !user || submitting) return;

    try {
      setSubmitting(true);
      // Pass the parent comment's ID to create a threaded reply
      const newComment = await addComment(articleId, trimmed, comment.id);
      onReplyAdded(newComment);
      setReplyContent('');
      setIsReplying(false);
    } catch (error) {
      console.error('Failed to post reply:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        {comment.avatar ? (
          <img
            src={comment.avatar}
            alt={comment.author}
            className="w-9 h-9 rounded-full flex-shrink-0 object-cover"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-elevated flex items-center justify-center text-sm font-medium text-text-secondary flex-shrink-0">
            {comment.author.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Header with Reply button */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-medium text-text-primary">
              {comment.author}
            </span>
            <span className="font-mono text-xs text-text-muted">
              {relativeTime(comment.createdAt)}
            </span>
            {user && (
              <button
                type="button"
                onClick={() => setIsReplying(!isReplying)}
                className="text-xs font-medium text-text-muted hover:text-text-secondary transition-colors"
              >
                {isReplying ? 'Cancel' : 'Reply'}
              </button>
            )}
          </div>

          {/* Comment Content */}
          <p className="text-sm text-text-secondary leading-relaxed">
            {comment.content}
          </p>

          {/* Inline Reply Form */}
          {isReplying && (
            <form onSubmit={handleReplySubmit} className="mt-3 flex gap-2">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="Write a reply..."
                rows={2}
                maxLength={1000}
                className="flex-1 rounded bg-surface border border-border px-3 py-2 text-text-primary placeholder:text-text-muted text-sm resize-y focus:border-accent focus:outline-none"
                disabled={submitting}
                autoFocus
              />
              <button
                type="submit"
                disabled={!replyContent.trim() || submitting}
                className="inline-flex items-center justify-center p-2 rounded bg-accent text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={14} />
              </button>
            </form>
          )}

          {/* Nested Replies */}
          {replies.length > 0 && (
            <div className="mt-4 pl-4 border-l border-border-subtle space-y-4">
              {replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  replies={[]} // Keeps UI clean at 1 level of visual nesting
                  articleId={articleId}
                  user={user}
                  onReplyAdded={onReplyAdded}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}