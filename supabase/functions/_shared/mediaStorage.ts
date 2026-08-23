// supabase/functions/_shared/mediaStorage.ts

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export const MEDIA_BUCKET = "media";
export const AVATARS_BUCKET = "avatars";

const PAGE_SIZE = 1000;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type StorageListEntry = {
  name: string;
  metadata?: unknown;
};

function normalizeSegment(value: string): string {
  return value.replace(/^\/+/, "").replace(/\/+$/, "");
}

function lastSegment(path: string): string {
  return normalizeSegment(path).split("/").pop() ?? "";
}

function isPlaceholder(value: string): boolean {
  const normalized = normalizeSegment(value);

  return (
    !normalized ||
    normalized === "." ||
    normalized === ".." ||
    normalized === ".emptyFolderPlaceholder"
  );
}

function hasFileExtension(value: string): boolean {
  return lastSegment(value).includes(".");
}

function assertUuid(value: string, label: string): void {
  if (!UUID_REGEX.test(value)) {
    throw new Error(`Invalid ${label}`);
  }
}

function isFileEntry(entry: StorageListEntry): boolean {
  if (isPlaceholder(entry.name)) {
    return false;
  }

  return hasFileExtension(entry.name);
}

function isFolderEntry(entry: StorageListEntry): boolean {
  if (isPlaceholder(entry.name)) {
    return false;
  }

  return !hasFileExtension(entry.name);
}

export async function listAllEntries(
  supabaseAdmin: SupabaseClient,
  bucket: string,
  prefix: string
): Promise<StorageListEntry[]> {
  const entries: StorageListEntry[] = [];
  let offset = 0;
  const normalizedPrefix = normalizeSegment(prefix);

  while (true) {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .list(normalizedPrefix, {
        limit: PAGE_SIZE,
        offset,
      });

    if (error) {
      throw error;
    }

    const page = (data ?? []).filter(
      (entry) => entry?.name && !isPlaceholder(entry.name)
    );

    entries.push(...page);

    if (page.length < PAGE_SIZE) {
      break;
    }

    offset += PAGE_SIZE;
  }

  return entries;
}

export async function collectAllStorageFiles(
  supabaseAdmin: SupabaseClient,
  bucket: string,
  prefix: string
): Promise<string[]> {
  const files = new Set<string>();
  const queue: string[] = [normalizeSegment(prefix)];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = normalizeSegment(queue.shift()!);

    if (visited.has(current)) {
      continue;
    }

    visited.add(current);

    const entries = await listAllEntries(supabaseAdmin, bucket, current);

    for (const entry of entries) {
      const entryName = normalizeSegment(entry.name);

      if (isPlaceholder(entryName)) {
        continue;
      }

      const path = `${current}/${entryName}`;

      if (isFileEntry(entry)) {
        files.add(path);
      } else if (isFolderEntry(entry)) {
        queue.push(path);
      }
    }
  }

  return [...files];
}

export async function removeStoragePaths(
  supabaseAdmin: SupabaseClient,
  bucket: string,
  paths: string[]
): Promise<void> {
  const uniquePaths = [...new Set(paths.filter(Boolean))];

  for (let i = 0; i < uniquePaths.length; i += PAGE_SIZE) {
    const batch = uniquePaths.slice(i, i + PAGE_SIZE);

    const { error } = await supabaseAdmin.storage.from(bucket).remove(batch);

    if (!error) {
      continue;
    }

    const message = String(error.message ?? "").toLowerCase();
    const isMissingObject =
      message.includes("not found") || message.includes("does not exist");

    if (!isMissingObject) {
      throw error;
    }

    // If batch deletion fails because one object is missing, retry individually
    // and ignore missing objects.
    for (const path of batch) {
      const { error: singleError } = await supabaseAdmin.storage
        .from(bucket)
        .remove([path]);

      if (singleError) {
        const singleMessage = String(singleError.message ?? "").toLowerCase();

        const singleMissing =
          singleMessage.includes("not found") ||
          singleMessage.includes("does not exist");

        if (!singleMissing) {
          throw singleError;
        }
      }
    }
  }
}

export async function deleteArticleMedia(
  supabaseAdmin: SupabaseClient,
  articleId: string
): Promise<void> {
  assertUuid(articleId, "articleId");

  const files = await collectAllStorageFiles(
    supabaseAdmin,
    MEDIA_BUCKET,
    `articles/${articleId}`
  );

  await removeStoragePaths(supabaseAdmin, MEDIA_BUCKET, files);
}

export async function deleteUserAvatarMedia(
  supabaseAdmin: SupabaseClient,
  userId: string
): Promise<void> {
  assertUuid(userId, "userId");

  const files = await collectAllStorageFiles(
    supabaseAdmin,
    AVATARS_BUCKET,
    userId
  );

  await removeStoragePaths(supabaseAdmin, AVATARS_BUCKET, files);
}