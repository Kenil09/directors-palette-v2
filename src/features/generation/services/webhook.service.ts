import { createClient } from '@supabase/supabase-js';
import { StorageService } from './storage.service';
import type { Database } from '../../../../supabase/database.types';

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

// Gallery Metadata Types (used by other services)
export interface GalleryMetadata {
  prompt?: string;
  model?: string;
  output_format?: string;
  replicate_url?: string;
  completed_at?: string;
  error?: string;
  [key: string]: unknown;
}

type GalleryStatus = Database['public']['Enums']['status'];
type GalleryRow = Database['public']['Tables']['gallery']['Row'];

/**
 * Webhook Service
 * Orchestrates webhook processing for Replicate predictions
 */
export class WebhookService {
  /**
   * Process completed prediction and update gallery
   */
  static async processCompletedPrediction(prediction: ReplicatePrediction): Promise<void> {
    const { id, output, status, error, input } = prediction;

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

    // Handle succeeded status
    if (status === 'succeeded' && output) {
      try {
        await this.handleSuccessfulPrediction(galleryEntry, output, input);
      } catch (error) {
        console.error(`Error processing successful prediction ${id}:`, error);
        await this.updateGalleryWithError(
          id,
          galleryEntry,
          error instanceof Error ? error.message : 'Processing failed'
        );
      }
      return;
    }

    // Handle failed status
    if (status === 'failed') {
      console.error(`Prediction ${id} failed:`, error);
      await this.updateGalleryWithError(
        id,
        galleryEntry,
        error?.toString() || 'Prediction failed'
      );
      return;
    }

    // Handle canceled status
    if (status === 'canceled') {
      await this.updateGalleryStatus(id, 'canceled', 'Prediction was canceled');
      return;
    }

    // Handle processing status (optional - for progress updates)
    if (status === 'processing') {
      await this.updateGalleryStatus(id, 'processing', null);
      return;
    }
  }

  /**
   * Handle successful prediction: download, upload, and update gallery
   */
  private static async handleSuccessfulPrediction(
    galleryEntry: GalleryRow,
    output: string | string[],
    input?: ReplicatePredictionInput
  ): Promise<void> {
    // Get asset URL (output can be string or array, take first)
    const assetUrl = Array.isArray(output) ? output[0] : output;

    if (!assetUrl || typeof assetUrl !== 'string') {
      throw new Error('Invalid output URL');
    }

    // Download asset from Replicate
    const { buffer } = await StorageService.downloadAsset(assetUrl);

    // Determine file type
    const { ext, mimeType } = StorageService.getMimeType(
      assetUrl,
      input?.output_format as string | undefined
    );

    // Upload to Supabase Storage
    const { publicUrl, storagePath, fileSize } = await StorageService.uploadToStorage(
      buffer,
      galleryEntry.user_id,
      galleryEntry.prediction_id,
      ext,
      mimeType
    );

    // Get current metadata
    const currentMetadata = (galleryEntry.metadata as Record<string, unknown>) || {};

    // Update gallery record with success data
    const { error: updateError } = await supabase
      .from('gallery')
      .update({
        status: 'completed' as GalleryStatus,
        storage_path: storagePath,
        public_url: publicUrl,
        file_size: fileSize,
        mime_type: mimeType,
        metadata: {
          ...currentMetadata,
          replicate_url: assetUrl,
          completed_at: new Date().toISOString(),
        },
      })
      .eq('prediction_id', galleryEntry.prediction_id);

    if (updateError) {
      console.error('Error updating gallery record:', updateError);
      throw new Error(`Failed to update gallery: ${updateError.message}`);
    }
  }

  /**
   * Update gallery with error status and message
   */
  private static async updateGalleryWithError(
    predictionId: string,
    galleryEntry: GalleryRow,
    errorMessage: string
  ): Promise<void> {
    const currentMetadata = (galleryEntry.metadata as Record<string, unknown>) || {};

    await supabase
      .from('gallery')
      .update({
        status: 'failed' as GalleryStatus,
        error_message: errorMessage,
        metadata: {
          ...currentMetadata,
          error: errorMessage,
          failed_at: new Date().toISOString(),
        },
      })
      .eq('prediction_id', predictionId);
  }

  /**
   * Update gallery status
   */
  private static async updateGalleryStatus(
    predictionId: string,
    status: GalleryStatus,
    errorMessage: string | null
  ): Promise<void> {
    const updateData: Database['public']['Tables']['gallery']['Update'] = { status };

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    await supabase.from('gallery').update(updateData).eq('prediction_id', predictionId);
  }
}
