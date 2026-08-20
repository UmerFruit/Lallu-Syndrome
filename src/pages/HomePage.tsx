import { useEffect, useState, Suspense, lazy } from 'react';
import type { Article, Category } from '@/types';
import { getArticles } from '@/services/articleService';
import { PageContainer } from '@/components/layout/Navbar';
import { FeaturedArticle } from '@/components/articles/FeaturedArticle';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { FeaturedArticleSkeleton, ArticleCardSkeleton } from '@/components/ui/Skeleton';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getCategories } from '@/services/categoryService';
import { CategoryButton } from '@/components/ui/CategoryButton';

const ParticleText = lazy(() => import('@/components/ui/ParticleText'));

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

export function HomePage() {
  const [featured, setFeatured] = useState<Article | null>(null);
  const [latest, setLatest] = useState<Article[]>([]);
  const [all, setAll] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery('(max-width: 767px)');
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  useEffect(() => {
    async function loadHome() {
      try {
        const [allArts, categoryResults] = await Promise.all([
          getArticles(),
          getCategories(),
        ]);

        setFeatured(allArts[0] ?? null);
        setLatest(allArts.slice(1, 4));
        setAll(allArts);
        setCategories(categoryResults);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadHome();
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

      <div className="w-full h-[220px] sm:h-[300px] md:h-[360px] bg-bg">
        {prefersReducedMotion ? (
          <div className="flex h-full items-center justify-center px-4">
            <h1 className="text-center font-serif text-4xl font-extrabold tracking-tight text-text-primary sm:text-6xl md:text-7xl">
              Lallu Syndrome
            </h1>
          </div>
        ) : (
          <Suspense fallback={null}>
            <ParticleText
              text="Lallu Syndrome"
              particleSize={isMobile ? 1 : 2.3}
              density={isMobile ? 2 : 4}
              scatter={isMobile ? 100 : 190}
              gatherDuration={isMobile ? 1500 : 2000}
              stagger={isMobile ? 250 : 420}
              pointerRepel={isMobile ? 0 : 38}
              repelRadius={isMobile ? 0 : 100}
              idleDrift={0}
              trigger="mount"
              fontSize={
                isMobile
                  ? "clamp(2.5rem, 15vw, 4.5rem)"
                  : "clamp(4rem, 13vw, 9rem)"
              }
              fontWeight={400}
              fontFamily="inherit"
              widthScale={1.05}
              glow={isMobile}
            />
          </Suspense>
        )}
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
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
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
