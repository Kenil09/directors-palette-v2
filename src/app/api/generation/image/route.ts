import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../../../supabase/database.types';
import { ImageGenerationService } from '@/features/shot-creator/services/image-generation.service';
import { ImageModel, ImageModelSettings } from "@/features/shot-creator/types/image-generation.types";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const {
      model,
      prompt,
      referenceImages,
      modelSettings,
      user_id,
    } = await request.json();

    // Validate required fields
    if (!model) {
      return NextResponse.json(
        { error: 'Model is required' },
        { status: 400 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    if (!modelSettings) {
      return NextResponse.json(
        { error: 'Model settings are required' },
        { status: 400 }
      );
    }

    // Validate input using service
    const validation = ImageGenerationService.validateInput({
      model: model as ImageModel,
      prompt,
      referenceImages,
      modelSettings: modelSettings as ImageModelSettings,
      userId: user_id,
    });

    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Build Replicate input
    const replicateInput = ImageGenerationService.buildReplicateInput({
      model: model as ImageModel,
      prompt,
      referenceImages,
      modelSettings: modelSettings as ImageModelSettings,
      userId: user_id,
    });

    // Get model identifier
    const replicateModelId = ImageGenerationService.getReplicateModelId(model as ImageModel);
    console.log('Using model:', replicateModelId);
    console.log('Input data:', JSON.stringify(replicateInput, null, 2));

    // Create Replicate prediction with webhook
    const webhookUrl = `${process.env.WEBHOOK_URL}/api/webhooks/replicate`;
    console.log('Webhook URL:', webhookUrl);

    let prediction;
    try {
      console.log('Creating prediction with model:', replicateModelId);
      console.log('Input payload:', JSON.stringify({
        model: replicateModelId,
        input: replicateInput,
        webhook: webhookUrl,
        webhook_events_filter: ['completed'],
      }, null, 2));

      prediction = await replicate.predictions.create({
        model: replicateModelId,
        input: replicateInput,
        webhook: webhookUrl,
        webhook_events_filter: ['completed'],
      });

      console.log('Prediction created successfully:', prediction.id);
    } catch (replicateError: unknown) {
      const error = replicateError as {
        message?: string;
        response?: {
          status?: number;
          statusText?: string;
          data?: unknown;
        };
      };
      console.error('Replicate API error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });

      // Check if this is a model not found error (404) or bad gateway (502)
      if (error.response?.status === 404) {
        return NextResponse.json(
          {
            error: 'Model not found',
            details: `The model '${replicateModelId}' is not available on Replicate. Please check if the model name is correct or if it has been deprecated.`,
            model: replicateModelId,
            input: replicateInput
          },
          { status: 404 }
        );
      }

      if (error.response?.status === 502) {
        return NextResponse.json(
          {
            error: 'Model temporarily unavailable',
            details: `The model '${replicateModelId}' is currently experiencing issues (502 Bad Gateway). This could be temporary. Please try again later or contact support if the issue persists.`,
            model: replicateModelId,
            input: replicateInput,
            suggestions: [
              'Try again in a few minutes',
              'Check if the model name is correct on Replicate',
              'Consider using a different image editing model if available',
              'Verify your Replicate API token has sufficient permissions'
            ]
          },
          { status: 502 }
        );
      }

      // Provide general error with suggestions
      return NextResponse.json(
        {
          error: 'Replicate API error',
          details: error.message || 'Unknown error occurred',
          model: replicateModelId,
          input: replicateInput,
          suggestions: [
            'Check your internet connection',
            'Verify your Replicate API token',
            'Ensure the model name is correct',
            'Try using a different model if available'
          ]
        },
        { status: 500 }
      );
    }

    // Build metadata for storage
    const metadata = ImageGenerationService.buildMetadata({
      model: model as ImageModel,
      prompt,
      referenceImages,
      modelSettings: modelSettings as ImageModelSettings,
      userId: user_id,
    });

    // Create gallery entry with proper schema
    const { data: gallery, error: galleryError } = await supabase
      .from('gallery')
      .insert({
        user_id,
        prediction_id: prediction.id,
        generation_type: 'image',
        status: 'pending',
        metadata: metadata as Database['public']['Tables']['gallery']['Insert']['metadata']
      })
      .select()
      .single();

    if (galleryError || !gallery) {
      console.error('Gallery creation error:', galleryError);
      return NextResponse.json(
        { error: 'Failed to create gallery entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      predictionId: prediction.id,
      galleryId: gallery.id,
      status: prediction.status,
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to create image generation prediction' },
      { status: 500 }
    );
  }
}
