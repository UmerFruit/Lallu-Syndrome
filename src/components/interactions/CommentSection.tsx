import { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import type { Comment } from '@/types';
import { getComments, addComment } from '@/services/articleService';
import { useAuth } from '@/contexts/AuthContext';
import { relativeTime } from '@/utils/date';

type CommentSectionProps = {
  articleId: string;
};

export function CommentSection({ articleId }: Readonly<CommentSectionProps>) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;
    getComments(articleId)
    .then((c) => {
      if (mounted) {
        setComments(c);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [articleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;
    setSubmitting(true);
    const newComment = await addComment(articleId, user.user_metadata.name, content.trim());
    setComments((prev) => [...prev, newComment]);
    setContent('');
    setSubmitting(false);
  };

  const topLevel = comments.filter((c) => !c.parentId);
  const getReplies = (parentId: string) => comments.filter((c) => c.parentId === parentId);

  let commentsContent: JSX.Element;

  if (loading) {
    commentsContent = (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse">
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
  } else if (topLevel.length === 0) {
    commentsContent = <p className="text-sm text-text-muted">No comments yet. Be the first to say something.</p>;
  } else {
    commentsContent = (
      <div className="space-y-6">
        {topLevel.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            replies={getReplies(comment.id)}
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

      {user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-3">
            {user.user_metadata.avatar ? (
              <img src={user.user_metadata.avatar} alt={user.user_metadata.name} className="w-9 h-9 rounded-full flex-shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-elevated flex items-center justify-center text-sm font-medium text-text-secondary flex-shrink-0">
                {user.user_metadata.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
                className="w-full rounded bg-surface border border-border px-3.5 py-2.5 text-text-primary placeholder:text-text-muted text-sm resize-y transition-colors focus:border-accent focus:outline-none"
                aria-label="Write a comment"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!content.trim() || submitting}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <Send size={14} />
                  Comment
                </button>
              </div>
            </div>
          </div>
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

function CommentItem({ comment, replies }: Readonly<{ comment: Comment; replies: Comment[] }>) {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        {comment.avatar ? (
          <img src={comment.avatar} alt={comment.author} className="w-9 h-9 rounded-full flex-shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-elevated flex items-center justify-center text-sm font-medium text-text-secondary flex-shrink-0">
            {comment.author.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-text-primary">{comment.author}</span>
            <span className="font-mono text-xs text-text-muted">{relativeTime(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">{comment.content}</p>
          {replies.length > 0 && (
            <div className="mt-4 pl-4 border-l border-border-subtle space-y-4">
              {replies.map((reply) => (
                <div key={reply.id} className="flex gap-3">
                  {reply.avatar ? (
                    <img src={reply.avatar} alt={reply.author} className="w-7 h-7 rounded-full flex-shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-elevated flex items-center justify-center text-xs font-medium text-text-secondary flex-shrink-0">
                      {reply.author.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-text-primary">{reply.author}</span>
                      <span className="font-mono text-xs text-text-muted">{relativeTime(reply.createdAt)}</span>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
