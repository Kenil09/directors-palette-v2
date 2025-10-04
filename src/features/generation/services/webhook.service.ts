import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Replicate Prediction Types
export interface ReplicatePredictionInput {
  prompt?: string;
  output_format?: string;
  images?: string[];
  [key: string]: unknown;
}

export interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output: string | string[] | null;
  error?: string | null;
  input?: ReplicatePredictionInput;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
  metrics?: {
    predict_time?: number;
  };
}

// Gallery Entry Types
export interface GalleryMetadata {
  prompt?: string;
  output_format?: string;
  status?: string;
  created_at?: string;
  replicate_url?: string;
  completed_at?: string;
  error?: string;
  [key: string]: unknown;
}

interface GalleryEntry {
  id: string;
  user_id: string;
  prediction_id: string;
  public_url: string | null;
  storage_path: string | null;
  file_size: number | null;
  mime_type: string | null;
  metadata: GalleryMetadata | null;
  created_at: string;
  updated_at: string;
}

export class WebhookService {
  private static webhookSecretCache: string | null = null;

  /**
   * Get Replicate webhook signing secret from API (cached)
   */
  static async getReplicateWebhookSecret(): Promise<void> {
    if (this.webhookSecretCache) {
      return;
    }

    const response = await fetch(
      'https://api.replicate.com/v1/webhooks/default/secret',
      {
        headers: {
          'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch webhook secret from Replicate');
    }

    const data = await response.json();
    // Extract base64 part after 'whsec_' prefix
    this.webhookSecretCache = data.key.replace('whsec_', '');
  }

  /**
   * Download asset from Replicate URL
   */
  static async downloadAsset(url: string): Promise<ArrayBuffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download asset from ${url}`);
    }
    return response.arrayBuffer();
  }

  /**
   * Upload asset to Supabase Storage and return public URL
   */
  static async uploadToSupabase(
    buffer: ArrayBuffer,
    storagePath: string,
    contentType: string
  ): Promise<{ publicUrl: string; error: Error | null }> {
    const { error } = await supabase.storage
      .from('directors-palette')
      .upload(storagePath, buffer, {
        contentType,
        upsert: true
      });

    if (error) {
      return { publicUrl: '', error };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('directors-palette')
      .getPublicUrl(storagePath);

    return { publicUrl, error: null };
  }

  /**
   * Process completed prediction and update gallery
   */
  static async processCompletedPrediction(prediction: ReplicatePrediction): Promise<void> {
    const { id, output, status, input } = prediction;

    // Find the gallery entry by prediction_id
    const { data: galleryEntry, error: findError } = await supabase
      .from('gallery')
      .select('*')
      .eq('prediction_id', id)
      .single();

    if (findError || !galleryEntry) {
      console.error(`No gallery entry found for prediction ${id}:`, findError);
      return;
    }

    const typedGalleryEntry = galleryEntry as unknown as GalleryEntry;

    if (status === 'succeeded' && output) {
      try {
        // Get asset URL (output can be string or array, take first)
        const assetUrl = Array.isArray(output) ? output[0] : output;

        if (!assetUrl || typeof assetUrl !== 'string') {
          console.error(`Invalid output URL for prediction ${id}`);
          return;
        }

        // Download asset
        const buffer = await this.downloadAsset(assetUrl);

        // Determine file extension and MIME type dynamically
        let fileExt = 'jpg'; // default
        let mimeType = 'image/jpeg'; // default

        // Try to get format from URL extension
        const urlMatch = assetUrl.match(/\.([a-z]{3,4})(\?|$)/i);
        if (urlMatch) {
          fileExt = urlMatch[1].toLowerCase();
        } else if (input?.output_format) {
          // Fall back to input format
          fileExt = input.output_format;
        }

        // Map extension to MIME type
        const mimeMap: Record<string, string> = {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'webp': 'image/webp',
          'gif': 'image/gif',
          'mp4': 'video/mp4',
          'webm': 'video/webm',
        };
        mimeType = mimeMap[fileExt] || 'image/jpeg';

        const storagePath = `generations/${typedGalleryEntry.user_id}/${id}.${fileExt}`;

        // Upload to Supabase Storage
        const { publicUrl, error: uploadError } = await this.uploadToSupabase(
          buffer,
          storagePath,
          mimeType
        );

        if (uploadError) {
          throw uploadError;
        }

        const currentMetadata = typedGalleryEntry.metadata as GalleryMetadata || {};

        // Update gallery record with image data
        const { error: updateError } = await supabase
          .from('gallery')
          .update({
            storage_path: storagePath,
            public_url: publicUrl,
            file_size: buffer.byteLength,
            mime_type: mimeType,
            metadata: {
              ...currentMetadata,
              replicate_url: assetUrl,
              completed_at: new Date().toISOString()
            }
          })
          .eq('id', typedGalleryEntry.id);

        if (updateError) {
          console.error('Error updating gallery record:', updateError);
        }
      } catch (error) {
        console.error(`Error processing prediction ${id}:`, error);
        const currentMetadata = typedGalleryEntry.metadata as GalleryMetadata || {};
        // Update gallery with error
        await supabase
          .from('gallery')
          .update({
            metadata: {
              ...currentMetadata,
              error: error instanceof Error ? error.message : 'Processing failed'
            }
          })
          .eq('id', typedGalleryEntry.id);
      }
    } else if (status === 'failed') {
      console.error(`Prediction ${id} failed:`, prediction.error);

      const currentMetadata = typedGalleryEntry.metadata as GalleryMetadata || {};

      // Update gallery with failure
      await supabase
        .from('gallery')
        .update({
          metadata: {
            ...currentMetadata,
            error: prediction.error?.toString() || 'Prediction failed'
          }
        })
        .eq('id', typedGalleryEntry.id);
    } else if (status === 'canceled') {
      const currentMetadata = typedGalleryEntry.metadata as GalleryMetadata || {};

      // Update gallery with cancellation
      await supabase
        .from('gallery')
        .update({
          metadata: {
            ...currentMetadata,
            error: 'Prediction was canceled'
          }
        })
        .eq('id', typedGalleryEntry.id);
    }
  }
}
