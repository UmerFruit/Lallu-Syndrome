import { Link } from 'react-router-dom';
import type { Article } from '@/types';
import { formatDate } from '@/utils/date';
import { Badge } from '@/components/ui/Badge';

type ArticleCardProps = {
  article: Article;
};

export function ArticleCard({ article }: Readonly<ArticleCardProps>) {
  return (
    <Link
      to={`/articles/${article.slug}`}
      className="group block space-y-3 transition-transform duration-200 hover:-translate-y-0.5"
    >
      <div className="overflow-hidden rounded-card border border-border-subtle">
        <div className="aspect-[16/9] overflow-hidden bg-elevated">
          <img
            src={article.coverImage}
            alt={article.title}
            loading="lazy"
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

      <time className="block font-mono text-xs text-text-muted">
        {article.publishedAt && formatDate(article.publishedAt)}
      </time>
    </Link>
  );
}
