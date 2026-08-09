import { useEffect, useState } from 'react';
import type { Article } from '@/types';
import { getArticles, getCategories } from '@/services/articleService';
import { PageContainer } from '@/components/layout/Navbar';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { ArticleCardSkeleton } from '@/components/ui/Skeleton';
import { Link } from 'react-router-dom';

export function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const categories = getCategories();

  useEffect(() => {
    getArticles().then((a) => {
      setArticles(a);
      setLoading(false);
    });
  }, []);

  const filtered = activeCategory === 'all'
    ? articles
    : articles.filter((a) => a.category === activeCategory);

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

      <div className="flex flex-wrap gap-2 mb-8">
        <CategoryButton
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

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => <ArticleCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-text-muted py-12 text-center">No articles in this category yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}

function CategoryButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded font-mono text-xs uppercase tracking-wider border transition-colors duration-200 ${
        active
          ? 'border-accent text-accent bg-accent/5'
          : 'border-border text-text-muted hover:text-text-secondary hover:border-text-muted'
      }`}
    >
      {label}
    </button>
  );
}
