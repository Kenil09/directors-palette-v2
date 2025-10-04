import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const STORAGE_BUCKET = 'directors-palette';

/**
 * Storage Service
 * Handles downloading assets from Replicate and uploading to Supabase Storage
 */
export class StorageService {
  /**
   * Download asset from Replicate URL
   * @param url - The Replicate asset URL (temporary, expires in 1 hour)
   * @returns Buffer and content type
   */
  static async downloadAsset(
    url: string
  ): Promise<{ buffer: ArrayBuffer; contentType: string }> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to download asset from ${url}: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    return { buffer, contentType };
  }

  /**
   * Determine MIME type and file extension from URL or format
   * @param url - The asset URL
   * @param format - Optional format hint from input
   * @returns File extension and MIME type
   */
  static getMimeType(url: string, format?: string): { ext: string; mimeType: string } {
    // MIME type mapping
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
      mp4: 'video/mp4',
      webm: 'video/webm',
    };

    // Try to get extension from URL
    const urlMatch = url.match(/\.([a-z0-9]{3,4})(\?|$)/i);
    if (urlMatch) {
      const ext = urlMatch[1].toLowerCase();
      return {
        ext,
        mimeType: mimeMap[ext] || 'application/octet-stream',
      };
    }

    // Fall back to format parameter
    if (format) {
      const ext = format.toLowerCase();
      return {
        ext,
        mimeType: mimeMap[ext] || 'application/octet-stream',
      };
    }

    // Default to JPEG
    return { ext: 'jpg', mimeType: 'image/jpeg' };
  }

  /**
   * Upload asset to Supabase Storage
   * @param buffer - The file buffer
   * @param userId - User ID for organizing files
   * @param predictionId - Prediction ID for unique naming
   * @param fileExtension - File extension
   * @param mimeType - MIME type
   * @returns Public URL, storage path, and file size
   */
  static async uploadToStorage(
    buffer: ArrayBuffer,
    userId: string,
    predictionId: string,
    fileExtension: string,
    mimeType: string
  ): Promise<{
    publicUrl: string;
    storagePath: string;
    fileSize: number;
  }> {
    // Storage path: generations/{user_id}/{prediction_id}.{ext}
    const storagePath = `generations/${userId}/${predictionId}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload to storage: ${uploadError.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);

    return {
      publicUrl,
      storagePath,
      fileSize: buffer.byteLength,
    };
  }
}
