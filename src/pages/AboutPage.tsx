import { PageContainer } from '@/components/layout/Navbar';
import { ArrowUpRight } from 'lucide-react';
import { getCategories } from '@/services/categoryService';
import { useEffect, useState } from 'react';
import type { Category } from '@/types';

const PORTFOLIO_URL = 'https://umerfruit.dev';
const GITHUB_URL = 'https://github.com/UmerFruit';
const LINKEDIN_URL = 'https://www.linkedin.com/in/umer-farooq-242130277/';
const Avatar_Photo =
  'https://pvbcyuflhlucnmcnlgfh.supabase.co/storage/v1/object/public/avatars/d30e44ea-4558-40d6-a3ef-b05ead808f06/avatar.png';

const externalLinks = [
  { label: 'Portfolio', href: PORTFOLIO_URL },
  { label: 'GitHub', href: GITHUB_URL },
  { label: 'LinkedIn', href: LINKEDIN_URL },
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
      <PageContainer className="py-16 md:py-24">
        <div className="relative mx-auto max-w-2xl">
          {/* Top label */}
          <p
            className="anim-fade-up text-center font-mono text-xl uppercase tracking-[0.25em] text-text-muted"
            style={{ animationDelay: '0.05s' }}
          >
            About me
          </p>

          {/* Avatar */}
          <div
            className="anim-fade-up mt-10 flex justify-center"
            style={{ animationDelay: '0.25s' }}
          >
            <div className="avatar-ring relative inline-block rounded-full anim-breathe">
              <img
                src={Avatar_Photo}
                alt="Umer Farooq"
                className="avatar-hover h-44 w-44 rounded-full border-4 border-bg object-cover md:h-52 md:w-52"
              />
            </div>
          </div>

          {/* Title */}
          <h1
            className="anim-wipe mt-10 text-center font-serif text-4xl leading-tight text-text-primary md:text-6xl"
            style={{ animationDelay: '0.5s' }}
          >
            Umer Farooq
          </h1>

          {/* Bio */}
          <p
            className="anim-fade-up mx-auto mt-8 max-w-md text-center text-base leading-relaxed text-text-secondary md:text-lg"
            style={{ animationDelay: '0.85s' }}
          >
            A generalist and a computer enthusiast. Writing here to think out loud,
            document what I learn. A quiet corner of the internet for technical
            writing and long-running experiments.
          </p>

          {/* Links */}
          <div
            className="anim-fade-up mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
            style={{ animationDelay: '1.05s' }}
          >
            {externalLinks.map((link) => (
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
          </div>

          {/* Divider */}
          <div
            className="anim-fade-up my-20 flex items-center gap-4"
            style={{ animationDelay: '1.25s' }}
          >
            <span className="h-px flex-1 bg-border-subtle" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted">
              Topics
            </span>
            <span className="h-px flex-1 bg-border-subtle" />
          </div>

          {/* Infinite marquee */}
          {categories.length > 0 && (
            <div
              className="anim-fade-up marquee-mask overflow-hidden"
              style={{ animationDelay: '1.4s' }}
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

          {/* Publication statement */}
          <div
            className="anim-fade-up mt-20"
            style={{ animationDelay: '1.55s' }}
          >
            <p className="font-serif text-xl leading-relaxed text-text-primary md:text-2xl">
              Lallu Syndrome is a technology publication{' '}
              <span className="text-accent">.</span>
            </p>
            <p className="mt-4 text-sm leading-relaxed text-text-secondary">
              A place to share Lallu and fangirl about how amazing the things we
              use daily really are under the hood. This is a personal project and
              not affiliated with any company or organization.
            </p>
          </div>

          {/* Colophon */}
          <footer
            className="anim-fade-up mt-24 border-t border-border-subtle pt-6"
            style={{ animationDelay: '1.7s' }}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-text-muted">
              React · TypeScript · Tailwind · Supabase
            </p>
          </footer>
        </div>
      </PageContainer>
    </div>
  );
}