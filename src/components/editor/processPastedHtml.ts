function decodeHtmlEntities(value: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = value;
  return textarea.value;
}

function normalizeHtml(html: string): string {
  let result = html;
  for (let i = 0; i < 3; i++) {
    if (!result.includes('&lt;')) break;
    const decoded = decodeHtmlEntities(result);
    if (decoded === result) break;
    result = decoded;
  }
  return result;
}

export type PastedImage = {
  originalSrc: string;
};

export function processPastedHtml(
  html: string,
  currentArticleId?: string | null
): { html: string; images: PastedImage[] } {
  const normalizedHtml = normalizeHtml(html);
  const parsedDoc = new DOMParser().parseFromString(normalizedHtml, 'text/html');
  const images = Array.from(parsedDoc.querySelectorAll('img'));
  const imagesToUpload: PastedImage[] = [];
  const mediaPrefix = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/media/`;

  images.forEach((image) => {
    const src = image.getAttribute('src');
    if (!src) { return; }

    image.removeAttribute('srcset');
    image.removeAttribute('sizes');

    if (src.includes('/storage/v1/object/public/media/')) {
      if (src.startsWith(mediaPrefix)) {
        const path = src.slice(mediaPrefix.length).split('?')[0];
        const parts = path.split('/');

        if (parts[0] === 'articles') {
          if (currentArticleId && parts[1] === currentArticleId) { return; }
          imagesToUpload.push({ originalSrc: src });
        }
      }
      return;
    }
  imagesToUpload.push({ originalSrc: src });
  })
  return { html: parsedDoc.body.innerHTML, images: imagesToUpload };
}