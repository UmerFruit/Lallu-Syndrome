import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { slugify, slugifyHeading } from '@/utils/slugify';

type ArticleContentProps = {
  content: string;
};

export function ArticleContent({ content }: Readonly<ArticleContentProps>) {
  const finalHtml = useMemo(() => {
    if (!content) return '';

    const sanitized = DOMPurify.sanitize(content, {
      USE_PROFILES: { html: true },
      ADD_ATTR: ['target', 'rel', 'class', 'style', 'data-width', 'data-alignment'],
    });

    const parsedDoc = new DOMParser().parseFromString(sanitized, 'text/html');

    // Handle External Links
    parsedDoc.querySelectorAll<HTMLAnchorElement>('a[href^="http"]').forEach((link) => {
      try {
        const url = new URL(link.href);
        if (url.hostname !== window.location.hostname) {
          link.setAttribute('target', '_blank');
          link.setAttribute('rel', 'noopener noreferrer');
        }
      } catch {
        // Keep malformed URLs from retaining unsafe link attributes.
        link.removeAttribute('target');
        link.removeAttribute('rel');
      }
    });

    // Handle Headings (TOC)
    const usedIds = new Set<string>();
    parsedDoc.querySelectorAll('h1, h2, h3').forEach((heading) => {
      const text = heading.textContent?.trim() ?? '';
      if (!text) return;
      heading.id = slugifyHeading(text, usedIds);
      heading.classList.add('scroll-mt-20');
    });
   
    return parsedDoc.body.innerHTML;
  }, [content]); 

  return (
    <div
      className="article-prose"
      dangerouslySetInnerHTML={{ __html: finalHtml }}
    />
  );
}