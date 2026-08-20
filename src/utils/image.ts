import { getPublicUrl } from '@/services/storageService';
const FALLBACK_COUNT = 8;

export function getFallbackImage(articleId: string): string {
  if (!articleId) return getPublicUrl('defaults/sample-1.jpg');

  let hash = 0;

  for (let i = 0; i < articleId.length; i++) {
    hash = (hash << 5) - hash + (articleId.codePointAt(i) ?? 0);
    hash = Math.trunc(hash);
  }

  const index = (Math.abs(hash) % FALLBACK_COUNT) + 1;

  return getPublicUrl(`defaults/sample-${index}.jpg`);
}