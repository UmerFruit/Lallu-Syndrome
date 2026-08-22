import { supabase } from '@/lib/supabase';
import {optimizeForUpload} from '@/utils/compression';
const BUCKET = 'media';

export interface StorageUploadResult {
  path: string;
  publicUrl: string;
}
export async function cleanupArticleContentMedia(
  articleId: string,
  content: string
): Promise<void> {
  const folder = `articles/${articleId}/content`;

  const referencedPaths = new Set(
    extractStorageImagePaths(content)
  );

  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET)
    .list(folder, {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' },
    });

  if (listError) {
    throw listError;
  }

  const storedPaths = (files ?? [])
    .filter(
      (file) =>
        file.name &&
        file.name !== '.emptyFolderPlaceholder'
    )
    .map((file) => `${folder}/${file.name}`);

  const orphanedPaths = storedPaths.filter(
    (path) => !referencedPaths.has(path)
  );

  if (orphanedPaths.length === 0) {
    return;
  }

  const { error: deleteError } = await supabase.storage
    .from(BUCKET)
    .remove(orphanedPaths);

  if (deleteError) {
    throw deleteError;
  }
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

export async function deleteArticleMedia(
  content: string,
  coverImage: string | null,
): Promise<void> {
  const paths = extractStorageImagePaths(content);

  if (coverImage) {
    const prefix =
      `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;

    if (coverImage.startsWith(prefix)) {
      paths.push(coverImage.slice(prefix.length));
    }
  }

  const uniquePaths = [...new Set(paths)];

  if (uniquePaths.length === 0) {
    return;
  }

  for (let i = 0; i < uniquePaths.length; i += 1000) {
    const batch = uniquePaths.slice(i, i + 1000);

    const { error } = await supabase
      .storage
      .from(BUCKET)
      .remove(batch);

    if (error) {
      throw error;
    }
  }
}
export async function deleteCoverImage(path: string): Promise<void> {
  const prefix =
    `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;

  if (!path.startsWith(prefix)) {
    return;
  }

  const storagePath = path.slice(prefix.length);

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([storagePath]);

  if (error) {
    throw error;
  }
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

  const parsedDoc = new DOMParser().parseFromString(content,'text/html');

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