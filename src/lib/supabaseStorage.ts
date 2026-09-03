import { supabase, isSupabaseConfigured } from './supabase';

const DEFAULT_BUCKET = 'homebiz-media';

/**
 * Upload an image file to Supabase Storage.
 * If Supabase Storage is not yet initialized with the bucket,
 * it safely falls back to a base64 Data URL so the app never crashes or loses the image!
 */
export async function uploadImageToStorage(
  file: File,
  folder: 'avatars' | 'covers' | 'gallery' | 'services' | 'requests' = 'gallery',
  bucketName: string = DEFAULT_BUCKET
): Promise<string> {
  if (!file) {
    throw new Error('No file provided for upload.');
  }

  // 1. Try Supabase Storage first if configured
  if (isSupabaseConfigured) {
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `${folder}/${cleanFileName}`;

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!error && data?.path) {
        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(data.path);

        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      } else if (error) {
        console.warn('Supabase storage upload returned error (will fallback to local dataURL):', error.message);
      }
    } catch (err) {
      console.warn('Supabase storage exception (fallback to local dataURL):', err);
    }
  }

  // 2. Reliable Fallback to FileReader DataURL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read image as data URL'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}
