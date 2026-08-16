import { supabase } from '@/lib/supabase';

const BUCKET = 'media';

export interface StorageUploadResult {
    path: string;
    publicUrl: string;
}

export async function upload(articleId: string, file: File, type: 'cover' | 'content'): Promise<StorageUploadResult> {

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

    const imageUrlRegex = /!\[[^\]]*]\(([^)]+)\)/g;

    const paths: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = imageUrlRegex.exec(content)) !== null) {
        const url = match[1];

        if (url.startsWith(publicUrlPrefix)) {
            paths.push(url.slice(publicUrlPrefix.length));
        }
    }

    return [...new Set(paths)];
}

export async function deleteRemovedContentImages(
    previousContent: string,
    nextContent: string
): Promise<void> {
    const previousPaths = extractStorageImagePaths(previousContent);
    const nextPaths = new Set(extractStorageImagePaths(nextContent));

    const removedPaths = previousPaths.filter(
        (path) => !nextPaths.has(path)
    );

    if (removedPaths.length === 0) return;

    const { error } = await supabase.storage
        .from(BUCKET)
        .remove(removedPaths);

    if (error) {
        throw error;
    }
}