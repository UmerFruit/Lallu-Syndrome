import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { PageContainer } from '@/components/layout/Navbar';
import { siteConfig } from '@/config/site';

export function CreatorPage() {

  const { creator } = siteConfig;

  return (
    <div className="grain">
      <PageContainer className="py-12 md:py-20">
        <div className="relative mx-auto max-w-2xl">
          {/* Top label */}
          <p
            className="anim-fade-up text-center font-mono text-xl uppercase tracking-[0.25em] text-text-muted"
            style={{ animationDelay: '0.05s' }}
          >
            The creator
          </p>

          {/* Avatar */}
          <div
            className="anim-fade-up mt-10 flex justify-center"
            style={{ animationDelay: '0.25s' }}
          >
            <div className="avatar-ring relative inline-block rounded-full">
              <img
                src={creator.avatarUrl}
                alt={creator.name}
                className="avatar-hover h-44 w-44 rounded-full border-4 border-bg object-cover md:h-52 md:w-52"
              />
            </div>
          </div>

          {/* Name */}
          <h1
            className="anim-wipe mt-10 text-center font-serif text-4xl leading-tight text-text-primary md:text-6xl"
            style={{ animationDelay: '0.5s' }}
          >
            {creator.name}
           
          </h1>

          {/* Bio */}
          <p
            className="anim-fade-up mx-auto mt-8 max-w-md text-center text-base leading-relaxed text-text-secondary md:text-lg"
          >
            A generalist and a computer enthusiast. A quiet corner of the internet
            for technical writing and long-running experiments. Hopefully, this will be a place to share ideas and learn from others.
          </p>

          {/* Links */}
          <div
            className="anim-fade-up mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
            style={{ animationDelay: '1.05s' }}
          >
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
          </div>

          {/* Divider */}
          <div
            className="anim-fade-up my-14 md:my-20 flex items-center gap-4"
            style={{ animationDelay: '1.25s' }}
          >
            <span className="h-px flex-1 bg-border-subtle" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted">
              Topics
            </span>
            <span className="h-px flex-1 bg-border-subtle" />
          </div>

          {/* Statement */}
          <div className="anim-fade-up mt-14 md:mt-20 text-center"  style={{ animationDelay: '1.55s' }}>
            <p className="font-serif text-xl leading-relaxed  text-text-primary md:text-2xl">
              I build in public<span className="text-accent">.</span>
            </p>
            <p className="mt-4 text-sm leading-relaxed text-text-secondary ">
              Lallu Syndrome is my personal diary as much as it is a publication.
              It is a personal project, not affiliated with any company or organization.
              Hope you like it and contribute to it in any way you can. I am always open to feedback and suggestions.
            </p>
            <Link
              to="/about"
              className="link-underline mt-6 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
            >
              About the publication
              <ArrowRight size={13} className="anim-arrow" />
            </Link>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}