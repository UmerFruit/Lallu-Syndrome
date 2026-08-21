import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PageContainer } from '@/components/layout/Navbar';
import { getCategories } from '@/services/categoryService';
import type { Category } from '@/types';

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
    body: "Their progress doesn't add to you. Their failure doesn't excuse you. In the end, it's just you."
  },
];

export function AboutPage() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const marqueeItems = [...categories, ...categories];

  return (
    <div className="grain">
      <PageContainer className="py-12 md:py-16">
        <div className="relative mx-auto max-w-2xl">
          {/* Eyebrow */}
          <p
            className="anim-fade-up text-center font-mono text-xl uppercase tracking-[0.25em] text-text-muted"
            style={{ animationDelay: '0.05s' }}
          >
            The publication
          </p>

          {/* Title */}
          <h1
            className="anim-wipe mt-10 text-center font-serif text-4xl leading-tight text-text-primary md:text-6xl"
            style={{ animationDelay: '0.3s' }}
          >
            Lallu Syndrome<span className="text-accent">.</span>
          </h1>

          {/* Lead */}
          <p
            className="anim-fade-up mx-auto mt-8 max-w-md text-center text-base leading-relaxed text-text-secondary md:text-lg"
            style={{ animationDelay: '0.65s' }}
          >
            Everything here is a lesson, even when I'm the only one who learns it.
          </p>

          {/* Quick links */}
          <div
            className="anim-fade-up mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
            style={{ animationDelay: '0.85s' }}
          >
            <Link
              to="/articles"
              className="link-underline inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
            >
              Browse the writing
              <ArrowRight size={13} className="anim-arrow" />
            </Link>
            <Link
              to="/creator"
              className="link-underline inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
            >
              Meet the creator
              <ArrowRight size={13} className="anim-arrow" />
            </Link>
          </div>

          {/* Mission */}
          <div
            className="anim-fade-up my-14 md:my-20 flex items-center gap-4"
            style={{ animationDelay: '1.05s' }}
          >
            <span className="h-px flex-1 bg-border-subtle" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted">
              Mission
            </span>
            <span className="h-px flex-1 bg-border-subtle" />
          </div>

          <div className="anim-fade-up space-y-5" style={{ animationDelay: '1.2s' }}>
            <p className="font-serif text-xl leading-relaxed text-text-primary md:text-2xl">
              Never settle for anything less than your very best.
            </p>
            <p className="text-sm leading-relaxed text-text-secondary text-justify">
              Lallu: someone aimless, directionless, content with just getting by.
              <br />
              Lallu Syndrome is when settling stops feeling like settling and your standards quietly erode. Your 90% becomes 70%, then 60%. You stop caring enough to notice. I felt that way and by the time I realized, it was too late. This blog is me giving it my all, not because I want to recover what I had, but to become what I hadn't yet imagined.
              <br />
              <b>Because comfort kills more potential than failure ever could.</b>
            </p>
          </div>

          {/* Topics */}
          <div
            className="anim-fade-up my-14 md:my-20 flex items-center gap-4"
            style={{ animationDelay: '1.35s' }}
          >
            <span className="h-px flex-1 bg-border-subtle" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted">
              Topics
            </span>
            <span className="h-px flex-1 bg-border-subtle" />
          </div>

          {categories.length > 0 && (
            <div
              className="anim-fade-up marquee-mask overflow-hidden"
              style={{ animationDelay: '1.5s' }}
            >
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
          )}

          {/* Principles */}
          <div
            className="anim-fade-up my-14 md:my-20 flex items-center gap-4"
            style={{ animationDelay: '1.65s' }}
          >
            <span className="h-px flex-1 bg-border-subtle" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted">
              Principles
            </span>
            <span className="h-px flex-1 bg-border-subtle" />
          </div>

          <div className="space-y-10">
            {principles.map((principle, index) => (
              <div
                key={principle.id}
                className="anim-fade-up flex gap-6"
                style={{ animationDelay: `${1.8 + index * 0.15}s` }}
              >
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

          {/* Independence note */}
          <p
            className="anim-fade-up mt-16 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-text-muted"
            style={{ animationDelay: '2.3s' }}
          >
            A personal project · Not affiliated with any company or organization
          </p>
        </div>
      </PageContainer>
    </div>
  );
}