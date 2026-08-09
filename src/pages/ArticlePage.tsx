import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(false);
    setArticle(null);

    getArticleBySlug(slug).then(async (a) => {
      if (!a) {
        setError(true);
        setLoading(false);
        return;
      }
      setArticle(a);
      const [rel, isL] = await Promise.all([
        getRelatedArticles(a, 3),
        isLiked(a.id),
      ]);
      setRelated(rel);
      setLiked(isL);
      setLoading(false);
      window.scrollTo(0, 0);
    });
  }, [slug]);

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

      <article id="article-content" className="max-w-article mx-auto px-4 sm:px-6 pt-8 md:pt-12">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="accent">{article.category}</Badge>
            <span className="font-mono text-xs text-text-muted">{article.readingTime} min read</span>
          </div>

          <h1 className="font-serif text-3xl md:text-5xl font-medium text-text-primary leading-[1.1] tracking-tight text-balance mb-4">
            {article.title}
          </h1>

          <p className="text-lg text-text-secondary leading-relaxed text-pretty mb-6">
            {article.excerpt}
          </p>

          <div className="flex items-center gap-3">
            {article.author.avatar ? (
              <img
                src={article.author.avatar}
                alt={article.author.name}
                className="w-9 h-9 rounded-full"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-elevated flex items-center justify-center text-sm font-medium text-text-secondary">
                {article.author.name.charAt(0)}
              </div>
            )}
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-text-primary">{article.author.name}</span>
              <span className="font-mono text-xs text-text-muted">
                {formatDateLong(article.publishedAt)}
              </span>
            </div>
          </div>
        </header>

        {/* Cover Image */}
        <div className="overflow-hidden rounded-card border border-border-subtle mb-10">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-auto"
          />
        </div>
      </article>

      {/* Content + TOC */}
      <div className="max-w-content mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-8 lg:gap-12">
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

        {/* TOC */}
        <div className="hidden lg:block lg:col-start-2 lg:row-start-1">
          <TableOfContents headings={headings} />
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
