// src/pages/LandingPage.tsx  (full replacement)
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  FlaskConical,
  HeartHandshake,
  PenLine,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/Navbar';
import { getCategories } from '@/services/categoryService';
import { getLatestArticles } from '@/services/articleService';
import { ArticleGrid } from '@/components/articles/ArticleCard';
import { ArticleCardSkeleton } from '@/components/ui/Skeleton';

const highlights = [
  {
    icon: PenLine,
    title: 'Honest notes',
    body: 'Things I learn, written down while they are still fresh, mistakes, fixes, and all.',
  },
  {
    icon: FlaskConical,
    title: 'Experiments',
    body: 'Side projects, code tinkering, and rabbit holes that turned out to be worth sharing.',
  },
  {
    icon: HeartHandshake,
    title: 'Shared freely',
    body: 'Take whatever is useful, leave a comment if you like. Everything here is open.',
  },
];

function Divider({ label }: Readonly<{ label: string }>) {
  return (
    <div className="my-14 flex items-center gap-4 md:my-20">
      <span className="h-px flex-1 bg-border-subtle" />
      <span className="font-mono text-sm uppercase tracking-[0.3em] text-text-muted">
        {label}
      </span>
      <span className="h-px flex-1 bg-border-subtle" />
    </div>
  );
}

export function LandingPage() {
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { data: latest = [], isLoading: loadingLatest } = useQuery({
    queryKey: ['articles', 'latest'],
    queryFn: () => getLatestArticles(3),
  });

  const marqueeItems = [...categories, ...categories];

  return (
    <div className="grain">
      <PageContainer className="py-12 md:py-16">
        {/* ══ Hero ══════════════════════════════════════════════ */}
        <div className="relative mx-auto max-w-2xl">
          <p
            className="anim-fade-up text-center font-mono text-xl uppercase tracking-[0.25em] text-text-muted"
            style={{ animationDelay: '0.05s' }}
          >
            Welcome to
          </p>

          <h1
            className="anim-wipe mt-10 text-center font-serif text-4xl leading-tight text-text-primary md:text-6xl"
            style={{ animationDelay: '0.3s' }}
          >
            Lallu Syndrome<span className="text-accent">.</span>
          </h1>

          <p
            className="anim-fade-up mx-auto mt-8 max-w-md text-center text-base leading-relaxed text-text-secondary md:text-lg"
            style={{ animationDelay: '0.65s' }}
          >
            A cozy corner of the internet for notes, experiments, and deep
            dives into technology, written in public, shared for free. Anyone can publish, just create an account
          </p>

          {/* CTAs */}
          <div
            className="anim-fade-up mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
            style={{ animationDelay: '0.85s' }}
          >
            <Link
              to="/articles"
              className="inline-flex items-center gap-1.5 rounded bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Start reading
              <ArrowRight size={14} />
            </Link>
            <Link
              to="/about"
              className="link-underline inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
            >
              What's this place?
              <ArrowRight size={13} className="anim-arrow" />
            </Link>
          </div>

          {/* ══ What you'll find here ═════════════════════════════ */}
          <div
            className="anim-fade-up mt-16 rounded-card border border-border-subtle bg-surface p-6 md:p-8"
            style={{ animationDelay: '1.05s' }}
          >
            <p className="mt-4 font-serif text-xl leading-relaxed text-text-primary md:text-2xl">
              Document your learning. Share your ideas. Enjoy the ride.
            </p>
            <div className="mt-6 space-y-5">
              {highlights.map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex gap-4">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-bg text-accent">
                    <Icon size={15} />
                  </span>
                  <div>
                    <h2 className="text-sm font-medium text-text-primary">
                      {title}
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ══ Topics marquee ════════════════════════════════════ */}
          {categories.length > 0 && (
            <>
              <Divider label="What I write about" />
              <div className="marquee-mask overflow-hidden">
                <div className="anim-marquee flex w-max gap-12 whitespace-nowrap py-2">
                  {marqueeItems.map((cat, i) => (
                    <span
                      key={`${cat.slug}-${i}`}
                      className="font-serif text-2xl text-text-primary md:text-3xl"
                    >
                      {cat.name}
                      <span className="mx-12 text-text-muted">/</span>
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ══ Latest writing (full content width) ═══════════════ */}
        <Divider label="Latest writing" />
        {loadingLatest ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <ArticleCardSkeleton key={i} />
            ))}
          </div>
        ) : latest.length === 0 ? (
          <p className="py-12 text-center text-text-muted">
            Nothing published yet. Check back soon.
          </p>
        ) : (
          <ArticleGrid articles={latest} />
        )}
        <div className="mt-10 text-center">
          <Link
            to="/articles"
            className="link-underline inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
          >
            Browse all articles
            <ArrowRight size={13} className="anim-arrow" />
          </Link>
        </div>

        {/* ══ Warm sign-off ═════════════════════════════════════ */}
        <p className="mt-16 text-center font-mono text-sm uppercase tracking-[0.2em] text-text-muted">
          Thanks for stopping by. Grab something warm to drink and enjoy your stay
        </p>
      </PageContainer>
    </div>
  );
}