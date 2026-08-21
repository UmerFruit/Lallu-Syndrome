import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, UserX } from 'lucide-react';
import type {  Publication } from '@/types';
import { getProfileByUsername } from '@/services/profileService';
import { getPublishedArticlesByAuthor } from '@/services/articleService';
import { getMyPublications } from '@/services/publicationService';
import { PageContainer } from '@/components/layout/Navbar';
import { ArticleGrid } from '@/components/articles/ArticleCard';
import { ArticleCardSkeleton, PageSpinner } from '@/components/ui/Skeleton';
import { useQuery } from '@tanstack/react-query';

export function WriterProfilePage() {
  const { username } = useParams<{ username: string }>();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', username?.toLowerCase()],
    queryFn: () => getProfileByUsername(username!.toLowerCase()),
    enabled: Boolean(username),
    retry: false,
  });
  const { data: articles = [], isLoading: loadingArticles } = useQuery({
    queryKey: ['articles', 'author', profile?.id],
    queryFn: () => getPublishedArticlesByAuthor(profile!.id),
    enabled: Boolean(profile),
  });
  const { data: publications = [] } = useQuery({
    queryKey: ['my-publications', profile?.id],
    queryFn: () => getMyPublications(profile!.id).catch((): Publication[] => []),
    enabled: Boolean(profile),
  });

  const status: 'loading' | 'found' | 'not-found' =
    profileLoading ? 'loading' : profile ? 'found' : 'not-found'; // NOSONAR

  const externalLinks = useMemo(() => {
    if (!profile) return [];

    return [
      { label: 'Website', href: profile.website_url },
      { label: 'GitHub', href: profile.github_url },
      { label: 'LinkedIn', href: profile.linkedin_url },
    ].filter((link): link is { label: string; href: string } => Boolean(link.href));
  }, [profile]);

  const totalLikes = useMemo(
    () => articles.reduce((sum, article) => sum + article.likes, 0),
    [articles]
  );

  const latestArticles = articles.slice(0, 3);

  let latestArticlesContent;

  if (loadingArticles) {
    latestArticlesContent = (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <ArticleCardSkeleton key={i} />
        ))}
      </div>
    );
  } else if (latestArticles.length === 0) {
    latestArticlesContent = (
      <p className="py-12 text-center text-text-muted">
        No published articles yet.
      </p>
    );
  } else {
    latestArticlesContent = <ArticleGrid articles={latestArticles} />;
  }

  if (status === 'loading') {
    return <PageSpinner />;
  }

  if (status === 'not-found' || !profile) {
    return (
      <PageContainer className="py-24 text-center">
        <UserX size={32} className="mx-auto text-text-muted mb-4" />

        <h1 className="font-serif text-2xl font-semibold text-text-primary mb-2">
          Writer not found
        </h1>

        <p className="text-text-muted mb-6">
          This profile doesn't exist, or the username has changed.
        </p>

        <Link
          to="/articles"
          className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover transition-colors"
        >
          <ArrowLeft size={16} />
          Back to articles
        </Link>
      </PageContainer>
    );
  }

  const initial = profile.display_name.charAt(0).toUpperCase();

  return (
    <div className="grain">
      <PageContainer className="py-12 md:py-20">
        {/* Profile header */}
        <header className="mx-auto max-w-2xl text-center">
          <p
            className="anim-fade-up font-mono text-sm uppercase tracking-[0.25em] text-text-muted"
            style={{ animationDelay: '0.05s' }}
          >
            @{profile.username}
          </p>

          <div
            className="anim-fade-up mt-8 flex justify-center"
            style={{ animationDelay: '0.2s' }}
          >
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="h-32 w-32 rounded-full border-2 border-border bg-elevated object-cover md:h-36 md:w-36"
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-2 border-border bg-elevated font-serif text-4xl font-medium text-text-muted md:h-36 md:w-36">
                {initial}
              </div>
            )}
          </div>

          <h1
            className="anim-wipe mt-8 font-serif text-3xl font-medium leading-tight text-text-primary md:text-5xl"
            style={{ animationDelay: '0.4s' }}
          >
            {profile.display_name}
          </h1>

          {profile.bio && (
            <p
              className="anim-fade-up mx-auto mt-5 max-w-md text-base leading-relaxed text-text-secondary"
              style={{ animationDelay: '0.6s' }}
            >
              {profile.bio}
            </p>
          )}

          {externalLinks.length > 0 && (
            <div
              className="anim-fade-up mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
              style={{ animationDelay: '0.75s' }}
            >
              {externalLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
                >
                  {link.label}
                  <ArrowUpRight size={13} className="anim-arrow" />
                </a>
              ))}
            </div>
          )}

          {/* Stats */}
          <div
            className="anim-fade-up mt-10 flex items-center justify-center gap-8"
            style={{ animationDelay: '0.9s' }}
          >
            <Stat
              value={articles.length}
              label={articles.length === 1 ? 'Article' : 'Articles'}
            />

            <span className="h-8 w-px bg-border-subtle" aria-hidden="true" />

            <Stat value={totalLikes} label={totalLikes === 1 ? 'Like' : 'Likes'} />
          </div>
        </header>

        {/* Publications */}
        {publications.length > 0 && (
          <section className="mx-auto mt-12 md:mt-16 max-w-content">
            <h2 className="mb-6 font-mono text-xs uppercase tracking-wider text-text-muted">
              Publications
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {publications.map((publication) => (
                <Link
                  key={publication.id}
                  to={`/p/${publication.slug}`}
                  className="group rounded border border-border-subtle bg-surface p-4 transition-colors hover:border-border"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium text-text-primary transition-colors group-hover:text-accent">
                      {publication.name}
                    </p>

                    {publication.isDefault && (
                      <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-text-muted">
                        default
                      </span>
                    )}
                  </div>

                  {publication.description && (
                    <p className="mt-2 line-clamp-2 text-xs text-text-secondary">
                      {publication.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Latest articles */}
        <section className="mx-auto mt-12 md:mt-16 max-w-content">
          <h2 className="mb-6 font-mono text-xs uppercase tracking-wider text-text-muted">
            Latest writing
          </h2>

          {latestArticlesContent}
        </section>
      </PageContainer>
    </div>
  );
}

function Stat({ value, label }: Readonly<{ value: number; label: string }>) {
  return (
    <div className="text-center">
      <p className="font-serif text-2xl font-medium text-text-primary md:text-3xl">
        {value}
      </p>

      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
        {label}
      </p>
    </div>
  );
}