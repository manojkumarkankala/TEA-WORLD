import { supabase } from '@/lib/supabase';

export async function uploadMedia(file: File, folder: string): Promise<{ url: string; error: string | null }> {
  const ext = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

  const { error } = await supabase.storage.from('media').upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    return { url: '', error: error.message };
  }

  const { data } = supabase.storage.from('media').getPublicUrl(fileName);
  return { url: data.publicUrl, error: null };
}
