import { useState, type FormEvent } from 'react';
import { Send, Trash2 } from 'lucide-react';
import type { Comment } from '@/types';
import { getComments, addComment, deleteComment } from '@/services/articleService';
import { useAuth } from '@/contexts/AuthContext';
import { relativeTime } from '@/utils/date';
import type { User } from '@supabase/supabase-js';
import { Avatar } from '@/components/ui/Avatar';
import { useMutation, useQuery, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Textarea } from '../ui/Textarea';

type AddCommentInput = { text: string; parentId: string | null };
type AddCommentMutation = UseMutationResult<Comment, Error, AddCommentInput>;

type CommentSectionProps = { articleId: string; };

export function CommentSection({ articleId }: Readonly<CommentSectionProps>) {
  const [content, setContent] = useState('');
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading: loading, isError } = useQuery({
    queryKey: ['comments', articleId],
    queryFn: () => getComments(articleId),
  });

  const addMutation = useMutation({
    mutationFn: ({ text, parentId }: AddCommentInput) => addComment(articleId, text, parentId),
    onSuccess: (newComment) => {
      queryClient.setQueryData<Comment[]>(['comments', articleId], (prev) => [
        ...(prev ?? []),
        newComment,
      ]);
    },
  });

  const topFormSubmitting = addMutation.isPending && addMutation.variables?.parentId === null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || !user || topFormSubmitting) return;
    addMutation.mutate({ text: trimmed, parentId: null }, {
      onSuccess: () => setContent(''),
    });
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
  } else if (isError && comments.length === 0) {
    commentsContent = <p className="text-sm text-text-muted">Unable to load comments.</p>;
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
            addMutation={addMutation}
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
            <Avatar src={profile?.avatar_url} name={profile?.display_name ?? user.email ?? 'U'} className="h-9 w-9" />
            <div className="flex-1">
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} 
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
               placeholder="Write a comment..." rows={3} maxLength={1000} aria-label="Write a comment" disabled={topFormSubmitting} />

              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!content.trim() || topFormSubmitting}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <Send size={14} />
                  {topFormSubmitting ? 'Posting...' : 'Comment'}
                </button>
              </div>
            </div>
          </div>
          {addMutation.isError && (
            <p className="mt-3 text-sm text-accent">Unable to post your comment. Please try again.</p>
          )}
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
  addMutation,
}: Readonly<{
  comment: Comment;
  replies: Comment[];
  articleId: string;
  user: User | null;
  addMutation: AddCommentMutation;
}>) {
  const queryClient = useQueryClient();
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deleteComment(comment.id),
    onSuccess: () => {
      queryClient.setQueryData<Comment[]>(['comments', articleId], (prev) =>
        (prev ?? []).filter((c) => c.id !== comment.id && c.parentId !== comment.id)
      );
      setShowDeleteModal(false);
    },
    onError: (error) => console.error('Failed to delete comment:', error),
  });

  const isOwner = user?.id === comment.authorId;
  const canDelete = isOwner; // || isAdmin
  const submittingReply = addMutation.isPending && addMutation.variables?.parentId === comment.id;

  const handleDelete = async () => {
    setShowDeleteModal(true);
  };

  const handleReplySubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = replyContent.trim();
    if (!trimmed || !user || submittingReply) return;
    addMutation.mutate({ text: trimmed, parentId: comment.id }, {
      onSuccess: () => {
        setReplyContent('');
        setIsReplying(false);
      },
    });
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex gap-3">
          <Avatar src={comment.avatar} name={comment.author} className="h-9 w-9 shrink-0" fallbackClassName="text-xs" />
          <div className="flex-1 min-w-0">
            {/* Header with Reply & Delete buttons */}
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
                  className="-my-1 rounded px-2 py-1 text-xs font-medium text-text-muted transition-colors hover:bg-elevated hover:text-text-secondary">
                  {isReplying ? 'Cancel' : 'Reply'}
                </button>
              )}
              {/* DELETE BUTTON */}
              {canDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="-my-1 rounded px-2 py-1 text-xs font-medium text-text-muted transition-colors hover:bg-accent/10 hover:text-accent disabled:opacity-50"
                  aria-label="Delete comment"
                >
                  {deleteMutation.isPending ? '...' : <Trash2 size={14} />}
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
                <Textarea
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
                  className="flex-1 rounded bg-surface border border-border px-3 py-2 text-text-primary placeholder:text-text-muted text-base sm:text-sm resize-y focus:border-accent focus:outline-none"
                  disabled={submittingReply}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!replyContent.trim() || submittingReply}
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
                    replies={[]}
                    articleId={articleId}
                    user={user}
                    addMutation={addMutation}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onClose={() => setShowDeleteModal(false)}
      />
    </>
  );
}