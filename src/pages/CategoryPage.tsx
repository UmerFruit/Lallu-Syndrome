import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Article, Category } from '@/types';
import { getArticlesByCategory } from '@/services/articleService';
import { getCategoryBySlug } from '@/services/categoryService';

import { PageContainer } from '@/components/layout/Navbar';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { ArticleCardSkeleton } from '@/components/ui/Skeleton';

export function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState<Category | undefined>(undefined);


  useEffect(() => {
    if (!category) return;
    Promise.all([
      getArticlesByCategory(category),
      getCategoryBySlug(category),
    ]).then(([articlesResults, categoryResult]) => {
      setArticles(articlesResults);
      setCat(categoryResult);
      setLoading(false);
    }).catch(console.error);

  }, [category]);

  if (!cat) {
    return (
      <PageContainer className="py-20 text-center">
        <h1 className="font-serif text-2xl text-text-primary mb-2">Category not found</h1>
        <p className="text-text-muted">This category does not exist.</p>
      </PageContainer>
    );
  }

  const renderArticles = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <ArticleCardSkeleton key={i} />)}
        </div>
      );
    }

    if (articles.length === 0) {
      return <p className="text-text-muted py-12 text-center">No articles in this category yet.</p>;
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    );
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
