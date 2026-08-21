import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Article } from '@/types';
import { formatDate } from '@/utils/date';
import { Badge } from '@/components/ui/Badge';
import { getFallbackImage } from '@/utils/image';
import { Avatar } from '../ui/Avatar';

type ArticleCardProps = {
  article: Article;
};

export function ArticleGrid({ articles }: { articles: Article[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((a) => <ArticleCard key={a.id} article={a} />)}
    </div>
  );
}

export function ArticleCard({ article }: Readonly<ArticleCardProps>) {
  const [imgError, setImgError] = useState(false);
  const fallback = getFallbackImage(article.id);

  // Use fallback if coverImage is empty OR if the image failed to load
  const imageSrc = imgError || !article.coverImage ? fallback : article.coverImage;

  return (
    <Link
      to={`/articles/${article.slug}`}
      className="group block space-y-3 transition-transform duration-200 hover:-translate-y-0.5"
    >
      <div className="overflow-hidden rounded-card border border-border-subtle">
        <div className="aspect-[16/9] overflow-hidden bg-elevated">
          <img
            src={imageSrc}
            alt={article.title}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="accent">{article.category}</Badge>
        <span className="font-mono text-xs text-text-muted">{article.readingTime} min read</span>
      </div>

      <h3 className="font-serif text-lg font-medium text-text-primary leading-snug tracking-tight group-hover:text-accent transition-colors duration-200">
        {article.title}
      </h3>

      {/* Author & Date Row */}
      <div className="flex items-center gap-2.5 pt-1">
        <Avatar src={article.author.avatar} name={article.author.name} className="h-6 w-6 border border-border-subtle" fallbackClassName="text-[10px] font-semibold" />
        <div className="flex items-center gap-1.5 text-xs text-text-muted font-mono min-w-0">
          <span className="text-text-secondary font-medium truncate">{article.author.name}</span>
          <span>•</span>
          <time className="whitespace-nowrap">
            {article.publishedAt ? formatDate(article.publishedAt) : 'Draft'}
          </time>
        </div>
      </div>
    </Link>
  );
}