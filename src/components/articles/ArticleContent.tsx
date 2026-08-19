import DOMPurify from 'dompurify';
import { slugify } from '@/utils/slugify';

type ArticleContentProps = {
  content: string;
};

export function ArticleContent({
  content,
}: Readonly<ArticleContentProps>) {
  const sanitized = DOMPurify.sanitize(content, {
    USE_PROFILES: {
      html: true,
    },
    ADD_ATTR: [
      'target',
      'rel',
      'class',
      'style',
      'data-width',
      'data-alignment',
    ],
  });

  const document = new DOMParser().parseFromString(
    sanitized,
    'text/html'
  );

  const usedIds = new Set<string>();

  document.querySelectorAll('h1, h2, h3').forEach((heading) => {
    const text = heading.textContent?.trim() ?? '';

    if (!text) return;

    const baseId = slugify(text);
    let id = baseId;
    let counter = 2;

    while (usedIds.has(id)) {
      id = `${baseId}-${counter++}`;
    }

    usedIds.add(id);
    heading.id = id;
    heading.classList.add('scroll-mt-20');
  });

  return (
    <div
      className="article-prose"
      dangerouslySetInnerHTML={{
        __html: document.body.innerHTML,
      }}
    />
  );
}