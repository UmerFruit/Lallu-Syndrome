import { useEffect, useState, useRef } from 'react';
import { slugifyHeading } from '@/utils/slugify';

type Heading = {
  id: string;
  text: string;
  level: number;
};
export function extractHeadings(html: string): Heading[] {
  const parsedDoc = new DOMParser().parseFromString(html, 'text/html');
  const headings = Array.from(parsedDoc.querySelectorAll('h1, h2, h3'));
  const usedIds = new Set<string>();
  return headings
    .map((heading) => {
      const text = heading.textContent?.trim() ?? '';
      return {
        id: text ? slugifyHeading(text, usedIds) : '',
        text,
        level: Number(heading.tagName.substring(1)),
      };
    })
    .filter((heading) => heading.id !== '');
}

type TableOfContentsProps = {
  headings: Heading[];
};

export function TableOfContents({ headings }: Readonly<TableOfContentsProps>) {
  const [activeId, setActiveId] = useState<string>('');
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const updateActiveHeading = () => {
      let currentId = '';
      for (const h of headings) {
        const el = document.getElementById(h.id);
        if (el && el.getBoundingClientRect().top <= 120) {
          currentId = h.id;
        } else { break; }
      }
      if (!currentId && headings.length > 0) currentId = headings[0].id;
      setActiveId(currentId);
      rafId.current = null;
    };

    const handleScroll = () => {
      rafId.current ??= window.requestAnimationFrame(updateActiveHeading);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateActiveHeading();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
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
              className={`block py-1 text-sm transition-colors duration-200 ${h.level === 3 ? 'pl-6' : 'pl-3'
                } ${activeId === h.id
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
