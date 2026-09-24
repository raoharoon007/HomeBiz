import { supabase, isSupabaseConfigured } from './supabase';

const DEFAULT_BUCKET = 'homebiz-media';
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB limit
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);
const VALID_FOLDERS = new Set(['avatars', 'covers', 'gallery', 'services', 'requests']);

/**
 * Upload an image file to Supabase Storage with strict file type, extension,
 * and size validation to prevent arbitrary file upload vulnerabilities.
 */
export async function uploadImageToStorage(
  file: File,
  folder: 'avatars' | 'covers' | 'gallery' | 'services' | 'requests' = 'gallery',
  bucketName: string = DEFAULT_BUCKET
): Promise<string> {
  if (!file) {
    throw new Error('No file provided for upload.');
  }

  // 1. File Size Validation (Max 5MB)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum allowed limit of 5 MB.`);
  }

  // 2. MIME Type Validation
  const mimeType = (file.type || '').toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are permitted.');
  }

  // 3. File Extension Validation
  const fileExt = (file.name.split('.').pop() || '').toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(fileExt)) {
    throw new Error('Invalid file extension. Please upload a standard image file.');
  }

  // 4. Folder Path Sanitization (Prevent path traversal)
  const targetFolder = VALID_FOLDERS.has(folder) ? folder : 'gallery';

  // 5. Try Supabase Storage first if configured
  if (isSupabaseConfigured) {
    try {
      const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `${targetFolder}/${cleanFileName}`;

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false, // Prevent accidental overwrite
          contentType: mimeType,
        });

      if (!error && data?.path) {
        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(data.path);

        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      } else if (error) {
        console.warn('Supabase storage upload error (will fallback to local dataURL):', error.message);
      }
    } catch (err) {
      console.warn('Supabase storage exception (fallback to local dataURL):', err);
    }
  }

  // 6. Fallback to FileReader DataURL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to process image data URL'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}
