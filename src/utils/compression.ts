// ─── Image optimization settings ────────────────────────────────────────
// Tweak these to change compression behavior across all uploads.
// Nothing in this block has side effects — just configuration.

/**
 * MIME types we will attempt to re-encode.
 * GIF is excluded on purpose (can't preserve animation through canvas).
 * WebP/AVIF uploads are excluded — they're already modern formats.
 */
const OPTIMIZABLE_MIME_TYPES = ['image/jpeg', 'image/png'] as const;

/*
 * Largest dimension (in pixels) the output image is allowed to have.
 * Images larger than this on either axis are downscaled to fit.
 * 2000px ≈ 2× retina for a 1000px-wide content column.
 */
const MAX_OUTPUT_EDGE_PX = 2000;

/*
 * Files already smaller than this (in bytes) AND not being resized are left alone
 * re-encoding tiny files wastes CPU and risks growing them.
 */
const MIN_SIZE_BEFORE_COMPRESS_BYTES = 200 * 1024; // 200 KB

// Quality for WebP output (0.0 = smallest/lossiest, 1.0 = largest/lossless).
const WEBP_QUALITY = 0.80;

/** Extension appended to the optimized filename. */
const OUTPUT_EXTENSION = 'webp';

/** MIME type requested from the canvas encoder. */
const OUTPUT_MIME_TYPE = 'image/webp';

/** Regex used to strip the existing extension before appending the new one. */
const EXTENSION_STRIP_REGEX = /\.[^.]+$/;
// ────────────────────────────────────────────────────────────────────────

export async function optimizeForUpload(file: File): Promise<File> {
  if (!OPTIMIZABLE_MIME_TYPES.includes(file.type as typeof OPTIMIZABLE_MIME_TYPES[number])) {
    return file;
  }

  try {
    let width: number;
    let height: number;
    let source: CanvasImageSource;
    let bitmapToClose: ImageBitmap | null = null; // ✅ Track for cleanup


    // Try createImageBitmap first (no options — Firefox-safe)
    try {
      const bitmap = await createImageBitmap(file);
      width = bitmap.width;
      height = bitmap.height;
      source = bitmap;
      bitmapToClose = bitmap;
    } catch {
      // Fallback: Image element (works in every browser back to IE11)
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => {
          URL.revokeObjectURL(i.src);
          resolve(i);
        };
        i.onerror = () => {
          URL.revokeObjectURL(i.src);
          reject(new Error('Image load failed'));
        };
        i.src = URL.createObjectURL(file);
      });
      width = img.naturalWidth;
      height = img.naturalHeight;
      source = img;
    }

    if (width === 0 || height === 0) { return file; }
    const scale = Math.min(1, MAX_OUTPUT_EDGE_PX / Math.max(width, height));
    const alreadySmall = scale === 1 && file.size <= MIN_SIZE_BEFORE_COMPRESS_BYTES;
    if (alreadySmall) return file;

    const w = Math.round(width * scale);
    const h = Math.round(height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, w, h);
    if (bitmapToClose) { bitmapToClose.close(); }
    const blob: Blob | null = await new Promise((resolve) => {
      canvas.toBlob(resolve, OUTPUT_MIME_TYPE, WEBP_QUALITY);
    });

    // Never store something larger than what the user gave us.
    if (!blob || blob.size >= file.size) return file;

    const baseName = file.name.replace(EXTENSION_STRIP_REGEX, '');
    return new File([blob], `${baseName}.${OUTPUT_EXTENSION}`, { type: blob.type });
  } catch {
    // Optimization must never break uploads.
    return file;
  }
}