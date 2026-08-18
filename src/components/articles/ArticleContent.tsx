import DOMPurify from 'dompurify';

type ArticleContentProps = {
  content: string;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

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