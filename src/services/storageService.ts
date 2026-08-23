import { supabase } from '@/lib/supabase';
import { optimizeForUpload } from '@/utils/compression';
const BUCKET = 'media';
const PAGE_SIZE = 1000;

async function listAllMediaPaths(prefix: string): Promise<string[]> {
  const paths: string[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(prefix, {
        limit: PAGE_SIZE,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (error) {
      throw error;
    }

    const page = (data ?? []).filter(
      (entry) =>
        entry.name &&
        entry.name !== '.emptyFolderPlaceholder' &&
        entry.name.includes('.')
    );

    paths.push(...page.map((entry) => `${prefix}/${entry.name}`));

    if (page.length < PAGE_SIZE) {
      break;
    }

    offset += PAGE_SIZE;
  }

  return [...new Set(paths)];
}

async function removeMediaPaths(paths: string[]): Promise<void> {
  const uniquePaths = [...new Set(paths.filter(Boolean))];

  for (let i = 0; i < uniquePaths.length; i += PAGE_SIZE) {
    const batch = uniquePaths.slice(i, i + PAGE_SIZE);

    const { error } = await supabase.storage.from(BUCKET).remove(batch);

    if (!error) {
      continue;
    }

    const message = error.message?.toLowerCase() ?? '';
    const isMissingObject =
      message.includes('not found') || message.includes('does not exist');

    if (!isMissingObject) {
      throw error;
    }

    for (const path of batch) {
      const { error: singleError } = await supabase.storage
        .from(BUCKET)
        .remove([path]);

      if (singleError) {
        const singleMessage = singleError.message?.toLowerCase() ?? '';
        const singleMissing =
          singleMessage.includes('not found') ||
          singleMessage.includes('does not exist');

        if (!singleMissing) {
          throw singleError;
        }
      }
    }
  }
}

export interface StorageUploadResult {
  path: string;
  publicUrl: string;
}
export async function cleanupArticleContentMedia(
  articleId: string,
  content: string
): Promise<void> {
  const folder = `articles/${articleId}/content`;

  const referencedPaths = new Set(extractStorageImagePaths(content));
  const storedPaths = await listAllMediaPaths(folder);
  const orphanedPaths = storedPaths.filter(
    (path) => !referencedPaths.has(path)
  );

  await removeMediaPaths(orphanedPaths);
}
export async function upload(articleId: string, file: File, type: 'cover' | 'content'): Promise<StorageUploadResult> {
  file = await optimizeForUpload(file);
  const MAX_CONTENT_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new Error('Unsupported image type.');
  if (file.size > MAX_CONTENT_IMAGE_SIZE) throw new Error('Image must be under 5 MB.');

  let filePath = `articles/${articleId}/`;
  const extension = file.name.split('.').pop()?.toLowerCase() || file.type.split("/").pop()?.toLowerCase();
  if (!extension) {
    throw new Error('Unable to determine file extension.');
  }
  if (type === "content") {
    filePath += `${type}/${crypto.randomUUID()}.${extension}`
  } else {
    filePath += `cover.${extension}`
  }
  const { data, error } = await supabase.storage.from(BUCKET).upload(filePath, file)
  if (error) {
    throw error
  }
  return {
    path: data.path,
    publicUrl: getPublicUrl(data.path),
  };
}

export async function deleteCoverImage(path: string): Promise<void> {
  const prefix =
    `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;

  if (!path.startsWith(prefix)) {
    return;
  }

  const storagePath = path.slice(prefix.length);

  if (!storagePath) {
    return;
  }

  await removeMediaPaths([storagePath]);
}

export function getPublicUrl(path: string): string {
  const { data } = supabase
    .storage
    .from(BUCKET)
    .getPublicUrl(path)
  return data["publicUrl"]
}
export function extractStorageImagePaths(content: string): string[] {
  const publicUrlPrefix =
    `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;

  const parsedDoc = new DOMParser().parseFromString(content, 'text/html');

  const paths: string[] = [];

  parsedDoc.querySelectorAll('img[src]').forEach((image) => {
    const src = image.getAttribute('src');

    if (!src) {
      return;
    }

    if (src.startsWith(publicUrlPrefix)) {
      paths.push(src.slice(publicUrlPrefix.length));
    }
  });

  return [...new Set(paths)];
}