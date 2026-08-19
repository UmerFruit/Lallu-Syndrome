import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { Article } from '@/types';
import { formatDate } from '@/utils/date';
import { Badge } from '@/components/ui/Badge';

type FeaturedArticleProps = {
  article: Article;
};

export function FeaturedArticle({ article }: Readonly<FeaturedArticleProps>) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
      <Link
        to={`/articles/${article.slug}`}
        className="group block overflow-hidden rounded-card border border-border-subtle"
      >
        <div className="relative aspect-video overflow-hidden bg-elevated">
          <img
            src={article.coverImage}
            alt={article.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
      </Link>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Badge variant="accent">{article.category}</Badge>
          <span className="font-mono text-xs text-text-muted">{article.readingTime} min read</span>
        </div>

        <h2 className="font-serif text-3xl md:text-4xl font-medium text-text-primary leading-[1.15] tracking-tight text-balance">
          <Link
            to={`/articles/${article.slug}`}
            className="hover:text-accent transition-colors duration-200"
          >
            {article.title}
          </Link>
        </h2>

        <div className="flex items-center gap-3 pt-2">
          <Link
            to={`/articles/${article.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-text-primary hover:text-accent transition-colors duration-200"
          >
            Read the article
            <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <span className="font-mono text-xs text-text-muted">
            {article.publishedAt && formatDate(article.publishedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
