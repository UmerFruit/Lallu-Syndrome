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

export function processPastedHtml(html: string): { html: string; images: PastedImage[] } {
  const normalizedHtml = normalizeHtml(html);
  const parsedDoc = new DOMParser().parseFromString(normalizedHtml, 'text/html');
  const images = Array.from(parsedDoc.querySelectorAll('img'));
  const imagesToUpload: PastedImage[] = [];

  images.forEach((image) => {
    const src = image.getAttribute('src');
    if (!src) { return; }

    // if already stored in our Supabase bucket. Don't re-upload.
    if (src.includes('/storage/v1/object/public/media/')) { return; }

    imagesToUpload.push({ originalSrc: src });
    image.removeAttribute('srcset');
    image.removeAttribute('sizes');

  })
  return { html: parsedDoc.body.innerHTML, images: imagesToUpload };
}