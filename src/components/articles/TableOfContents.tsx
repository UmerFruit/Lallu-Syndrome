import { useEffect, useState } from 'react';
import { slugify } from '@/utils/slugify';

type Heading = {
  id: string;
  text: string;
  level: number;
};

export function extractHeadings(html: string): Heading[] {
  const document = new DOMParser().parseFromString(html, 'text/html');

  const headings = Array.from(
    document.querySelectorAll('h1, h2, h3')
  );

  return headings.map((heading) => {
    const text = heading.textContent?.trim() ?? '';

    return {
      id: slugify(text),
      text,
      level: Number(heading.tagName.substring(1)),
    };
  });
}

type TableOfContentsProps = {
  headings: Heading[];
};

export function TableOfContents({ headings }: Readonly<TableOfContentsProps>) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    );

    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 3) return null;

  return (
    <nav className="hidden lg:block sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <h4 className="font-mono text-xs uppercase tracking-wider text-text-muted mb-3">
        On this page
      </h4>
      <ul className="space-y-1.5 border-l border-border-subtle">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={`block py-1 text-sm transition-colors duration-200 ${
                h.level === 3 ? 'pl-6' : 'pl-3'
              } ${
                activeId === h.id
                  ? 'text-accent border-l-2 border-accent -ml-px'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
