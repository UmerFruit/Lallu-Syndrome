import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { Article, Publication } from '@/types';
import { getPublicationBySlug } from '@/services/publicationService';
import { getArticlesByPublication } from '@/services/articleService';
import { PageContainer } from '@/components/layout/Navbar';
import { ArticleCard, ArticleGrid } from '@/components/articles/ArticleCard';
import { ArticleCardSkeleton } from '@/components/ui/Skeleton';

export function PublicationPage() {
  const { slug } = useParams<{ slug: string }>();

  const [publication, setPublication] = useState<Publication | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;

    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setNotFound(false);

        const pub = await getPublicationBySlug(slug);

        if (!mounted) return;

        if (!pub) {
          setNotFound(true);
          return;
        }

        setPublication(pub);

        const publicationArticles = await getArticlesByPublication(pub.slug);

        if (!mounted) return;

        setArticles(publicationArticles);
      } catch (error) {
        console.error('Failed to load publication:', error);

        if (mounted) {
          setNotFound(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <PageContainer className="py-12">
        <div className="mb-10 space-y-3">
          <div className="h-4 w-32 animate-pulse rounded bg-elevated" />
          <div className="h-10 w-64 animate-pulse rounded bg-elevated" />
          <div className="h-4 w-96 max-w-full animate-pulse rounded bg-elevated" />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </div>
      </PageContainer>
    );
  }

  if (notFound || !publication) {
    return (
      <PageContainer className="py-24 text-center">
        <p className="mb-4 font-mono text-sm uppercase tracking-[0.25em] text-text-muted">
          Publication
        </p>

        <h1 className="mb-4 font-serif text-4xl font-medium tracking-tight text-text-primary">
          Not found<span className="text-accent">.</span>
        </h1>

        <p className="mx-auto mb-8 max-w-md text-text-secondary">
          This publication does not exist or may have been removed.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-accent transition-colors hover:text-accent-hover"
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-12">
      <header className="mb-10 max-w-2xl">
        <p className="mb-3 font-mono text-xs uppercase tracking-wider text-text-muted">
          Publication
        </p>

        <h1 className="font-serif text-3xl font-semibold tracking-tight text-text-primary md:text-4xl">
          {publication.name}
        </h1>

        {publication.description && (
          <p className="mt-3 text-text-secondary">
            {publication.description}
          </p>
        )}

       
      </header>

      {articles.length === 0 ? (
        <p className="py-12 text-center text-text-muted">
          No published articles yet.
        </p>
      ) : (
        <ArticleGrid articles={articles} />
      )}
    </PageContainer>
  );
}