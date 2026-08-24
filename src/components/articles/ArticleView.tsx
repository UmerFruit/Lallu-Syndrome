import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Article } from '@/types';
import { formatDateLong } from '@/utils/date';
import { ArticleContent } from '@/components/articles/ArticleContent';
import { TableOfContents, extractHeadings } from '@/components/articles/TableOfContents';
import { RelatedArticles } from '@/components/articles/RelatedArticles';
import { LikeButton } from '@/components/interactions/LikeButton';
import { ShareButton } from '@/components/interactions/ShareButton';
import { CommentSection } from '@/components/interactions/CommentSection';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { ArrowLeft, Link as LinkIcon } from 'lucide-react';
import { getFallbackImage } from '@/utils/image';

function AuthorCard({ author }: Readonly<{ author: Article['author'] }>) {
  const cardClass =
    'block rounded-card border border-border-subtle border-l-2 border-l-accent bg-surface p-5';
  const inner = (
    <>
      <div className="flex flex-col items-center gap-3">
        <Avatar
          src={author.avatar ?? undefined}
          name={author.name}
          className="w-48  h-64 border border-border-subtle bg-elevated"
          fallbackClassName="text-xs font-semibold text-text-primary"
        />
        <span
          className={`text-center text-sm font-medium text-text-primary transition-colors ${author.username ? 'link-underline group-hover:text-accent' : ''
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
      aria-label={`View profile of ${author.name}`}
    >
      {inner}
    </Link>
  );
}

export interface ArticleViewProps {
  article: Article;
  related?: Article[];
  liked?: boolean;
  showInteractions?: boolean;
  showRelated?: boolean;
  showBackLink?: boolean;
}

export function ArticleView({
  article,
  related = [],
  liked = false,
  showInteractions = true,
  showRelated = true,
  showBackLink = true
}: Readonly<ArticleViewProps>) {
  const [coverImgError, setCoverImgError] = useState(false);

  // Reset error state when article changes
  useEffect(() => {
    setCoverImgError(false);
  }, [article.id]);

  const headings = useMemo(
    () => extractHeadings(article?.content ?? ''),
    [article?.content]
  );

  const handleMobileTocClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.pushState(null, '', `#${id}`);
    }
  };

  const coverFallback = getFallbackImage(article.id);
  const coverSrc = coverImgError || !article.coverImage ? coverFallback : article.coverImage;
  const articleUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <>
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
                <LinkIcon size={12} className="ml-1 inline-block" />
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
        <div className="relative mx-8 aspect-video overflow-hidden rounded-card border border-border-subtle mb-20 bg-elevated">
          <img
            src={coverSrc}
            alt=""
            onError={() => setCoverImgError(true)}
            className="absolute h-full w-full object-cover"
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

          <div className="mt-10 lg:hidden">
            <AuthorCard author={article.author} />
          </div>

          {showInteractions && (
            <div className="mt-10 flex items-center gap-3 border-t border-border-subtle pt-8">
              <LikeButton articleId={article.id} initialLikes={article.likes} initiallyLiked={liked} />
              <ShareButton url={articleUrl} title={article.title} />
            </div>
          )}

          {showInteractions && <CommentSection articleId={article.id} />}
          {showRelated && <RelatedArticles articles={related} />}
        </div>

        <div className="hidden lg:col-start-2 lg:row-start-1 lg:block">
          <div className="mb-8">
            <AuthorCard author={article.author} />
          </div>
          <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <TableOfContents headings={headings} />
          </div>
        </div>
      </div>

      {showBackLink && (
        <div className="max-w-article mx-auto px-4 sm:px-6 mt-16 pb-8">
          <Link
            to="/articles"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={16} />
            All articles
          </Link>
        </div>
      )}
    </>
  );
}