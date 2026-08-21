import type { Article } from '@/types';
import { ArticleCard, ArticleGrid } from '@/components/articles/ArticleCard';

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
      <ArticleGrid articles={articles}/>
    </section>
  );
}
