import { supabase } from '../lib/supabase';

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

export async function deleteMedia(path: string): Promise<void> {   // delete was a keyword
    const { error } = await supabase.storage.from(BUCKET).remove([path])
    if (error) {
        throw error
    }

}

export function getPublicUrl(path: string): string {
    const { data } = supabase
        .storage
        .from(BUCKET)
        .getPublicUrl(path)
    return data["publicUrl"]
}