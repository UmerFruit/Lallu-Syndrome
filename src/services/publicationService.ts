import { supabase } from '@/lib/supabase';
import type { Publication } from '@/types';
import { slugify } from '@/utils/slugify';
import type { Database } from '@/types/database';

type PublicationRow = Database['public']['Tables']['publications']['Row'];

function mapPublication(row: PublicationRow): Publication {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    logoUrl: row.logo_url,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getMyPublications(userId: string): Promise<Publication[]> {
  const { data, error } = await supabase
    .from('publications')
    .select('*')
    .eq('owner_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) throw error;

  return data.map(mapPublication);
}


export async function getPublicationBySlug(slug: string): Promise<Publication | null> {
  const { data, error } = await supabase
    .from('publications')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;

  return data ? mapPublication(data) : null;
}

async function createFallbackDefaultPublication(userId: string): Promise<Publication> {
  const { data, error } = await supabase
    .from('publications')
    .insert({
      owner_id: userId,
      name: 'The Journal',
      slug: slugify('The Journal'),
      is_default: true,
    })
    .select('*')
    .single();

  if (error) throw error;

  return mapPublication(data);
}

export async function getDefaultPublication(userId: string): Promise<Publication> {
  const { data, error } = await supabase
    .from('publications')
    .select('*')
    .eq('owner_id', userId)
    .eq('is_default', true)
    .maybeSingle();

  if (error) throw error;

  if (data) return mapPublication(data);

  try {
    return await createFallbackDefaultPublication(userId);
  } catch (error: any) {
    // If duplicate default happened because of race condition, fetch again.
    if (error?.code === '23505') {
      const { data: existing, error: retryError } = await supabase
        .from('publications')
        .select('*')
        .eq('owner_id', userId)
        .eq('is_default', true)
        .maybeSingle();

      if (retryError) throw retryError;

      if (existing) return mapPublication(existing);
    }

    throw error;
  }
}

export async function createPublication(
  ownerId: string,
  input: {
    name: string;
    description?: string;
  }
): Promise<Publication> {
  let lastError: any = null;

  // Retry a few times in case of slug collision.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const slug = slugify(input.name);

    const { data, error } = await supabase
      .from('publications')
      .insert({
        owner_id: ownerId,
        name: input.name,
        slug,
        description: input.description ?? null,
        is_default: false,
      })
      .select('*')
      .single();

    if (!error) return mapPublication(data);

    lastError = error;

    if (error.code !== '23505') {
      throw error;
    }
  }

  throw lastError ?? new Error('Failed to create publication.');
}

export async function updatePublication(
  id: string,
  values: {
    name?: string;
    description?: string | null;
  }
): Promise<Publication> {
  const { data, error } = await supabase
    .from('publications')
    .update(values)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;

  return mapPublication(data);
}

export async function deletePublication(id: string): Promise<void> {
  const { error } = await supabase
    .from('publications')
    .delete()
    .eq('id', id);

  if (error) throw error;
}