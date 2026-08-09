import type { Article } from '@/types';
import { ArticleCard } from '@/components/articles/ArticleCard';

type RelatedArticlesProps = {
  articles: Article[];
};

export function RelatedArticles({ articles }: Readonly<RelatedArticlesProps>) {
  if (articles.length === 0) return null;

  return (
    <section className="mt-16 pt-10 border-t border-border-subtle">
      <h3 className="font-mono text-xs uppercase tracking-wider text-text-muted mb-6">
        Related Articles
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}
