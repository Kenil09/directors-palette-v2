import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../../../supabase/database.types';
import { VideoGenerationService } from '@/features/shot-animator/services/video-generation.service';
import type { AnimationModel, ModelSettings } from '@/features/shot-animator/types';

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
      image,
      modelSettings,
      referenceImages,
      lastFrameImage,
      user_id,
    } = await request.json();

    // Validate required fields
    if (!model) {
      return NextResponse.json(
        { error: 'Model is required (seedance-lite or seedance-pro)' },
        { status: 400 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required for image-to-video generation' },
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
    const validation = VideoGenerationService.validateInput({
      model: model as AnimationModel,
      prompt,
      image,
      modelSettings: modelSettings as ModelSettings,
      referenceImages,
      lastFrameImage,
    });

    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Build Replicate input
    const replicateInput = VideoGenerationService.buildReplicateInput({
      model: model as AnimationModel,
      prompt,
      image,
      modelSettings: modelSettings as ModelSettings,
      referenceImages,
      lastFrameImage,
    });

    // Get model identifier
    const replicateModelId = VideoGenerationService.getReplicateModelId(model as AnimationModel);

    // Create Replicate prediction with webhook
    const webhookUrl = `${process.env.WEBHOOK_URL}/api/webhooks/replicate`;
    const prediction = await replicate.predictions.create({
      model: replicateModelId,
      input: replicateInput,
      webhook: webhookUrl,
      webhook_events_filter: ['completed'],
    });

    // Build metadata for storage
    const metadata = VideoGenerationService.buildMetadata({
      model: model as AnimationModel,
      prompt,
      image,
      modelSettings: modelSettings as ModelSettings,
      referenceImages,
      lastFrameImage,
    });

    // Create gallery entry with proper schema
    const { data: gallery, error: galleryError } = await supabase
      .from('gallery')
      .insert({
        user_id,
        prediction_id: prediction.id,
        generation_type: 'video',
        status: 'pending',
        metadata,
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
    console.error('Video generation error:', error);
    return NextResponse.json(
      { error: 'Failed to create video generation prediction' },
      { status: 500 }
    );
  }
}
