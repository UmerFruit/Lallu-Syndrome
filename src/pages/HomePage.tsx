import { useEffect, useState, Suspense, lazy } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getArticles } from '@/services/articleService';
import { PageContainer } from '@/components/layout/Navbar';
import { FeaturedArticle } from '@/components/articles/FeaturedArticle';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { FeaturedArticleSkeleton, ArticleCardSkeleton } from '@/components/ui/Skeleton';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
const ParticleText = lazy(() => import('@/components/ui/ParticleText'));

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () =>
      typeof window === 'undefined'
        ? false
        : window.matchMedia?.(query).matches ?? false
  );
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
  const isMobile = useMediaQuery('(max-width: 767px)');
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const { data: all = [], isLoading: loading } = useQuery({
    queryKey: ['articles'],
    queryFn: getArticles,
  });

  const featured = all[0] ?? null;
  const latest = all.slice(1, 4);

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
      <div className="w-full h-[13.75rem] sm:h-[18.75rem] md:h-[22.5rem] bg-bg">
        {prefersReducedMotion ? (
          <div className="flex h-full items-center justify-center px-4">
            <h1 className="text-center font-serif text-4xl font-extrabold tracking-tight text-text-primary sm:text-6xl md:text-7xl">
              LS
            </h1>
          </div>
        ) : (
          <Suspense fallback={null}>
            <ParticleText
              text="LS"
              particleSize={isMobile ? 1 : 2.3}
              density={4}
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
              glow={false}
            />
          </Suspense>
        )}
      </div>

      {/* Featured Article */}
      <section className="mb-16 md:mb-20">
        {featuredContent}
      </section>

      {/* Latest Posts */}
      {(loading || latest.length > 0) && (
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
    </PageContainer>
  );
}