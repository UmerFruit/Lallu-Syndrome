import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageContainer } from '@/components/layout/Navbar';

type AuthLayoutProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthLayout({ title, subtitle, children, footer }: Readonly<AuthLayoutProps>) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12">
      <PageContainer className="w-full max-w-md">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="font-serif text-2xl font-semibold text-text-primary tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-sm text-text-secondary">{subtitle}</p>
            )}
          </div>

          <div className="rounded-card border border-border bg-surface p-6 sm:p-8">
            {children}
          </div>

          {footer && (
            <div className="text-center text-sm text-text-secondary">
              {footer}
            </div>
          )}
        </div>
      </PageContainer>
    </div>
  );
}

export function AuthLink({ to, children }: Readonly<{ to: string; children: ReactNode }>) {
  return (
    <Link to={to} className="text-accent hover:text-accent-hover transition-colors font-medium">
      {children}
    </Link>
  );
}
