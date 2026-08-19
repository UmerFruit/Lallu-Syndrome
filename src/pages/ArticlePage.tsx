import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [liked, setLiked] = useState(false);

  // Scroll-triggered animation state for the author card
  const authorCardRef = useRef<HTMLDivElement>(null);
  const [isAuthorCardVisible, setIsAuthorCardVisible] = useState(false);

  useEffect(() => {
    async function loadArticle() {
      if (!slug) return;
      try {
        setLoading(true);
        setError(false);
        setArticle(null);
        setRelated([]);
        setLiked(false);

        const articleData = await getArticleBySlug(slug);

        if (!articleData) {
          setError(true);
          return;
        }

        setArticle(articleData);

        const [relatedData, likedData] = await Promise.all([
          getRelatedArticles(articleData, 3),
          isLiked(articleData.id),
        ]);

        setRelated(relatedData);
        setLiked(likedData);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadArticle();
  }, [slug]);


  useEffect(() => {
    const handleScroll = () => {
      const card = authorCardRef.current;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight * 0.9;

      if (isVisible && !isAuthorCardVisible) {
        setIsAuthorCardVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check on mount

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAuthorCardVisible]);
  if (loading) {
    return (
      <>
        <ArticleProgress />
        <ArticlePageSkeleton />
      </>
    );
  }

  if (error || !article) {
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

  const headings = extractHeadings(article.content);
  const articleUrl = window.location.href;

  return (
    <>
      <ArticleProgress />

      <article id="article-content" className="max-w-content mx-auto px-4 sm:px-6 pt-6 md:pt-6">
        {/* Header */}
        <header className="mb-6">
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
            src={article.coverImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </article>

      {/* Content + TOC */}
      <div className="max-w-content mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-8 lg:gap-12 mt-12">
        <div className="max-w-article lg:max-w-none lg:col-start-1 lg:row-start-1">
          <ArticleContent content={article.content} />

          {/* Interactions */}
          <div className="flex items-center gap-3 mt-12 pt-8 border-t border-border-subtle">
            <LikeButton
              articleId={article.id}
              initialLikes={article.likes}
              initiallyLiked={liked}
            />
            <ShareButton url={articleUrl} title={article.title} />
          </div>

          {/* Comments */}
          <CommentSection articleId={article.id} />

          {/* Related */}
          <RelatedArticles articles={related} />
        </div>

        {/* TOC Sidebar */}
        <div className="hidden lg:block lg:col-start-2 lg:row-start-1">
          <div className="mb-8 rounded-card border border-border-subtle border-l-2 border-l-accent bg-surface p-5">
            <div className="flex flex-col items-center gap-3">
              {article.author.avatar && (
                <img
                  src={article.author.avatar}
                  alt={article.author.name}
                  className="h-30 w-30 shrink-0 rounded-full border border-border-subtle bg-elevated object-cover"
                />
              )}
              {'username' in article.author && article.author.username ? (
                <Link
                  to={`/writers/${article.author.username}`}
                  className="link-underline text-center text-sm font-medium text-text-primary transition-colors hover:text-accent"
                >
                  {article.author.name}
                </Link>
              ) : (
                <span className="text-center text-sm font-medium text-text-primary">
                  {article.author.name}
                </span>
              )}
            </div>

            {article.author.bio && (
              <p className="mt-3 text-center text-sm leading-relaxed text-text-secondary">
                {article.author.bio}
              </p>
            )}
          </div>

          {/* Table of Contents — stays sticky */}
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