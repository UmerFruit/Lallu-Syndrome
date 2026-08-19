import { useState } from 'react';
import { Heart } from 'lucide-react';
import { toggleLike } from '@/services/articleService';
import { useAuth } from '@/contexts/AuthContext';

type LikeButtonProps = {
  articleId: string;
  initialLikes: number;
  initiallyLiked?: boolean;
};

export function LikeButton({ articleId, initialLikes, initiallyLiked = false }: Readonly<LikeButtonProps>) {
  const [liked, setLiked] = useState(initiallyLiked);
  const [likes, setLikes] = useState(initialLikes);
  const [animating, setAnimating] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (loading) return;

    // Intercept click if not logged in
    if (!user) {
      setShowAuthPrompt(true);
      setTimeout(() => setShowAuthPrompt(false), 3000);
      return;
    }

    setLoading(true);
    try {
      const result = await toggleLike(articleId);
      setLiked(result.liked);
      setLikes(result.likes);
      if (result.liked) {
        setAnimating(true);
        setTimeout(() => setAnimating(false), 300);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        disabled={loading}
        onClick={handleToggle}
        className="group inline-flex items-center gap-2.5 px-4 py-2.5 rounded border border-border bg-surface hover:border-text-muted transition-colors duration-200"
        aria-pressed={liked}
        aria-label={liked ? 'Unlike article' : 'Like article'}
      >
        <Heart
          size={20}
          className={`transition-all duration-200 ${liked
            ? 'fill-accent text-accent'
            : 'text-text-muted group-hover:text-text-secondary'
            } ${animating ? 'animate-pulse-once' : ''}`}
        />
        <span className={`text-sm font-medium ${liked ? 'text-accent' : 'text-text-secondary'}`}>
          {likes}
        </span>
      </button>

      {/* Tooltip message when unauthenticated */}
      {showAuthPrompt && (
        <div
          role="status"
          aria-live="polite"
          className="absolute bottom-full mb-2 left-0 whitespace-nowrap rounded bg-elevated border border-border px-2.5 py-1 text-xs text-text-primary shadow-md"
        >
          Sign in to like articles
        </div>
      )}
    </div>
  );
}