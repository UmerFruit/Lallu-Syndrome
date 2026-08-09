import { useMemo } from 'react';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js/lib/common';

type ArticleContentProps = {
  content: string;
};

export function ArticleContent({ content }: Readonly<ArticleContentProps>) {
  const html = useMemo(() => {
    const md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      highlight(str: string, lang: string): string {
        const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
        try {
          const highlighted = hljs.highlight(str, { language }).value;
          return `<pre class="hljs"><code class="language-${language}">${highlighted}</code></pre>`;
        } catch {
          return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
        }
      },
    });

    md.renderer.rules.heading_open = (tokens, idx) => {
      const token = tokens[idx];
      const level = token.tag;
      const text = tokens[idx + 1].content;
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      return `<${level} id="${id}">`;
    };

    return md.render(content);
  }, [content]);

  return (
    <div
      className="article-prose"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
