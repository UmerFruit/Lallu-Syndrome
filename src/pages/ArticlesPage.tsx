import { useEffect, useState } from 'react';
import type { Article, Category } from '@/types';
import { getArticles } from '@/services/articleService';
import { getCategories } from '@/services/categoryService';
import { CategoryButton } from '@/components/ui/CategoryButton';
import { PageContainer } from '@/components/layout/Navbar';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { ArticleCardSkeleton } from '@/components/ui/Skeleton';

export function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    Promise.all([
      getArticles(),
      getCategories(),
    ]).then(([articlesResults, categoriesResults]) => {
      setArticles(articlesResults);
      setCategories(categoriesResults);
      setLoading(false);
    });
  }, []);

  const filtered = activeCategory === 'all'
    ? articles
    : articles.filter((a) => a.category === activeCategory);

  let articleContent;

  if (loading) {
    articleContent = (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 9 }).map((_, i) => <ArticleCardSkeleton key={i} />)}
      </div>
    );
  } else if (filtered.length === 0) {
    articleContent = (
      <p className="text-text-muted py-12 text-center">No articles in this category yet.</p>
    );
  } else {
    articleContent = (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    );
  }

  return (
    <PageContainer className="py-8 md:py-12">
      <div className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-text-primary tracking-tight">
          Articles
        </h1>
        <p className="mt-2 text-text-secondary">
          All published writing, sorted by recency.
        </p>
      </div>

      <div className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">        <CategoryButton
        label="All"
        active={activeCategory === 'all'}
        onClick={() => setActiveCategory('all')}
      />
        {categories.map((cat) => (
          <CategoryButton
            key={cat.slug}
            label={cat.name}
            active={activeCategory === cat.slug}
            onClick={() => setActiveCategory(cat.slug)}
          />
        ))}
      </div>

      {articleContent}
    </PageContainer>
  );
}

