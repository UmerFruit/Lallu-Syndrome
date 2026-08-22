import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getArticleBySlug, getRelatedArticles, isLiked } from '@/services/articleService';
import { ArticleProgress } from '@/components/articles/ArticleProgress';
import { ArticlePageSkeleton } from '@/components/ui/Skeleton';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ArticleView } from '@/components/articles/ArticleView';

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();

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

  return (
    <>
      <ArticleProgress />
      <ArticleView 
        article={article} 
        related={related} 
        liked={liked} 
      />
    </>
  );
}