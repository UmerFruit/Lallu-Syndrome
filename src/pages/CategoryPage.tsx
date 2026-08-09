import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Article } from '@/types';
import { getArticlesByCategory, getCategoryBySlug } from '@/services/articleService';
import { PageContainer } from '@/components/layout/Navbar';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { ArticleCardSkeleton } from '@/components/ui/Skeleton';

export function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const cat = category ? getCategoryBySlug(category) : undefined;

  useEffect(() => {
    if (!category) return;
    setLoading(true);
    getArticlesByCategory(category).then((a) => {
      setArticles(a);
      setLoading(false);
    });
  }, [category]);

  if (!cat) {
    return (
      <PageContainer className="py-20 text-center">
        <h1 className="font-serif text-2xl text-text-primary mb-2">Category not found</h1>
        <p className="text-text-muted">This category does not exist.</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-8 md:py-12">
      <div className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-text-primary tracking-tight capitalize">
          {cat.name}
        </h1>
        <p className="mt-2 text-text-secondary max-w-xl">
          {cat.description}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <ArticleCardSkeleton key={i} />)}
        </div>
      ) : articles.length === 0 ? (
        <p className="text-text-muted py-12 text-center">No articles in this category yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
