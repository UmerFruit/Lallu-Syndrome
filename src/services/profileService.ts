import { supabase } from '@/lib/supabase';

export type Profile = {
  id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  website_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileSaveValues = {
  display_name: string;
  username?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  website_url?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
};

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;

  return data as Profile | null;
}

export async function saveProfile(
  userId: string,
  values: ProfileSaveValues
): Promise<Profile> {
  const payload = {
    id: userId,
    display_name: values.display_name,
    username: values.username ?? null,
    avatar_url: values.avatar_url ?? null,
    bio: values.bio ?? null,
    website_url: values.website_url ?? null,
    github_url: values.github_url ?? null,
    linkedin_url: values.linkedin_url ?? null,
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, {
      onConflict: 'id',
    })
    .select()
    .single();

  if (error) throw error;

  return data as Profile;
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop() || 'png';
  // Save as {userId}/avatar.{ext} so it automatically overwrites the old one
  const filePath = `${userId}/avatar.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true, cacheControl: '3600' });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  
  // Append timestamp to bypass browser cache when the image updates
  return `${data.publicUrl}?t=${Date.now()}`;
}