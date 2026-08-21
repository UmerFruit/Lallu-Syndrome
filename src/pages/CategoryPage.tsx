import { useParams } from 'react-router-dom';
import { getArticlesByCategory } from '@/services/articleService';
import { getCategoryBySlug } from '@/services/categoryService';

import { PageContainer } from '@/components/layout/Navbar';
import { ArticleGrid } from '@/components/articles/ArticleCard';
import { ArticleCardSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { useQuery } from '@tanstack/react-query';

export function CategoryPage() {
  const { category } = useParams<{ category: string }>();

  const { data: articles = [], isLoading: articlesLoading } = useQuery({
    queryKey: ['articles', 'category', category],
    queryFn: () => getArticlesByCategory(category!),
    enabled: Boolean(category),
  });

  const { data: cat, isLoading: catLoading } = useQuery({
    queryKey: ['category', category],
    queryFn: () => getCategoryBySlug(category!),
    enabled: Boolean(category),
    retry: false,
  });

  if (articlesLoading || catLoading) {
    return (
      <PageContainer className="py-8 md:py-12">
        <div className="mb-8">
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <ArticleCardSkeleton key={i} />)}
        </div>
      </PageContainer>
    );
  }

  if (!cat) {
    return (
      <PageContainer className="py-20 text-center">
        <h1 className="font-serif text-2xl text-text-primary mb-2">Category not found</h1>
        <p className="text-text-muted">This category does not exist.</p>
      </PageContainer>
    );
  }

  const renderArticles = () => {
    if (articles.length === 0) {
      return <p className="text-text-muted py-12 text-center">No articles in this category yet.</p>;
    }

    return <ArticleGrid articles={articles} />;
  };

  return (
    <PageContainer className="py-8 md:py-12">
      <div className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-text-primary tracking-tight capitalize">
          {cat.name}
        </h1>
      </div>

      {renderArticles()}
    </PageContainer>
  );
}