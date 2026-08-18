function decodeHtmlEntities(value: string): string {
  const textarea = document.createElement('textarea');

  textarea.innerHTML = value;

  return textarea.value;
}

function normalizeHtml(html: string): string {
  let result = html;

  // Decode clipboard HTML if it has been entity-encoded.
  for (let i = 0; i < 3; i++) {
    if (!result.includes('&lt;')) {
      break;
    }

    const decoded = decodeHtmlEntities(result);

    if (decoded === result) {
      break;
    }

    result = decoded;
  }

  return result;
}

export async function processPastedHtml(
  html: string,
  onImageUpload: (file: File) => Promise<string>
): Promise<string> {
  const normalizedHtml = normalizeHtml(html);

  const document = new DOMParser().parseFromString(
    normalizedHtml,
    'text/html'
  );

  const images = Array.from(document.querySelectorAll('img'));

  await Promise.all(
    images.map(async (image, index) => {
      const src = image.getAttribute('src');

      if (!src) {
        return;
      }

      try {
        // Already stored in our Supabase bucket.
        // Don't download and upload it again.
        if (
          src.includes(
            '/storage/v1/object/public/media/'
          )
        ) {
          return;
        }

        const response = await fetch(src);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch image: ${response.status}`
          );
        }

        const blob = await response.blob();

        if (!blob.type.startsWith('image/')) {
          throw new Error('Source is not an image.');
        }

        const extension =
          blob.type.split('/')[1]?.split('+')[0] || 'png';

        const file = new File(
          [blob],
          `pasted-image-${index + 1}.${extension}`,
          {
            type: blob.type,
          }
        );

        const url = await onImageUpload(file);

        image.setAttribute('src', url);

        // Don't carry responsive-image information
        // from the source website into our editor.
        image.removeAttribute('srcset');
        image.removeAttribute('sizes');

      } catch (error) {
        console.error(
          `Failed to process pasted image ${index + 1}:`,
          error
        );
        throw error;
      }
    })
  );

  return document.body.innerHTML;
}