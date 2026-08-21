import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { Article } from '@/types';
import { getArticleBySlug, getRelatedArticles, isLiked } from '@/services/articleService';
import { formatDateLong } from '@/utils/date';
import { ArticleContent } from '@/components/articles/ArticleContent';
import { ArticleProgress } from '@/components/articles/ArticleProgress';
import { TableOfContents, extractHeadings } from '@/components/articles/TableOfContents';
import { RelatedArticles } from '@/components/articles/RelatedArticles';
import { LikeButton } from '@/components/interactions/LikeButton';
import { ShareButton } from '@/components/interactions/ShareButton';
import { CommentSection } from '@/components/interactions/CommentSection';
import { ArticlePageSkeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getFallbackImage } from '@/utils/image';

function AuthorCard({ author }: Readonly<{ author: Article['author'] }>) {
  const cardClass =
    'block rounded-card border border-border-subtle border-l-2 border-l-accent bg-surface p-5';
  const inner = (
    <>
      <div className="flex flex-col items-center gap-3">
        {author.avatar && (
          <img
            src={author.avatar}
            alt={author.name}
            className="avatar shrink-0 border border-border-subtle bg-elevated"
          />
        )}
        <span
          className={`text-center text-sm font-medium text-text-primary transition-colors ${
            author.username ? 'link-underline group-hover:text-accent' : ''
          }`}
        >
          {author.name}
        </span>
      </div>
      {author.bio && (
        <p className="mt-3 text-center text-sm leading-relaxed text-text-secondary">
          {author.bio}
        </p>
      )}
    </>
  );
  if (!author.username) {
    return <div className={cardClass}>{inner}</div>;
  }
  return (
    <Link
      to={`/writers/${author.username}`}
      className={`${cardClass} group transition-transform duration-200 hover:-translate-y-0.5`}
    >
      {inner}
    </Link>
  );
}

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  
  const [coverImgError, setCoverImgError] = useState(false);

  // 1. Data Fetching Queries
  const { data: article, isLoading: loading } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => getArticleBySlug(slug!),
    enabled: Boolean(slug),
  });

  const { data: related = [] } = useQuery({
    queryKey: ['articles', 'related', article?.id],
    queryFn: () => getRelatedArticles(article!, 3),
    enabled: Boolean(article),
  });

  const { data: liked = false } = useQuery({
    queryKey: ['liked', article?.id, user?.id],
    queryFn: () => isLiked(article!.id, user!.id),
    enabled: Boolean(article) && Boolean(user),
  });

  useEffect(() => {
    setCoverImgError(false);
  }, [slug]);

  // 3. Memoized Headings (MUST be before conditional returns)
  const headings = useMemo(
    () => extractHeadings(article?.content ?? ''),
    [article?.content]
  );

  // Helper to bypass React Router hijacking anchor links on the mobile TOC
  const handleMobileTocClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.pushState(null, '', `#${id}`);
    }
  };

  // --- Conditional Returns (Early Exits) ---
  if (loading) {
    return (
      <>
        <ArticleProgress />
        <ArticlePageSkeleton />
      </>
    );
  }

  if (!article) {
    return (
      <div className="max-w-article mx-auto px-4 sm:px-6 py-20 text-center">
        <AlertCircle size={32} className="mx-auto text-text-muted mb-4" />
        <h1 className="font-serif text-2xl text-text-primary mb-2">
          Something went wrong while loading this article.
        </h1>
        <p className="text-text-muted mb-6">The article may have been moved or deleted.</p>
        <Link
          to="/articles"
          className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover transition-colors"
        >
          <ArrowLeft size={16} />
          Back to articles
        </Link>
      </div>
    );
  }

  // --- Safe to use `article` here, it is guaranteed to be non-null ---
  const coverFallback = getFallbackImage(article.id);
  const coverSrc = coverImgError || !article.coverImage ? coverFallback : article.coverImage;
  const articleUrl = window.location.href;

  return (
    <>
      <ArticleProgress />

      <article className="max-w-content mx-auto px-4 sm:px-6 pt-6 md:pt-10">
        {/* Header */}
        <header className="mb-6">
          {article.publication && (
            <div className="mb-3 flex justify-center">
              <Link
                to={`/p/${article.publication.slug}`}
                className="font-mono text-xs uppercase tracking-wider text-text-muted transition-colors hover:text-accent"
              >
                {article.publication.name}
              </Link>
            </div>
          )}
          <h1 className="font-serif text-3xl md:text-5xl font-medium text-text-primary text-center leading-[1.1] tracking-tight text-balance mb-3">
            {article.title}
          </h1>

          <div className="flex items-center justify-center gap-2 text-xs text-text-muted font-mono">
            <span>
              <Badge variant="accent">{article.category}</Badge>
            </span>
            <span>•</span>
            {formatDateLong(article.publishedAt ?? article.createdAt)}
            <span>•</span>
            <span>{article.readingTime} min read</span>
          </div>
        </header>

        {/* Cover Image */}
        <div className="relative aspect-video overflow-hidden rounded-card border border-border-subtle mb-6 bg-elevated">
          <img
            src={coverSrc}
            alt=""
            onError={() => setCoverImgError(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </article>

      {/* Content + TOC */}
      <div className="max-w-content mx-auto px-4 sm:px-6 mt-10 grid grid-cols-1 gap-8 lg:mt-12 lg:grid-cols-[1fr_220px] lg:gap-12">
        <div className="max-w-article lg:col-start-1 lg:row-start-1 lg:max-w-none">
          {headings.length >= 3 && (
            <details className="mb-8 rounded-card border border-border-subtle bg-surface lg:hidden">
              <summary className="cursor-pointer list-none px-4 py-3 font-mono text-xs uppercase tracking-wider text-text-muted">
                On this page
              </summary>
              <ul className="space-y-1 border-t border-border-subtle px-4 py-3">
                {headings.map((h) => (
                  <li key={h.id}>
                    <a
                      href={`#${h.id}`}
                      onClick={(e) => handleMobileTocClick(e, h.id)}
                      className={`block py-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary ${h.level === 3 ? 'pl-4' : ''}`}
                    >
                      {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          )}
          <ArticleContent content={article.content} />

          {/* Author card — visible on mobile, hidden here on desktop (it moves to sidebar) */}
          <div className="mt-10 lg:hidden">
            <AuthorCard author={article.author} />
          </div>

          <div className="mt-10 flex items-center gap-3 border-t border-border-subtle pt-8">
            <LikeButton articleId={article.id} initialLikes={article.likes} initiallyLiked={liked} />
            <ShareButton url={articleUrl} title={article.title} />
          </div>

          <CommentSection articleId={article.id} />
          <RelatedArticles articles={related} />
        </div>

        {/* Desktop sidebar: author + sticky TOC */}
        <div className="hidden lg:col-start-2 lg:row-start-1 lg:block">
          <div className="mb-8">
            <AuthorCard author={article.author} />
          </div>
          <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <TableOfContents headings={headings} />
          </div>
        </div>
      </div>

      <div className="max-w-article mx-auto px-4 sm:px-6 mt-16 pb-8">
        <Link
          to="/articles"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          All articles
        </Link>
      </div>
    </>
  );
}