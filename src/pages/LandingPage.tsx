// src/pages/LandingPage.tsx
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { PageContainer } from '@/components/layout/Navbar';
import { getCategories } from '@/services/categoryService';
import { getLatestArticles } from '@/services/articleService';
import { ArticleGrid } from '@/components/articles/ArticleCard';
import { ArticleCardSkeleton } from '@/components/ui/Skeleton';
import { siteConfig } from '@/config/site';

const principles = [
  {
    id: '01',
    title: 'Refuse the comfort of half-measures',
    body: 'Half-hearted effort is just an apology written in advance for a failure you chose not to prevent.',
  },
  {
    id: '02',
    title: 'Premature confidence is the root of all evil',
    body: 'The moment you think you have it all figured out is the moment you will start sliding backwards.',
  },
  {
    id: '03',
    title: 'Stay independent',
    body: "Their progress doesn't add to you. Their failure doesn't excuse you. In the end, it's just you.",
  },
];

function Divider({ label }: Readonly<{ label: string }>) {
  return (
    <div className="my-14 flex items-center gap-4 md:my-20">
      <span className="h-px flex-1 bg-border-subtle" />
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted">
        {label}
      </span>
      <span className="h-px flex-1 bg-border-subtle" />
    </div>
  );
}

export function LandingPage() {
  const { creator } = siteConfig;

  // Shares the cache with AboutPage / ArticlesPage (same key)
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
            The publication
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
            Notes, experiments, and deep dives into technology. Everything here
            is a lesson, even when I&apos;m the only one who learns it.
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
              Read the articles
              <ArrowRight size={14} />
            </Link>
            <Link
              to="/about"
              className="link-underline inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
            >
              The full story
              <ArrowRight size={13} className="anim-arrow" />
            </Link>
          </div>

          {/* ══ The name — instant context ════════════════════════ */}
          <div
            className="anim-fade-up mt-16 rounded-card border border-border-subtle bg-surface p-6 md:p-8"
            style={{ animationDelay: '1.05s' }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted">
              The name
            </p>
            <p className="mt-4 font-serif text-xl leading-relaxed text-text-primary md:text-2xl">
              Never settle for anything less than your very best.
            </p>
            <p className="mt-4 text-justify text-sm leading-relaxed text-text-secondary">
              <span className="font-medium text-text-primary">Lallu</span>:
              someone aimless, directionless, content with just getting by.
              Lallu Syndrome is when settling stops feeling like settling and
              your standards quietly erode. This publication is the antidote —
              writing everything down before comfort does the deciding.
            </p>
          </div>

          {/* ══ Principles ════════════════════════════════════════ */}
          <Divider label="Principles" />
          <div className="space-y-10">
            {principles.map((principle) => (
              <div key={principle.id} className="flex gap-6">
                <span className="font-mono text-sm text-accent">{principle.id}</span>
                <div>
                  <h2 className="font-serif text-lg font-medium text-text-primary">
                    {principle.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {principle.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* ══ Topics marquee ════════════════════════════════════ */}
          {categories.length > 0 && (
            <>
              <Divider label="Topics" />
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

          {/* ══ Creator strip ═════════════════════════════════════ */}
          <Divider label="The creator" />
          <div className="text-center">
            <div className="avatar-ring relative mx-auto inline-block rounded-full">
              <img
                src={creator.avatarUrl}
                alt={creator.name}
                className="avatar-hover h-28 w-28 rounded-full border-4 border-bg object-cover md:h-32 md:w-32"
              />
            </div>
            <p className="mt-6 font-serif text-xl text-text-primary">{creator.name}</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-text-secondary">
              A generalist and a computer enthusiast. I build in public — this
              is my personal diary as much as it is a publication.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {creator.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
                >
                  {link.label}
                  <ArrowUpRight size={13} className="anim-arrow" />
                </a>
              ))}
              <Link
                to="/creator"
                className="link-underline inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
              >
                More about me
                <ArrowRight size={13} className="anim-arrow" />
              </Link>
            </div>
          </div>
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
      </PageContainer>
    </div>
  );
}
