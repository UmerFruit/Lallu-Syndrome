type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: Readonly<SkeletonProps>) {
  return (
    <div className={`animate-pulse bg-elevated rounded ${className ?? ''}`} />
  );
}

export function ArticleCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="w-full aspect-[16/9]" />
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function PageSpinner() {
  return (<div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
  </div>);
}

export function FeaturedArticleSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
      <Skeleton className="w-full aspect-[16/10] rounded-card" />
      <div className="space-y-4">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export function ArticlePageSkeleton() {
  return (
    <div className="max-w-article mx-auto px-4 sm:px-6">
      <div className="space-y-4 pt-8">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="w-full aspect-[16/9] mt-8 rounded-card" />
      <div className="space-y-3 mt-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}
