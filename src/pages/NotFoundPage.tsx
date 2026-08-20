import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/layout/Navbar';

export function NotFoundPage() {
  return (
    <PageContainer className="py-24 text-center">
      <p className="font-mono text-sm uppercase tracking-[0.25em] text-text-muted mb-4">404</p>
      <h1 className="font-serif text-4xl md:text-5xl font-medium text-text-primary mb-4 tracking-tight">
        Page not found<span className="text-accent">.</span>
      </h1>
      <p className="text-text-secondary mb-8 max-w-md mx-auto">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover transition-colors"
      >
        <ArrowLeft size={16} />
        Back to home
      </Link>
    </PageContainer>
  );
}