import { useEffect, useState } from 'react';
import type { Article, Category } from '@/types';
import { getLatestArticle, getLatestArticles, getArticles } from '@/services/articleService';
import { PageContainer } from '@/components/layout/Navbar';
import { FeaturedArticle } from '@/components/articles/FeaturedArticle';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { FeaturedArticleSkeleton, ArticleCardSkeleton } from '@/components/ui/Skeleton';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getCategories } from '@/services/categoryService';

export function HomePage() {
  const [featured, setFeatured] = useState<Article | null>(null);
  const [latest, setLatest] = useState<Article[]>([]);
  const [all, setAll] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getLatestArticle(),
      getLatestArticles(4),
      getArticles(),
      getCategories(),
    ])
      .then(([feat, lat, allArts, categoryResults]) => {
        setFeatured(feat);
        setLatest(lat.filter((a) => a.id !== feat?.id).slice(0, 3));
        setAll(allArts);
        setCategories(categoryResults);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const filtered = activeCategory === 'all'
    ? all
    : all.filter((a) => a.category === activeCategory);

  let articleGridContent: JSX.Element;

  if (loading) {
    articleGridContent = (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => <ArticleCardSkeleton key={i} />)}
      </div>
    );
  } else if (filtered.length === 0) {
    articleGridContent = <p className="text-text-muted py-12 text-center">No articles in this category yet.</p>;
  } else {
    articleGridContent = (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    );
  }

  let featuredContent: JSX.Element;

  if (loading) {
    featuredContent = <FeaturedArticleSkeleton />;
  } else if (featured) {
    featuredContent = <FeaturedArticle article={featured} />;
  } else {
    featuredContent = <p className="text-text-muted">Nothing here yet.</p>;
  }

  return (
    <PageContainer className="py-8 md:py-12">
      {/* Intro */}
      <div className="mb-12 md:mb-16 max-w-2xl">
        <h1 className="font-serif text-2xl md:text-3xl font-semibold text-text-primary tracking-tight">
          Lallu Syndrome
        </h1>
        <p className="mt-2 text-text-secondary text-lg leading-relaxed">
          Notes, experiments, and deep dives into technology.
        </p>
      </div>

      {/* Featured Article */}
      <section className="mb-16 md:mb-20">
        {featuredContent}
      </section>

      {/* Latest Posts */}
      {latest.length > 0 && (
        <section className="mb-16 md:mb-20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-mono text-xs uppercase tracking-wider text-text-muted">
              Latest Posts
            </h2>
            <Link
              to="/articles"
              className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              View all
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <ArticleCardSkeleton key={i} />)
              : latest.map((article) => <ArticleCard key={article.id} article={article} />)}
          </div>
        </section>
      )}

      {/* Category Filters */}
      <section className="mb-8">
        <div className="flex flex-wrap gap-2">
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
      </section>

      {/* Article Grid */}
      <section className="mb-12">
        {articleGridContent}
      </section>
    </PageContainer>
  );
}

function CategoryButton({ label, active, onClick }: Readonly<{ label: string; active: boolean; onClick: () => void }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded font-mono text-xs uppercase tracking-wider border transition-colors duration-200 ${active
          ? 'border-accent text-accent bg-accent/5'
          : 'border-border text-text-muted hover:text-text-secondary hover:border-text-muted'
        }`}
    >
      {label}
    </button>
  );
}
