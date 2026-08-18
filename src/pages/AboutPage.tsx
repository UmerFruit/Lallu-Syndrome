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

// Animation keyframes injected once per page
const animationStyles = `
  /* 1. Fade up with stagger */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .anim-fade-up {
    opacity: 0;
    animation: fadeUp 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
  }

  /* 2. Blinking typewriter cursor */
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
  .anim-blink { animation: blink 1.1s steps(1) infinite; }

  /* 3. Rotating gradient border around the avatar */
  @keyframes rotateGradient {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  .avatar-ring::before {
    content: "";
    position: absolute;
    inset: -3px;
    border-radius: 9999px;
    background: conic-gradient(
      from 0deg,
      transparent 0deg,
      rgba(220, 38, 38, 0.9) 40deg,
      transparent 90deg,
      transparent 360deg
    );
    animation: rotateGradient 6s linear infinite;
    z-index: 0;
  }
  .avatar-ring > img { position: relative; z-index: 1; }

  /* 4. Subtle floating/breathing on the avatar */
  @keyframes breathe {
    0%, 100% { transform: translateY(0) scale(1); }
    50%      { transform: translateY(-4px) scale(1.01); }
  }
  .anim-breathe { animation: breathe 5s ease-in-out infinite; }

  /* 5. Infinite horizontal marquee */
  @keyframes marquee {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  .anim-marquee {
    animation: marquee 35s linear infinite;
  }
  .marquee-mask {
    mask-image: linear-gradient(
      to right,
      transparent 0,
      black 80px,
      black calc(100% - 80px),
      transparent 100%
    );
    -webkit-mask-image: linear-gradient(
      to right,
      transparent 0,
      black 80px,
      black calc(100% - 80px),
      transparent 100%
    );
  }

  /* 6. Animated underline on link hover */
  .link-underline {
    position: relative;
  }
  .link-underline::after {
    content: "";
    position: absolute;
    left: 0; bottom: -2px;
    height: 1px; width: 100%;
    background: currentColor;
    transform: scaleX(0);
    transform-origin: right center;
    transition: transform 450ms cubic-bezier(0.7, 0, 0.2, 1);
  }
  .link-underline:hover::after {
    transform: scaleX(1);
    transform-origin: left center;
  }

  /* 7. Title reveal (clip-path wipe) */
  @keyframes wipe {
    from { clip-path: inset(0 100% 0 0); }
    to   { clip-path: inset(0 0 0 0); }
  }
  .anim-wipe {
    animation: wipe 1.2s cubic-bezier(0.7, 0, 0.2, 1) forwards;
  }

  /* 8. Subtle grain overlay */
  .grain::after {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    opacity: 0.035;
    z-index: 1;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  }

  /* 9. Arrow nudge on link hover */
  .anim-arrow { transition: transform 350ms ease; }
  .link-underline:hover .anim-arrow { transform: translate(2px, -2px); }

  /* 10. Scale + glow on avatar hover */
  .avatar-hover {
    transition: transform 500ms cubic-bezier(0.2, 0.7, 0.2, 1),
                box-shadow 500ms ease;
  }
  .avatar-hover:hover {
    transform: scale(1.03);
    box-shadow: 0 0 0 1px rgba(220, 38, 38, 0.4),
                0 20px 40px -10px rgba(220, 38, 38, 0.15);
  }
`;

export function AboutPage() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  // Duplicate categories for seamless marquee loop
  const marqueeItems = [...categories, ...categories];

  return (
    <>
      <style>{animationStyles}</style>

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

            {/* Avatar — bigger, animated ring, floating, hover effect */}
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

            {/* Title with wipe-in and blinking cursor */}
            <h1
              className="anim-wipe mt-10 text-center font-serif text-4xl leading-tight text-text-primary md:text-6xl"
              style={{ animationDelay: '0.5s' }}
            >
              Umer Farooq
              {" "}
            </h1>

            {/* Bio */}
            <p
              className="anim-fade-up mx-auto mt-8 max-w-md text-center text-base leading-relaxed text-text-secondary md:text-lg"
              style={{ animationDelay: '0.85s' }}
            >
              A generalist and a computer enthusiast. Writing here to think out loud, document what I learn. A quiet corner of the internet for technical writing and long-running experiments.
            </p>

            {/* Links with sliding underline + arrow nudge */}
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

            {/* Infinite marquee of categories */}
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
                Lallu Syndrome is a technology publication
                {" "}
                <span className="text-accent">.</span>
              </p>
              <p className="mt-4 text-sm leading-relaxed text-text-secondary">
                A place to share Lallu and fangirl about how amazing the things we use daily really are under the hood. This is a personal project and not affiliated with any company or organization.
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
    </>
  );
}