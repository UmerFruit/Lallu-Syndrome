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
        window.scrollTo(0, 30);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadArticle();
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

      <article id="article-content" className="max-w-content mx-auto px-4 sm:px-6 pt-8 md:pt-12">
        {/* Header */}


        <header className="mb-8">
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
        <div className="overflow-hidden rounded-card border border-border-subtle mb-10">
          <img
            src={article.coverImage}
            alt=""
            className="w-full h-auto"
          />
        </div>
      </article>

      {/* Content + TOC */}
      < div className="max-w-content mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-8 lg:gap-12" >
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
          <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
            {/* Author Info */}
            <div className="text-center mb-6 pb-6 border-b border-border-subtle">
              {article.author.avatar && (
                <img
                  src={article.author.avatar}
                  alt={article.author.name}
                  className="w-14 h-14 rounded-full border-2 border-border bg-elevated mx-auto mb-2.5"
                />
              )}

              <h3 className="text-sm font-semibold text-text-primary mb-1">
                {article.author.name}
              </h3>

              <div className="flex items-center justify-center gap-1.5 text-xs text-text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <span>{article.author.bio ?? "Writing about Linux & open source"}</span>
              </div>
            </div>

            {/* Table of Contents */}
            <TableOfContents headings={headings} />
          </div>
        </div>
      </div >

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
