import { useState } from 'react';
import { Heart } from 'lucide-react';
import { toggleLike } from '@/services/articleService';

type LikeButtonProps = {
  articleId: string;
  initialLikes: number;
  initiallyLiked?: boolean;
};

export function LikeButton({ articleId, initialLikes, initiallyLiked = false }: Readonly<LikeButtonProps>) {
  const [liked, setLiked] = useState(initiallyLiked);
  const [likes, setLikes] = useState(initialLikes);
  const [animating, setAnimating] = useState(false);

  const handleToggle = async () => {
    const result = await toggleLike(articleId);
    setLiked(result.liked);
    setLikes(result.likes);
    if (result.liked) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 300);
    }
  };

  return (
    <button 
      type="button"
      onClick={handleToggle}
      className="group inline-flex items-center gap-2.5 px-4 py-2.5 rounded border border-border bg-surface hover:border-text-muted transition-colors duration-200"
      aria-pressed={liked}
      aria-label={liked ? 'Unlike article' : 'Like article'}
    >
      <Heart
        size={20}
        className={`transition-all duration-200 ${
          liked
            ? 'fill-accent text-accent'
            : 'text-text-muted group-hover:text-text-secondary'
        } ${animating ? 'animate-pulse-once' : ''}`}
      />
      <span className={`text-sm font-medium ${liked ? 'text-accent' : 'text-text-secondary'}`}>
        {likes}
      </span>
    </button>
  );
}
